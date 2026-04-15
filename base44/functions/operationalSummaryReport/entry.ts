import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { start_date, end_date } = body;

  try {
    const requests = await base44.entities.TransportRequest.list('-created_date', 2000);
    const drivers = await base44.entities.Driver.list('first_name', 500);
    const vehicles = await base44.entities.Vehicle.list('nickname', 100);
    const participants = await base44.entities.Participant.list('-created_date', 500);

    // Filter by date range if provided
    let filtered = requests;
    if (start_date && end_date) {
      filtered = requests.filter(r => r.request_date >= start_date && r.request_date <= end_date);
    }

    const completed = filtered.filter(r => r.status === 'completed');
    const noShow = filtered.filter(r => r.status === 'no_show');
    const cancelled = filtered.filter(r => r.status === 'cancelled');
    const pending = filtered.filter(r => ['requested', 'pending', 'under_review', 'approved', 'scheduled', 'driver_assigned'].includes(r.status));
    const active = filtered.filter(r => ['en_route', 'rider_picked_up', 'in_progress'].includes(r.status));

    const completionRate = filtered.length > 0 ? Math.round(completed.length / filtered.length * 100) : 0;
    const noShowRate = filtered.length > 0 ? Math.round(noShow.length / filtered.length * 100) : 0;
    const cancellationRate = filtered.length > 0 ? Math.round(cancelled.length / filtered.length * 100) : 0;

    // Driver utilization
    const driverLoads = drivers.map(d => {
      const assigned = filtered.filter(r =>
        r.assigned_driver_id === d.id &&
        !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status)
      ).length;
      const completed_rides = filtered.filter(r =>
        r.assigned_driver_id === d.id &&
        r.status === 'completed'
      ).length;
      return {
        driver: `${d.first_name} ${d.last_name}`,
        current_load: assigned,
        completed: completed_rides,
        on_time_rate: d.on_time_rate || 100,
        status: d.availability
      };
    });

    // Vehicle utilization
    const vehicleLoads = vehicles.map(v => {
      const assigned = filtered.filter(r =>
        r.assigned_vehicle_id === v.id &&
        !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status)
      ).length;
      const completed_rides = filtered.filter(r =>
        r.assigned_vehicle_id === v.id &&
        r.status === 'completed'
      ).length;
      return {
        vehicle: v.nickname || `${v.make} ${v.model}`,
        current_load: assigned,
        completed: completed_rides,
        capacity: v.seat_capacity,
        status: v.service_status
      };
    });

    // Purpose breakdown
    const byPurpose = {};
    filtered.forEach(r => {
      if (r.purpose) {
        if (!byPurpose[r.purpose]) byPurpose[r.purpose] = 0;
        byPurpose[r.purpose]++;
      }
    });

    // Cost analysis
    const totalEstimated = filtered.reduce((sum, r) => sum + (r.estimated_cost || 0), 0);
    const totalActual = filtered.reduce((sum, r) => sum + (r.actual_cost || 0), 0);
    const avgCost = completed.length > 0 ? totalActual / completed.length : 0;

    return Response.json({
      period: { start_date, end_date },
      summary: {
        total_requests: filtered.length,
        completed: completed.length,
        no_show: noShow.length,
        cancelled: cancelled.length,
        pending: pending.length,
        active: active.length,
        completion_rate_pct: completionRate,
        no_show_rate_pct: noShowRate,
        cancellation_rate_pct: cancellationRate
      },
      operational_metrics: {
        avg_cost_per_ride: avgCost.toFixed(2),
        total_estimated_cost: totalEstimated.toFixed(2),
        total_actual_cost: totalActual.toFixed(2),
        efficiency_pct: totalEstimated > 0 ? Math.round(totalActual / totalEstimated * 100) : 0
      },
      driver_utilization: {
        active_drivers: drivers.filter(d => d.status === 'active').length,
        top_performer: driverLoads.sort((a, b) => (b.completed || 0) - (a.completed || 0))[0],
        avg_on_time_rate: drivers.length > 0 ? Math.round(drivers.reduce((s, d) => s + (d.on_time_rate || 100), 0) / drivers.length) : 100,
        driver_loads: driverLoads.sort((a, b) => (b.current_load || 0) - (a.current_load || 0))
      },
      vehicle_utilization: {
        active_vehicles: vehicles.filter(v => v.status === 'active').length,
        total_capacity: vehicles.reduce((sum, v) => sum + (v.seat_capacity || 0), 0),
        vehicle_loads: vehicleLoads.sort((a, b) => (b.current_load || 0) - (a.current_load || 0))
      },
      purpose_breakdown: byPurpose,
      recommendation: (() => {
        const recs = [];
        if (completionRate < 85) recs.push('Investigate causes of incomplete rides - completion rate below target');
        if (noShowRate > 10) recs.push('Consider reminder system for high no-show riders');
        if (cancellationRate > 15) recs.push('Review cancellation reasons to identify patterns');
        const overloaded = driverLoads.filter(d => d.current_load > 8);
        if (overloaded.length > 0) recs.push(`${overloaded.length} drivers overloaded - consider adding staff`);
        const lowOnTime = driverLoads.filter(d => d.on_time_rate < 85);
        if (lowOnTime.length > 0) recs.push(`${lowOnTime.length} drivers below 85% on-time rate - coaching recommended`);
        return recs.length > 0 ? recs : ['Operations performing well - maintain current practices'];
      })()
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});