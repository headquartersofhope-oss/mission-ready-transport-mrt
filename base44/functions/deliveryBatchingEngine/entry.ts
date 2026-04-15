import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { request_date, service_type = 'package_delivery' } = await req.json();

    // Get all approved delivery jobs for the date
    const deliveryJobs = await base44.entities.TransportRequest.filter({
      request_date,
      service_type: { $in: ['package_delivery', 'medical_delivery', 'contract_route'] },
      status: { $in: ['approved', 'scheduled'] }
    });

    // Get available drivers
    const drivers = await base44.entities.Driver.filter({
      status: 'active',
      availability: { $in: ['available', 'on_duty'] }
    });

    // Get available vehicles
    const vehicles = await base44.entities.Vehicle.filter({
      status: 'active',
      service_status: { $in: ['available', 'in_use'] }
    });

    const batches = [];
    const assignedJobs = new Set();

    // Greedy batching algorithm
    for (const driver of drivers) {
      const driverVehicle = vehicles.find(v => v.driver_id === driver.driver_id);
      if (!driverVehicle) continue;

      const batchJobs = [];
      const batchCapacity = driverVehicle.seat_capacity || 7;

      // Find jobs that can be batched together
      for (const job of deliveryJobs) {
        if (assignedJobs.has(job.id)) continue;
        if (batchJobs.length >= batchCapacity) break;

        // Check if job is compatible with batch
        const sameTimeBlock = !batchJobs.length || 
          batchJobs.every(j => j.time_block === job.time_block);
        
        if (sameTimeBlock) {
          batchJobs.push(job);
          assignedJobs.add(job.id);
        }
      }

      if (batchJobs.length > 0) {
        // Optimize route order
        const optimizedRoute = optimizeDeliveryRoute(batchJobs);
        
        // Create delivery route
        const route = {
          route_date: request_date,
          driver_id: driver.driver_id,
          driver_name: `${driver.first_name} ${driver.last_name}`,
          vehicle_id: driverVehicle.vehicle_id,
          vehicle_name: driverVehicle.nickname || driverVehicle.make,
          route_type: service_type,
          stops: optimizedRoute.map((job, idx) => ({
            stop_sequence: idx + 1,
            request_id: job.id,
            pickup_location: job.pickup_location,
            dropoff_location: job.dropoff_location,
            package_type: job.package_type,
            scheduled_pickup_time: job.pickup_time,
            scheduled_dropoff_time: job.appointment_time,
            notes: job.handling_instructions
          })),
          route_status: 'planned',
          total_estimated_duration: calculateRouteDuration(optimizedRoute),
          route_optimized: true
        };

        batches.push(route);

        // Mark jobs with route assignment
        for (const job of optimizedRoute) {
          await base44.entities.TransportRequest.update(job.id, {
            route_id: null, // Will be set after route creation
            assigned_driver_id: driver.driver_id,
            assigned_driver_name: `${driver.first_name} ${driver.last_name}`,
            assigned_vehicle_id: driverVehicle.vehicle_id,
            status: 'driver_assigned'
          });
        }
      }
    }

    // Create delivery routes
    for (const batch of batches) {
      await base44.entities.DeliveryRoute.create(batch);
    }

    return Response.json({
      status: 'success',
      batches_created: batches.length,
      total_jobs_batched: assignedJobs.size,
      batches
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function optimizeDeliveryRoute(jobs) {
  // Simple nearest-neighbor optimization
  if (jobs.length <= 1) return jobs;
  
  const sorted = [jobs[0]];
  const remaining = [...jobs.slice(1)];

  while (remaining.length > 0) {
    const last = sorted[sorted.length - 1];
    const nearest = remaining.reduce((prev, curr) => {
      const prevDist = calculateDistance(last.dropoff_location, prev.pickup_location);
      const currDist = calculateDistance(last.dropoff_location, curr.pickup_location);
      return currDist < prevDist ? curr : prev;
    });

    sorted.push(nearest);
    remaining.splice(remaining.indexOf(nearest), 1);
  }

  return sorted;
}

function calculateRouteDuration(jobs) {
  // Rough estimate: 15 min per stop + 10 min travel between stops
  return jobs.length * 15 + (jobs.length - 1) * 10;
}

function calculateDistance(from, to) {
  // Placeholder for actual distance calculation
  return Math.random() * 10;
}