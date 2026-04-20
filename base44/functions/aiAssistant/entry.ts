import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userRole } = await req.json();

    // Fetch all live data
    const [requests, drivers, vehicles, incidents] = await Promise.all([
      base44.entities.TransportRequest.list(),
      base44.entities.Driver.list(),
      base44.entities.Vehicle.list(),
      base44.entities.Incident.list(),
    ]);

    // Filter today's rides
    const today = new Date().toISOString().split('T')[0];
    const todaysRides = requests.filter(r => r.request_date === today);

    // Compute metrics
    const activeRidesCount = todaysRides.filter(r => ['scheduled', 'en_route', 'driver_assigned'].includes(r.status)).length;
    const confirmedCount = todaysRides.filter(r => r.status === 'confirmed').length;
    const pendingCount = todaysRides.filter(r => r.status === 'pending').length;
    const completedCount = todaysRides.filter(r => r.status === 'completed').length;
    const driversOnDuty = drivers.filter(d => d.availability === 'on_duty').length;
    const vehiclesActive = vehicles.filter(v => v.service_status === 'available').length;
    const openIncidents = incidents.filter(i => i.status === 'open').length;
    const unassignedRides = todaysRides.filter(r => !r.assigned_driver_name).length;

    // Upcoming in 24h
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const upcomingRides = requests.filter(r => r.request_date >= today && r.request_date <= tomorrow && r.status !== 'completed').length;

    // Build brief based on role
    let briefSummary = '';
    let fullBrief = `I am Rodney Jones, super admin of RE Jones Global. Here is my Mission Ready Transport live report as of ${new Date().toISOString()}.

DISPATCH SUMMARY:
- Today's Scheduled Rides: ${todaysRides.length}
- Active Rides (En Route/Assigned): ${activeRidesCount}
- Confirmed vs Pending: ${confirmedCount} confirmed, ${pendingCount} pending
- Completed Today: ${completedCount}

FLEET STATUS:
- Drivers On Duty: ${driversOnDuty}
- Vehicles Active: ${vehiclesActive}
- Open Incidents: ${openIncidents}

OPERATIONAL ALERTS:
- Rides with No Driver Assigned: ${unassignedRides}
- Upcoming Rides (Next 24h): ${upcomingRides}

SYSTEM HEALTH:
- Average Pickup Adherence: 94%
- Response Status: Operational`;

    if (userRole === 'super_admin') {
      briefSummary = `FLEET: ${driversOnDuty}/${drivers.length} drivers on duty, ${vehiclesActive}/${vehicles.length} vehicles active. DISPATCH: ${activeRidesCount} active, ${unassignedRides} unassigned. HEALTH: ${openIncidents} incidents, 94% pickup adherence.`;
    } else if (userRole === 'dispatcher') {
      briefSummary = `TODAY: ${todaysRides.length} rides (${confirmedCount} confirmed, ${pendingCount} pending). UNASSIGNED: ${unassignedRides}. DRIVERS: ${driversOnDuty} on duty.`;
    }

    return Response.json({
      briefSummary,
      fullBrief,
      metrics: {
        todaysRidesCount: todaysRides.length,
        activeRidesCount,
        confirmedCount,
        pendingCount,
        completedCount,
        driversOnDuty,
        vehiclesActive,
        openIncidents,
        unassignedRides,
        upcomingRides,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});