import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { request_date } = await req.json();

    // Get all rides and deliveries for the date
    const rides = await base44.entities.TransportRequest.filter({
      request_date,
      status: { $nin: ['completed', 'cancelled', 'denied'] }
    });

    // Get all drivers
    const drivers = await base44.entities.Driver.filter({
      status: 'active'
    });

    const utilization = [];

    for (const driver of drivers) {
      const driverRides = rides.filter(r => r.assigned_driver_id === driver.driver_id);
      
      // Calculate time blocks occupied
      const timeBlocks = new Set(driverRides.map(r => r.time_block));
      
      // Find free time blocks
      const allBlocks = ['morning', 'midday', 'afternoon', 'evening'];
      const freeBlocks = allBlocks.filter(b => !timeBlocks.has(b));

      // Find delivery jobs that fit free blocks
      const availableDeliveries = rides.filter(r =>
        ['package_delivery', 'medical_delivery', 'contract_route'].includes(r.service_type) &&
        freeBlocks.includes(r.time_block) &&
        !r.assigned_driver_id
      );

      utilization.push({
        driver_id: driver.driver_id,
        driver_name: `${driver.first_name} ${driver.last_name}`,
        assigned_jobs: driverRides.length,
        occupied_blocks: Array.from(timeBlocks),
        free_blocks: freeBlocks,
        available_deliveries: availableDeliveries.length,
        utilization_percentage: Math.round((driverRides.length / 4) * 100), // 4 time blocks
        recommendations: generateRecommendations(driverRides, availableDeliveries, freeBlocks)
      });
    }

    return Response.json({
      status: 'success',
      request_date,
      driver_utilization: utilization,
      summary: {
        total_drivers: drivers.length,
        drivers_fully_utilized: utilization.filter(u => u.utilization_percentage >= 75).length,
        available_delivery_slots: utilization.reduce((sum, u) => sum + u.available_deliveries, 0)
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateRecommendations(rides, availableDeliveries, freeBlocks) {
  const recs = [];

  if (freeBlocks.length > 0 && availableDeliveries.length > 0) {
    recs.push({
      type: 'fill_idle_time',
      message: `Assign delivery jobs during ${freeBlocks.join(', ')} to improve utilization`,
      estimated_additional_revenue: availableDeliveries.length * 50 // Placeholder
    });
  }

  if (rides.some(r => r.service_type === 'client_transport') && 
      freeBlocks.includes('morning')) {
    recs.push({
      type: 'prioritize_client_transport',
      message: 'Morning block should prioritize client transport for reliability'
    });
  }

  return recs;
}