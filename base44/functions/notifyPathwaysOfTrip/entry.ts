import { createClient } from 'npm:@base44/sdk@0.8.25';

// OUTBOUND notify Pathways of a TransportRequest status change.
// Standalone-safe: every failure is queued for retry; never throws.
Deno.serve(async (req) => {
  const startedAt = Date.now();
  let body: any = {};
  let idempotency_key = '';
  let auditEntityId: string | null = null;

  try {
    body = await req.json();
    const { trip_id, status } = body;

    if (!trip_id || !status) {
      return Response.json({ error: 'trip_id and status required' }, { status: 400 });
    }

    const base44 = createClient({
      appId: Deno.env.get('BASE44_APP_ID') || '',
      apiKey: Deno.env.get('BASE44_SERVICE_ROLE_KEY') || '',
    });

    const trip = await base44.entities.TransportRequest.get(trip_id);
    if (!trip) return Response.json({ error: 'Trip not found' }, { status: 404 });
    auditEntityId = trip.id;

    const global_resident_id = trip.pathways_global_resident_id;
    if (!global_resident_id) {
      // Standalone trip, nothing to do
      return Response.json({ success: true, skipped: 'no_global_resident_id' });
    }

    idempotency_key = `mrt-trip-${trip.id}-${status}-${trip.updated_date || trip.created_date || ''}`;

    const outboundBody = {
      global_resident_id,
      trip_id: trip.id,
      pathways_request_id: trip.pathways_request_id || null,
      status,
      pickup_at: trip.picked_up_at || null,
      dropoff_at: trip.dropped_off_at || null,
      mileage: trip.mileage || null,
      idempotency_key,
    };

    // Resolve target URL
    let baseUrl = Deno.env.get('PATHWAYS_APP_BASE_URL') || '';
    let enabled = true;
    try {
      const cfgs = await base44.entities.IntegrationConfig.filter(
        { app_name: 'pathways' },
        '-created_date',
        1
      );
      if (cfgs.length > 0) {
        if (cfgs[0].base_url) baseUrl = cfgs[0].base_url;
        if (cfgs[0].enabled === false) enabled = false;
      }
    } catch (_) {}

    if (!enabled) {
      return Response.json({ success: true, skipped: 'integration_disabled' });
    }
    if (!baseUrl) {
      // Queue and return success
      await queueRetry(base44, outboundBody, '/functions/receiveTripFromMRT', global_resident_id, 'no_base_url');
      return Response.json({ success: true, queued: true, reason: 'no_base_url' });
    }

    const url = `${baseUrl.replace(/\/$/, '')}/functions/receiveTripFromMRT`;
    const secret = Deno.env.get('MRT_OUTBOUND_SECRET') || '';

    let resp: Response;
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mrt-secret': secret,
        },
        body: JSON.stringify(outboundBody),
      });
    } catch (netErr) {
      await queueRetry(
        base44,
        outboundBody,
        '/functions/receiveTripFromMRT',
        global_resident_id,
        `network: ${(netErr as Error).message}`
      );
      await audit(base44, false, (netErr as Error).message, startedAt, auditEntityId, idempotency_key, body);
      return Response.json({ success: true, queued: true, error: (netErr as Error).message });
    }

    if (!resp.ok) {
      const text = await resp.text();
      await queueRetry(
        base44,
        outboundBody,
        '/functions/receiveTripFromMRT',
        global_resident_id,
        `${resp.status}: ${text.slice(0, 500)}`
      );
      await audit(base44, false, `${resp.status}: ${text.slice(0, 200)}`, startedAt, auditEntityId, idempotency_key, body);
      return Response.json({ success: true, queued: true, status: resp.status });
    }

    // Success path: update sync stamp
    try {
      await base44.entities.TransportRequest.update(trip.id, {
        last_synced_to_pathways_at: new Date().toISOString(),
        sync_status: 'synced',
      });
    } catch (_) {}

    await audit(base44, true, undefined, startedAt, auditEntityId, idempotency_key, body);
    return Response.json({ success: true, synced: true });
  } catch (err) {
    // Last-resort catch: never throw out of this function
    return Response.json({ success: true, swallowed_error: (err as Error).message });
  }
});

async function queueRetry(
  base44: any,
  payload: any,
  endpoint_path: string,
  global_resident_id: string,
  reason: string
) {
  try {
    await base44.entities.OutboundIntegrationQueue.create({
      target_app: 'pathways',
      endpoint_path,
      payload,
      status: 'pending',
      attempts: 0,
      last_error: reason,
      idempotency_key: payload.idempotency_key,
      global_resident_id,
      created_at: new Date().toISOString(),
    });
  } catch (_) {
    // queue is best-effort; never throw
  }
}

async function audit(
  base44: any,
  success: boolean,
  error: string | undefined,
  startedAt: number,
  entity_id: string | null,
  idempotency_key: string,
  payload: any
) {
  try {
    await base44.entities.AuditLog.create({
      action_type: success ? 'outbound_sent' : 'outbound_failed',
      entity_type: 'TransportRequest',
      entity_id,
      user_id: 'system',
      payload,
      success,
      error,
      target_app: 'pathways',
      latency_ms: Date.now() - startedAt,
      external_idempotency_key: idempotency_key,
      created_at: new Date().toISOString(),
    });
  } catch (_) {}
}
