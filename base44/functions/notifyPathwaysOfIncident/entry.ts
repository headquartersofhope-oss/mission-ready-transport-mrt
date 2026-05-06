import { createClient } from 'npm:@base44/sdk@0.8.25';

// OUTBOUND notify Pathways when an Incident is created with notify_pathways=true.
// Standalone-safe.
Deno.serve(async (req) => {
  const startedAt = Date.now();
  let body: any = {};
  let idempotency_key = '';
  let entity_id: string | null = null;

  try {
    body = await req.json();
    const { incident_id } = body;
    if (!incident_id) return Response.json({ error: 'incident_id required' }, { status: 400 });

    const base44 = createClient({
      appId: Deno.env.get('BASE44_APP_ID') || '',
      apiKey: Deno.env.get('BASE44_SERVICE_ROLE_KEY') || '',
    });

    const incident = await base44.entities.Incident.get(incident_id);
    if (!incident) return Response.json({ error: 'Incident not found' }, { status: 404 });
    entity_id = incident.id;

    if (!incident.notify_pathways) {
      return Response.json({ success: true, skipped: 'notify_pathways_false' });
    }
    if (!incident.pathways_global_resident_id) {
      return Response.json({ success: true, skipped: 'no_global_resident_id' });
    }

    idempotency_key = `mrt-incident-${incident.id}-${incident.status || 'open'}`;

    const outboundBody = {
      global_resident_id: incident.pathways_global_resident_id,
      incident_id: incident.id,
      incident_type: incident.incident_type,
      severity: incident.severity,
      status: incident.status,
      ride_request_id: incident.ride_request_id || null,
      participant_name: incident.participant_name || null,
      driver_name: incident.driver_name || null,
      incident_date: incident.incident_date,
      description: incident.description,
      idempotency_key,
    };

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

    if (!enabled) return Response.json({ success: true, skipped: 'integration_disabled' });
    if (!baseUrl) {
      await queueRetry(base44, outboundBody, '/functions/receiveIncidentFromMRT', 'no_base_url');
      return Response.json({ success: true, queued: true });
    }

    const url = `${baseUrl.replace(/\/$/, '')}/functions/receiveIncidentFromMRT`;
    const secret = Deno.env.get('MRT_OUTBOUND_SECRET') || '';

    let resp: Response;
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-mrt-secret': secret },
        body: JSON.stringify(outboundBody),
      });
    } catch (netErr) {
      await queueRetry(base44, outboundBody, '/functions/receiveIncidentFromMRT', `network: ${(netErr as Error).message}`);
      await audit(base44, false, (netErr as Error).message, startedAt, entity_id, idempotency_key, body);
      return Response.json({ success: true, queued: true });
    }

    if (!resp.ok) {
      const text = await resp.text();
      await queueRetry(base44, outboundBody, '/functions/receiveIncidentFromMRT', `${resp.status}: ${text.slice(0, 500)}`);
      await audit(base44, false, `${resp.status}`, startedAt, entity_id, idempotency_key, body);
      return Response.json({ success: true, queued: true, status: resp.status });
    }

    await audit(base44, true, undefined, startedAt, entity_id, idempotency_key, body);
    return Response.json({ success: true, synced: true });
  } catch (err) {
    return Response.json({ success: true, swallowed_error: (err as Error).message });
  }
});

async function queueRetry(base44: any, payload: any, endpoint_path: string, reason: string) {
  try {
    await base44.entities.OutboundIntegrationQueue.create({
      target_app: 'pathways',
      endpoint_path,
      payload,
      status: 'pending',
      attempts: 0,
      last_error: reason,
      idempotency_key: payload.idempotency_key,
      global_resident_id: payload.global_resident_id || null,
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
      entity_type: 'Incident',
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
