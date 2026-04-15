import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { request_date, approved_only = true } = body;

  try {
    const requests = await base44.entities.TransportRequest.list('-created_date', 2000);
    const dateRequests = requests.filter(r => r.request_date === request_date);

    if (approved_only) {
      dateRequests.filter(r => ['approved', 'scheduled', 'driver_assigned'].includes(r.status));
    }

    const groups = [];

    // GROUP 1: Same pickup location
    const byPickupLocation = {};
    dateRequests.forEach(r => {
      const key = r.pickup_location;
      if (!byPickupLocation[key]) byPickupLocation[key] = [];
      byPickupLocation[key].push(r);
    });

    Object.entries(byPickupLocation).forEach(([location, rides]) => {
      if (rides.length >= 2) {
        // Check if timing allows grouping (all pickups within 15 min window)
        const times = rides.map(r => {
          const [h, m] = (r.pickup_time || '').split(':').map(Number);
          return h !== undefined ? h * 60 + (m || 0) : null;
        }).filter(t => t !== null);

        if (times.length > 1) {
          const minTime = Math.min(...times);
          const maxTime = Math.max(...times);
          if (maxTime - minTime <= 15) {
            groups.push({
              type: 'same_pickup_location',
              rides: rides.map(r => ({ id: r.id, name: r.participant_name, time: r.pickup_time })),
              reason: `All riders pickup from ${location} within 15 min window (${rides.length} riders)`,
              estimated_savings: `~${(rides.length - 1) * 10} min deadhead time`,
              confidence: 'high'
            });
          }
        }
      }
    });

    // GROUP 2: Same employer / work site
    const byPickupLoc = {};
    dateRequests.forEach(r => {
      if (r.linked_program) {
        const key = r.linked_program;
        if (!byPickupLoc[key]) byPickupLoc[key] = [];
        byPickupLoc[key].push(r);
      }
    });

    Object.entries(byPickupLoc).forEach(([program, rides]) => {
      if (rides.length >= 2) {
        const times = rides.map(r => {
          const [h, m] = (r.appointment_time || '').split(':').map(Number);
          return h !== undefined ? h * 60 + (m || 0) : null;
        }).filter(t => t !== null);

        if (times.length > 1) {
          const minTime = Math.min(...times);
          const maxTime = Math.max(...times);
          if (maxTime - minTime <= 30) {
            groups.push({
              type: 'same_appointment_location',
              rides: rides.map(r => ({ id: r.id, name: r.participant_name, destination: r.dropoff_location })),
              reason: `Multiple riders going to ${program} with similar appointment times (${rides.length} riders)`,
              estimated_savings: `~${(rides.length - 1) * 15} min consolidation savings`,
              confidence: 'high'
            });
          }
        }
      }
    });

    // GROUP 3: Same return trip time
    const returnTrips = dateRequests.filter(r => r.return_trip);
    const byReturnTime = {};
    returnTrips.forEach(r => {
      const key = r.return_pickup_time;
      if (key) {
        if (!byReturnTime[key]) byReturnTime[key] = [];
        byReturnTime[key].push(r);
      }
    });

    Object.entries(byReturnTime).forEach(([time, rides]) => {
      if (rides.length >= 2) {
        groups.push({
          type: 'return_trip_cluster',
          rides: rides.map(r => ({ id: r.id, name: r.participant_name, return_time: r.return_pickup_time })),
          reason: `${rides.length} riders with same return pickup time (${time}) - consolidate return route`,
          estimated_savings: `~${(rides.length - 1) * 20} min return trip efficiency`,
          confidence: 'high'
        });
      }
    });

    return Response.json({
      request_date,
      date_rides: dateRequests.length,
      grouped_rides: groups.length,
      total_groupable_riders: groups.reduce((sum, g) => sum + g.rides.length, 0),
      groups,
      summary: `Found ${groups.length} grouping opportunities covering ${new Set(groups.flatMap(g => g.rides.map(r => r.id))).size} riders`
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});