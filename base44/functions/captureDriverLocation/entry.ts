import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { driver_id, driver_name, vehicle_id, latitude, longitude, accuracy, speed, heading, current_status, current_request_id } = body;

    if (!driver_id || latitude === undefined || longitude === undefined) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if driver location record exists
    const existing = await base44.entities.DriverLocation.filter({ driver_id }, 'last_update', 1);
    
    const locationData = {
      driver_id,
      driver_name,
      vehicle_id,
      latitude,
      longitude,
      last_update: new Date().toISOString(),
      current_status: current_status || 'idle',
      current_request_id,
      accuracy: accuracy || null,
      speed_mph: speed || null,
      heading: heading || null
    };

    let result;
    if (existing.length > 0) {
      // Update existing location
      result = await base44.entities.DriverLocation.update(existing[0].id, locationData);
    } else {
      // Create new location record
      result = await base44.entities.DriverLocation.create(locationData);
    }

    return Response.json({
      success: true,
      driver_id,
      location: { latitude, longitude },
      last_update: locationData.last_update
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});