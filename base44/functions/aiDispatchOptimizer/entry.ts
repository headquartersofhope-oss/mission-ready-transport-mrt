import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { request_date } = await req.json();

    // Get all rides and deliveries
    const rides = await base44.entities.TransportRequest.filter({
      request_date,
      status: { $nin: ['completed', 'cancelled', 'denied'] }
    });

    const drivers = await base44.entities.Driver.filter({ status: 'active' });
    const vehicles = await base44.entities.Vehicle.filter({ status: 'active' });

    // Separate by type
    const clientTransport = rides.filter(r => r.service_type === 'client_transport');
    const deliveries = rides.filter(r => ['package_delivery', 'medical_delivery', 'contract_route'].includes(r.service_type));
    const unassigned = rides.filter(r => !r.assigned_driver_id);

    const recommendations = [];

    // 1. Prioritize unassigned client transport
    const unassignedClientTransport = unassigned.filter(r => r.service_type === 'client_transport');
    if (unassignedClientTransport.length > 0) {
      recommendations.push({
        priority: 'critical',
        type: 'assign_client_transport',
        count: unassignedClientTransport.length,
        message: `Assign ${unassignedClientTransport.length} unassigned client transport rides (HIGH PRIORITY)`,
        estimated_impact: 'Ensures reliable service delivery for nonprofit participants'
      });
    }

    // 2. Batch and fill idle time with deliveries
    const assignedDrivers = new Set(rides.filter(r => r.assigned_driver_id).map(r => r.assigned_driver_id));
    const idleDrivers = drivers.filter(d => !assignedDrivers.has(d.driver_id));
    const unassignedDeliveries = unassigned.filter(r => ['package_delivery', 'medical_delivery'].includes(r.service_type));

    if (idleDrivers.length > 0 && unassignedDeliveries.length > 0) {
      recommendations.push({
        priority: 'high',
        type: 'fill_idle_with_deliveries',
        drivers: idleDrivers.length,
        deliveries: unassignedDeliveries.length,
        message: `Use ${idleDrivers.length} idle drivers to batch ${unassignedDeliveries.length} delivery jobs`,
        estimated_impact: `Potential revenue: $${unassignedDeliveries.length * 50}-${unassignedDeliveries.length * 75}`
      });
    }

    // 3. Optimize existing delivery routes
    const driverUtilization = {};
    for (const ride of rides) {
      if (ride.assigned_driver_id) {
        driverUtilization[ride.assigned_driver_id] = (driverUtilization[ride.assigned_driver_id] || 0) + 1;
      }
    }

    const overbooked = Object.entries(driverUtilization)
      .filter(([, count]) => count > 4)
      .map(([driverId]) => drivers.find(d => d.driver_id === driverId));

    if (overbooked.length > 0) {
      recommendations.push({
        priority: 'medium',
        type: 'rebalance_workload',
        drivers: overbooked.length,
        message: `${overbooked.length} drivers are overbooked. Consider reassigning some deliveries`,
        estimated_impact: 'Improves on-time performance and driver satisfaction'
      });
    }

    // 4. Time block optimization
    const morningJobs = rides.filter(r => r.time_block === 'morning' && r.service_type === 'client_transport');
    const afternoonJobs = rides.filter(r => r.time_block === 'afternoon' && r.service_type === 'package_delivery');

    if (morningJobs.length > 0 && afternoonJobs.length > 0) {
      recommendations.push({
        priority: 'medium',
        type: 'maintain_time_blocks',
        message: 'Morning prioritized for client transport, afternoon for deliveries (OPTIMAL SCHEDULE)',
        estimated_impact: 'Prevents service conflicts and maintains reliability'
      });
    }

    // 5. Route optimization savings
    const deliveryRoutes = await base44.entities.DeliveryRoute.filter({ route_date: request_date });
    const totalOptimizationSavings = deliveryRoutes.reduce((sum, r) => sum + (r.optimization_savings_minutes || 0), 0);

    if (totalOptimizationSavings > 0) {
      recommendations.push({
        priority: 'info',
        type: 'optimization_savings',
        savings_minutes: totalOptimizationSavings,
        message: `Route optimization saves ${totalOptimizationSavings} minutes across all delivery routes`,
        estimated_impact: `Equivalent to ${Math.round(totalOptimizationSavings / 60)} additional complete routes`
      });
    }

    return Response.json({
      status: 'success',
      request_date,
      summary: {
        total_rides: rides.length,
        client_transport: clientTransport.length,
        deliveries: deliveries.length,
        unassigned: unassigned.length,
        driver_utilization: Object.keys(driverUtilization).length,
        idle_drivers: idleDrivers.length
      },
      recommendations: recommendations.sort((a, b) => {
        const priorityMap = { critical: 0, high: 1, medium: 2, info: 3 };
        return priorityMap[a.priority] - priorityMap[b.priority];
      })
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});