import { createClient } from 'npm:@base44/sdk@0.8.25';

// OUTBOUND notify Housing of arrival when trip is en_route or arrived AND
// the participant has a housing_bed_id. Standalone-safe.
Deno.serve(async (req) => {
  const startedAt = Date.now();
  let body: any = {};
  let idempotency_key = '';
  let entity_id: string | null = null;

  try {
    body = await req.json();
    const { trip_id, status } = body;
    if (!trip_id || !status) {
      return Response.json({ error: 'trip_id and status required' }, { status: 400 });
    }
    if (!['en_route', 'arrived', 'rider_picked_up', 'dropped_off'].includes(status)) {
      return Response.json({ success: true, skipped: 'status_not_relevant' });
    }

    const base44 = createClient({
      appId: Deno.env.get('BASE44_APP_ID') || '',
      apiKey: Deno.env.get('BASE44_SERVICE_ROLE_KEY') || '',
    });

    const trip = await base44.entities.TransportRequest.get(trip_id);
    if (!trip) return Response.json({ error: 'Trip not found' }, { status: 404 });
    entity_id = trip.id;

    let participant: any = null;
    if (trip.participant_id) {
      try {
        participant = await base44.entities.Participant.get(trip.participant_id);
      } catch (_) {}
    }
    if (!participant?.housing_bed_id) {
      return Response.json({ success: true, skipped: 'no_housing_bed_id' });
    }

    idempotency_key = `mrt-housing-${trip.id}-${status}`;

    const outboundBody = {
      trip_id: trip.id,
      property_id: participant.housing_property_id || null,
      bed_id: participant.housing_bed_id,
      participant_global_resident_id: participant.pathways_global_resident_id || null,
      status,
      eta: body.eta || null,
      arrived_at: status === 'arrived' || status === 'dropped_off' ? new Date().toISOString() : null,
      idempotency_key,
    };

    let baseUrl = Deno.env.get('HOUSING_APP_BASE_URL') || '';
    let enabled = true;
    try {
      const cfgs = await base44.entities.IntegrationConfig.filter(
        { app_name: 'housing' },
        '-created_date',
        1
      );
      if (cfgs.length > 0) {
        if (cfgs[0].base_url) baseUrl = cfgs[0].base_url;
        if (cfgs[0].enabled === false) enabled = false;
      }
    } catch (_) {}

    if (!enabled) return Response.json({ success: true, skipped: 'integration_disabled' });

    if (!baseUrl) {
      await queueRetry(base44, outboundBody, '/functions/receiveTransportArrivalNotice', 'no_base_url');
      return Response.json({ success: true, queued: true, reason: 'no_base_url' });
    }

    const url = `${baseUrl.replace(/\/$/, '')}/functions/receiveTransportArrivalNotice`;
    const secret = Deno.env.get('MRT_OUTBOUND_SECRET') || '';

    let resp: Response;
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-mrt-secret': secret },
        body: JSON.stringify(outboundBody),
      });
    } catch (netErr) {
      await queueRetry(base44, outboundBody, '/functions/receiveTransportArrivalNotice', `network: ${(netErr as Error).message}`);
      await audit(base44, false, (netErr as Error).message, startedAt, entity_id, idempotency_key, body);
      return Response.json({ success: true, queued: true });
    }

    if (!resp.ok) {
      const text = await resp.text();
      await queueRetry(base44, outboundBody, '/functions/receiveTransportArrivalNotice', `${resp.status}: ${text.slice(0, 500)}`);
      await audit(base44, false, `${resp.status}: ${text.slice(0, 200)}`, startedAt, entity_id, idempotency_key, body);
      return Response.json({ success: true, queued: true, status: resp.status });
    }

    try {
      await base44.entities.TransportRequest.update(trip.id, {
        last_synced_to_housing_at: new Date().toISOString(),
      });
    } catch (_) {}

    await audit(base44, true, undefined, startedAt, entity_id, idempotency_key, body);
    return Response.json({ success: true, synced: true });
  } catch (err) {
    return Response.json({ success: true, swallowed_error: (err as Error).message });
  }
});

async function queueRetry(base44: any, payload: any, endpoint_path: string, reason: string) {
  try {
    await base44.entities.OutboundIntegrationQueue.create({
      target_app: 'housing',
      endpoint_path,
      payload,
      status: 'pending',
      attempts: 0,
      last_error: reason,
      idempotency_key: payload.idempotency_key,
      global_resident_id: payload.participant_global_resident_id || null,
      created_at: new Date().toISOString(),
    });
  } catch (_) {}
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
      target_app: 'housing',
      latency_ms: Date.now() - startedAt,
      external_idempotency_key: idempotency_key,
      created_at: new Date().toISOString(),
    });
  } catch (_) {}
}
