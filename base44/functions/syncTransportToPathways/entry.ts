import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch all transport requests for this month
    const allRequests = await base44.asServiceRole.entities.TransportRequest.list();
    const monthRequests = allRequests.filter(r => {
      const reqDate = new Date(r.request_date);
      return reqDate >= monthStart && reqDate <= monthEnd;
    });

    // Classify trips
    const tripClassifications = await base44.asServiceRole.entities.TripClassification.list();
    const hohTrips = tripClassifications.filter(t => t.trip_type === 'HOH_Program');
    const commercialTrips = tripClassifications.filter(t => t.trip_type === 'Commercial');

    // Vehicle status
    const vehicles = await base44.asServiceRole.entities.Vehicle.list();
    const activeVehicles = vehicles.filter(v => v.service_status === 'available').length;
    const maintenanceVehicles = vehicles.filter(v => v.service_status === 'maintenance').length;

    // Driver compliance
    const drivers = await base44.asServiceRole.entities.Driver.list();
    const complianceTrackers = await base44.asServiceRole.entities.ComplianceTracker.list();
    const compliantDrivers = drivers.filter(d => {
      const driverCompliance = complianceTrackers.filter(c => c.entity_id === d.id && c.status === 'compliant');
      return driverCompliance.length > 0;
    }).length;
    const complianceRate = drivers.length > 0 ? (compliantDrivers / drivers.length * 100) : 0;

    // Trip fulfillment
    const completedTrips = monthRequests.filter(r => r.status === 'completed').length;
    const scheduledTrips = monthRequests.filter(r => ['scheduled', 'driver_assigned', 'en_route'].includes(r.status)).length;
    const fulfillmentRate = (scheduledTrips + completedTrips) > 0 ? ((completedTrips / (scheduledTrips + completedTrips)) * 100) : 0;

    // Revenue and mileage
    const totalRevenue = monthRequests.reduce((sum, r) => sum + (r.job_value || 0), 0);
    const hohMiles = hohTrips.reduce((sum, t) => sum + (t.actual_miles || 0), 0);
    const avgTripCost = monthRequests.length > 0 ? (monthRequests.reduce((sum, r) => sum + (r.actual_cost || 0), 0) / monthRequests.length) : 0;
    const avgRevenuePerMile = hohMiles > 0 ? (totalRevenue / hohMiles) : 0;

    // Safety incidents
    const incidents = await base44.asServiceRole.entities.Incident.list();
    const monthIncidents = incidents.filter(i => {
      const incDate = new Date(i.incident_date);
      return incDate >= monthStart && incDate <= monthEnd && i.status !== 'resolved';
    }).length;

    const metrics = {
      total_trips_month: monthRequests.length,
      hoh_program_trips: hohTrips.length,
      commercial_trips: commercialTrips.length,
      active_vehicles: activeVehicles,
      vehicles_maintenance: maintenanceVehicles,
      driver_compliance_rate: Math.round(complianceRate),
      fulfillment_rate: Math.round(fulfillmentRate),
      revenue_month: totalRevenue,
      hoh_miles: hohMiles,
      open_incidents: monthIncidents,
      avg_trip_cost: Math.round(avgTripCost * 100) / 100,
      revenue_per_mile: Math.round(avgRevenuePerMile * 100) / 100
    };

    // Create sync record
    const syncRecord = await base44.asServiceRole.entities.PathwaysSync.create({
      event_type: 'trips_summary',
      payload_summary: `Monthly sync: ${metrics.total_trips_month} trips, ${metrics.driver_compliance_rate}% compliance`,
      status: 'synced',
      synced_at: new Date().toISOString(),
      metrics: metrics
    });

    return Response.json({
      success: true,
      syncId: syncRecord.id,
      metrics: metrics,
      message: 'Transport data synced to Pathways Hub'
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({
      error: error.message,
      success: false
    }, { status: 500 });
  }
});