import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { ride_id } = body;

  try {
    const ride = await base44.entities.TransportRequest.get(ride_id);
    if (!ride) return Response.json({ error: 'Ride not found' }, { status: 404 });

    const drivers = await base44.entities.Driver.list('first_name', 500);
    const vehicles = await base44.entities.Vehicle.list('nickname', 100);
    const allRequests = await base44.entities.TransportRequest.list('-created_date', 2000);

    // Filter available drivers
    const availableDrivers = drivers.filter(d =>
      d.status === 'active' &&
      d.availability !== 'on_leave' &&
      d.license_status !== 'expired' &&
      d.insurance_status !== 'expired'
    );

    // Filter available vehicles
    const availableVehicles = vehicles.filter(v =>
      v.status === 'active' &&
      v.service_status === 'available'
    );

    // Score each driver for this ride
    const scored = availableDrivers.map(driver => {
      let score = 100;
      const conflicts = [];

      // Check time conflict (ride within 90 min of existing ride)
      const [reqH, reqM] = (ride.pickup_time || '').split(':').map(Number);
      if (reqH !== undefined) {
        const reqMin = reqH * 60 + (reqM || 0);
        const conflict = allRequests.some(r =>
          r.assigned_driver_id === driver.id &&
          r.request_date === ride.request_date &&
          r.pickup_time &&
          !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status) &&
          (() => {
            const [h, m] = r.pickup_time.split(':').map(Number);
            return Math.abs(h * 60 + (m || 0) - reqMin) < 90;
          })()
        );
        if (conflict) {
          score -= 40;
          conflicts.push('time_conflict_90min');
        }
      }

      // Service area match
      if (driver.service_area && ride.service_zone && driver.service_area !== ride.service_zone) {
        score -= 10;
      } else if (driver.service_area === ride.service_zone) {
        score += 15;
      }

      // Preferred rider match
      if (driver.preferred_client_ids?.includes(ride.participant_id)) {
        score += 20;
      }

      // Shift schedule match
      if (driver.shift_schedule && ride.pickup_time) {
        const [h] = ride.pickup_time.split(':').map(Number);
        // Very basic check: if ride is within shift, good
        if (h >= 6 && h < 17) score += 5;
      }

      // Current load (rides already assigned)
      const driverLoad = allRequests.filter(r =>
        r.assigned_driver_id === driver.id &&
        r.request_date === ride.request_date &&
        !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status)
      ).length;
      if (driverLoad > 8) score -= 20;
      if (driverLoad > 5) score -= 10;

      // On-time rate
      score += (driver.on_time_rate || 100) * 0.1;

      // Availability status
      if (driver.availability === 'on_duty') score += 10;

      return {
        driver_id: driver.id,
        driver_name: `${driver.first_name} ${driver.last_name}`,
        score: Math.max(0, score),
        conflicts,
        current_load: driverLoad,
        on_time_rate: driver.on_time_rate,
        service_area: driver.service_area,
        shift_schedule: driver.shift_schedule,
        availability: driver.availability
      };
    }).sort((a, b) => b.score - a.score);

    // Select best vehicle (prefer wheelchair accessible if needed, prefer available status)
    const vehicleOptions = availableVehicles
      .filter(v => !v.assigned_driver_id || v.assigned_driver_id === scored[0]?.driver_id)
      .map(v => ({
        vehicle_id: v.id,
        vehicle_name: v.nickname || `${v.make} ${v.model}`,
        seat_capacity: v.seat_capacity,
        wheelchair_accessible: v.wheelchair_accessible,
        assigned_driver: v.assigned_driver_name
      }))
      .sort((a, b) => {
        // Prefer already assigned to the top driver
        if (a.assigned_driver && !b.assigned_driver) return -1;
        return 0;
      });

    const topDriver = scored[0];
    const recommendedVehicle = vehicleOptions[0];

    return Response.json({
      request_id: ride_id,
      status: 'success',
      recommendation: {
        confidence: topDriver?.score >= 80 ? 'high' : topDriver?.score >= 50 ? 'medium' : 'low',
        score: topDriver?.score,
        recommended_driver: topDriver,
        recommended_vehicle: recommendedVehicle,
        auto_assign_eligible: topDriver?.score >= 75 && !topDriver?.conflicts.includes('time_conflict_90min')
      },
      ranked_drivers: scored.slice(0, 5),
      all_driver_options: scored,
      vehicle_options: vehicleOptions
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});