import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { driver_id, request_date, grouped_ride_ids = [] } = body;

  try {
    if (!driver_id || !request_date || grouped_ride_ids.length === 0) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const requests = await base44.entities.TransportRequest.list('-created_date', 2000);
    const rides = requests.filter(r => grouped_ride_ids.includes(r.id) && r.request_date === request_date);

    if (rides.length === 0) {
      return Response.json({ error: 'No rides found for planning' }, { status: 404 });
    }

    // PICKUP ORDER: Sort by pickup time, then by appointment time slack
    const pickupOrder = rides
      .map(r => {
        const [h, m] = (r.pickup_time || '').split(':').map(Number);
        const pickupMin = h !== undefined ? h * 60 + (m || 0) : 1440;
        const [ah, am] = (r.appointment_time || '').split(':').map(Number);
        const appointmentMin = ah !== undefined ? ah * 60 + (am || 0) : null;
        const slack = appointmentMin ? appointmentMin - pickupMin : 120; // Default 2hr slack
        return { ...r, pickupMin, appointmentMin, slack };
      })
      .sort((a, b) => {
        // Sort by pickup time
        if (a.pickupMin !== b.pickupMin) return a.pickupMin - b.pickupMin;
        // Then by appointment time (earliest deadline first)
        if (a.appointmentMin && b.appointmentMin) return a.appointmentMin - b.appointmentMin;
        return 0;
      })
      .map((r, idx) => ({
        stop_sequence: idx + 1,
        request_id: r.id,
        participant_name: r.participant_name,
        pickup_location: r.pickup_location,
        scheduled_pickup_time: r.pickup_time,
        estimated_arrival_time: r.pickup_time, // In real system, calculate based on route
        notes: r.special_instructions
      }));

    // DROPOFF ORDER: Sort to maximize appointment compliance
    const dropoffOrder = rides
      .filter(r => !r.return_trip) // Handle dropoffs first
      .map(r => {
        const [ah, am] = (r.appointment_time || '').split(':').map(Number);
        const appointmentMin = ah !== undefined ? ah * 60 + (am || 0) : 1440;
        return { ...r, appointmentMin };
      })
      .sort((a, b) => a.appointmentMin - b.appointmentMin)
      .map((r, idx) => ({
        stop_sequence: idx + 1,
        request_id: r.id,
        participant_name: r.participant_name,
        dropoff_location: r.dropoff_location,
        appointment_time: r.appointment_time,
        scheduled_dropoff_time: r.appointment_time,
        estimated_arrival_time: r.appointment_time
      }));

    // Check on-time risk
    const allAppointments = rides
      .filter(r => r.appointment_time)
      .map(r => {
        const [h, m] = (r.appointment_time || '').split(':').map(Number);
        return h * 60 + (m || 0);
      });
    const latestAppointment = Math.max(...allAppointments);
    const [lh, lm] = rides[0]?.pickup_time?.split(':').map(Number) || [9, 0];
    const latestPickupMin = lh * 60 + (lm || 0);
    const estimatedTravelAndWait = latestAppointment - latestPickupMin;

    const onTimeRisk = estimatedTravelAndWait > 150 ? 'high' : estimatedTravelAndWait > 90 ? 'medium' : 'low';

    // Calculate estimated duration (very basic: 5 min per pickup/dropoff + 20 min buffer)
    const totalStops = pickupOrder.length + dropoffOrder.length;
    const estimatedDuration = totalStops * 5 + 20;

    return Response.json({
      driver_id,
      request_date,
      rides_grouped: grouped_ride_ids.length,
      pickup_order: pickupOrder,
      dropoff_order: dropoffOrder,
      total_estimated_duration: estimatedDuration,
      on_time_risk: onTimeRisk,
      grouping_reason: `${grouped_ride_ids.length} riders grouped for efficient pickup and drop-off sequencing`,
      optimization_notes: [
        `Pickups ordered by time: earliest first`,
        `Dropoffs sequenced by appointment deadline to minimize lateness risk`,
        `On-time risk: ${onTimeRisk} - ${onTimeRisk === 'high' ? 'consider splitting group or adjusting timeline' : 'route timing acceptable'}`,
        `Estimated total route time: ${estimatedDuration} minutes including stops and buffers`
      ]
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});