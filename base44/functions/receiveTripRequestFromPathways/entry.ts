import { createClient } from 'npm:@base44/sdk@0.8.25';

// INBOUND from Pathways. Creates a TransportRequest from a Pathways trip request.
// Idempotent via IncomingBookingEvent.idempotency_key.
Deno.serve(async (req) => {
  const startedAt = Date.now();
  let auditPayload: Record<string, unknown> = {};
  let success = false;
  let errorMsg: string | undefined;

  try {
    // Auth: shared secret header
    const presented = req.headers.get('x-pathways-secret') || '';
    const expected = Deno.env.get('PATHWAYS_INBOUND_SECRET') || '';
    if (!expected || presented !== expected) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    auditPayload = body;

    const {
      global_resident_id,
      pickup,
      dropoff,
      requested_at,
      urgency,
      special_needs,
      idempotency_key,
      pathways_request_id,
    } = body;

    if (!idempotency_key) {
      return Response.json({ error: 'idempotency_key required' }, { status: 400 });
    }
    if (!global_resident_id || !pickup || !dropoff) {
      return Response.json(
        { error: 'global_resident_id, pickup, dropoff required' },
        { status: 400 }
      );
    }

    // Service-role client for cross-context writes
    const base44 = createClient({
      appId: Deno.env.get('BASE44_APP_ID') || '',
      apiKey: Deno.env.get('BASE44_SERVICE_ROLE_KEY') || '',
    });

    // Idempotency check
    const existing = await base44.entities.IncomingBookingEvent.filter(
      { idempotency_key },
      '-created_date',
      1
    );
    if (existing.length > 0) {
      const prior = existing[0];
      return Response.json({
        success: true,
        deduped: true,
        transport_request_id: prior.resulting_transport_request_id,
        status: prior.status,
      });
    }

    // Record inbound event
    const event = await base44.entities.IncomingBookingEvent.create({
      source_app: 'pathways',
      external_request_id: pathways_request_id || null,
      payload: body,
      idempotency_key,
      status: 'received',
    });

    // Look up Participant by global_resident_id
    let participant: any = null;
    const matches = await base44.entities.Participant.filter(
      { pathways_global_resident_id: global_resident_id },
      '-created_date',
      1
    );
    if (matches.length > 0) {
      participant = matches[0];
    }

    const priorityMap: Record<string, string> = {
      low: 'standard',
      normal: 'standard',
      high: 'high',
      urgent: 'urgent',
      emergency: 'urgent',
    };

    const requestedDate = requested_at ? requested_at.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const requestedTime = requested_at && requested_at.length >= 16 ? requested_at.slice(11, 16) : '';

    const tr = await base44.entities.TransportRequest.create({
      participant_id: participant?.id || null,
      participant_name: participant ? `${participant.first_name} ${participant.last_name}` : null,
      pickup_location: typeof pickup === 'string' ? pickup : pickup?.address,
      dropoff_location: typeof dropoff === 'string' ? dropoff : dropoff?.address,
      pickup_time: requestedTime,
      request_date: requestedDate,
      priority: priorityMap[urgency] || 'standard',
      special_instructions: special_needs || null,
      status: 'requested',
      pathways_global_resident_id: global_resident_id,
      pathways_request_id: pathways_request_id || null,
      sync_status: 'synced',
      last_synced_to_pathways_at: new Date().toISOString(),
      source_app: 'pathways',
    });

    await base44.entities.IncomingBookingEvent.update(event.id, {
      status: 'converted',
      resulting_transport_request_id: tr.id,
      processed_at: new Date().toISOString(),
    });

    success = true;

    // Audit (best-effort)
    try {
      await base44.entities.AuditLog.create({
        action_type: 'inbound_received',
        entity_type: 'TransportRequest',
        entity_id: tr.id,
        user_id: 'system',
        payload: body,
        success: true,
        target_app: 'pathways',
        latency_ms: Date.now() - startedAt,
        external_idempotency_key: idempotency_key,
        created_at: new Date().toISOString(),
      });
    } catch (_) {
      // never fail the inbound on audit
    }

    return Response.json({ success: true, transport_request_id: tr.id });
  } catch (err) {
    errorMsg = (err as Error).message;
    try {
      const base44 = createClient({
        appId: Deno.env.get('BASE44_APP_ID') || '',
        apiKey: Deno.env.get('BASE44_SERVICE_ROLE_KEY') || '',
      });
      await base44.entities.AuditLog.create({
        action_type: 'inbound_received',
        entity_type: 'TransportRequest',
        user_id: 'system',
        payload: auditPayload,
        success: false,
        error: errorMsg,
        target_app: 'pathways',
        latency_ms: Date.now() - startedAt,
        created_at: new Date().toISOString(),
      });
    } catch (_) {
      // ignore
    }
    return Response.json({ error: errorMsg }, { status: 500 });
  }
});
