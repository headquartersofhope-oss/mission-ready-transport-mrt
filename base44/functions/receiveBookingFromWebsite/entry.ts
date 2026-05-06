import { createClient } from 'npm:@base44/sdk@0.8.25';

// INBOUND from mrt-connect (booking website). Creates Participant if missing,
// then a TransportRequest. Idempotent via IncomingBookingEvent.
Deno.serve(async (req) => {
  const startedAt = Date.now();
  let auditPayload: Record<string, unknown> = {};

  try {
    const presented = req.headers.get('x-mrt-website-secret') || '';
    const expected = Deno.env.get('MRT_WEBSITE_INBOUND_SECRET') || '';
    if (!expected || presented !== expected) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    auditPayload = body;

    const {
      idempotency_key,
      first_name,
      last_name,
      phone,
      email,
      pickup_location,
      dropoff_location,
      pickup_time,
      request_date,
      service_type,
      purpose,
      priority,
      special_instructions,
      external_request_id,
    } = body;

    if (!idempotency_key) {
      return Response.json({ error: 'idempotency_key required' }, { status: 400 });
    }
    if (!pickup_location || !dropoff_location) {
      return Response.json(
        { error: 'pickup_location and dropoff_location required' },
        { status: 400 }
      );
    }

    const base44 = createClient({
      appId: Deno.env.get('BASE44_APP_ID') || '',
      apiKey: Deno.env.get('BASE44_SERVICE_ROLE_KEY') || '',
    });

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

    const event = await base44.entities.IncomingBookingEvent.create({
      source_app: 'mrt_website',
      external_request_id: external_request_id || null,
      payload: body,
      idempotency_key,
      status: 'received',
    });

    // Lookup Participant by phone, then email
    let participant: any = null;
    if (phone) {
      const byPhone = await base44.entities.Participant.filter({ phone }, '-created_date', 1);
      if (byPhone.length > 0) participant = byPhone[0];
    }
    if (!participant && email) {
      const byEmail = await base44.entities.Participant.filter({ email }, '-created_date', 1);
      if (byEmail.length > 0) participant = byEmail[0];
    }

    if (!participant) {
      participant = await base44.entities.Participant.create({
        first_name: first_name || 'Website',
        last_name: last_name || 'Lead',
        phone: phone || null,
        email: email || null,
        source: 'website',
        status: 'active',
      });
    }

    const tr = await base44.entities.TransportRequest.create({
      participant_id: participant.id,
      participant_name: `${participant.first_name} ${participant.last_name}`,
      pickup_location,
      dropoff_location,
      pickup_time: pickup_time || null,
      request_date: request_date || new Date().toISOString().slice(0, 10),
      service_type: service_type || 'client_transport',
      purpose: purpose || null,
      priority: priority || 'standard',
      special_instructions: special_instructions || null,
      status: 'requested',
      source_app: 'mrt_website',
      sync_status: 'standalone',
    });

    await base44.entities.IncomingBookingEvent.update(event.id, {
      status: 'converted',
      resulting_transport_request_id: tr.id,
      processed_at: new Date().toISOString(),
    });

    try {
      await base44.entities.AuditLog.create({
        action_type: 'inbound_received',
        entity_type: 'TransportRequest',
        entity_id: tr.id,
        user_id: 'system',
        payload: body,
        success: true,
        target_app: 'mrt_website',
        latency_ms: Date.now() - startedAt,
        external_idempotency_key: idempotency_key,
        created_at: new Date().toISOString(),
      });
    } catch (_) {}

    return Response.json({
      success: true,
      transport_request_id: tr.id,
      participant_id: participant.id,
    });
  } catch (err) {
    const errorMsg = (err as Error).message;
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
        target_app: 'mrt_website',
        latency_ms: Date.now() - startedAt,
        created_at: new Date().toISOString(),
      });
    } catch (_) {}
    return Response.json({ error: errorMsg }, { status: 500 });
  }
});
