import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { request_id } = body;

  try {
    const ride = await base44.entities.TransportRequest.get(request_id);
    if (!ride) return Response.json({ error: 'Ride not found' }, { status: 404 });

    // Record confirmation in driver notes
    const timestamp = new Date().toISOString();
    const confirmation = `[Rider Confirmed Ready at ${timestamp}]`;
    const updatedNotes = (ride.driver_notes || '') + '\n' + confirmation;

    await base44.entities.TransportRequest.update(request_id, {
      driver_notes: updatedNotes
    });

    return Response.json({
      success: true,
      request_id,
      confirmed_at: timestamp,
      participant_name: ride.participant_name,
      pickup_time: ride.pickup_time
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});