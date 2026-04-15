import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user?.role || user.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const requests = await base44.entities.TransportRequest.list('-created_date', 2000);
    const drivers = await base44.entities.Driver.list('first_name', 500);
    const vehicles = await base44.entities.Vehicle.list('nickname', 100);
    const participants = await base44.entities.Participant.list('-created_date', 500);
    const notifications = await base44.entities.RiderNotification.list('-created_date', 500);

    const diagnostics = {
      timestamp: new Date().toISOString(),
      data_coverage: {
        total_requests: requests.length,
        total_drivers: drivers.length,
        total_vehicles: vehicles.length,
        total_participants: participants.length
      },
      dispatch_health: {
        issues: [],
        warnings: [],
        status: 'operational'
      },
      assignment_quality: {
        issues: [],
        warnings: [],
        status: 'operational'
      },
      route_health: {
        issues: [],
        warnings: [],
        status: 'operational'
      },
      notification_readiness: {
        issues: [],
        warnings: [],
        status: 'operational'
      },
      gps_tracking_readiness: {
        issues: [],
        warnings: [],
        status: 'not_configured'
      },
      rider_communication_readiness: {
        issues: [],
        warnings: [],
        status: 'operational'
      }
    };

    // ─── DISPATCH HEALTH ───────────────────────────────────────────────────

    const unassignedRides = requests.filter(r =>
      !r.assigned_driver_id && !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status)
    );

    if (unassignedRides.length > 0) {
      diagnostics.dispatch_health.issues.push(
        `${unassignedRides.length} rides missing driver assignment`
      );
      diagnostics.dispatch_health.status = 'at_risk';
    }

    const unassignedVehicles = requests.filter(r =>
      !r.assigned_vehicle_id && !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status)
    );

    if (unassignedVehicles.length > 0) {
      diagnostics.dispatch_health.issues.push(
        `${unassignedVehicles.length} rides missing vehicle assignment`
      );
      diagnostics.dispatch_health.status = 'at_risk';
    }

    const noTimeRides = requests.filter(r =>
      !r.pickup_time && !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status)
    );

    if (noTimeRides.length > 0) {
      diagnostics.dispatch_health.warnings.push(
        `${noTimeRides.length} rides missing pickup time`
      );
    }

    // ─── ASSIGNMENT QUALITY ────────────────────────────────────────────────

    const driverConflicts = [];
    requests
      .filter(r => r.assigned_driver_id && r.pickup_time && r.request_date)
      .forEach(r => {
        const [h, m] = r.pickup_time.split(':').map(Number);
        const rMin = h * 60 + (m || 0);
        const conflicts = requests.filter(r2 =>
          r2.id !== r.id &&
          r2.assigned_driver_id === r.assigned_driver_id &&
          r2.request_date === r.request_date &&
          r2.pickup_time &&
          (() => {
            const [h2, m2] = r2.pickup_time.split(':').map(Number);
            return Math.abs(h2 * 60 + (m2 || 0) - rMin) < 90;
          })()
        );
        if (conflicts.length > 0) {
          driverConflicts.push({
            driver: r.assigned_driver_name,
            rides: [r.participant_name, ...conflicts.map(c => c.participant_name)],
            count: conflicts.length + 1
          });
        }
      });

    if (driverConflicts.length > 0) {
      diagnostics.assignment_quality.issues.push(
        `${driverConflicts.length} drivers have scheduling conflicts (overlapping 90min windows)`
      );
      diagnostics.assignment_quality.status = 'at_risk';
    }

    const overloadedDrivers = drivers.map(d => {
      const assigned = requests.filter(r =>
        r.assigned_driver_id === d.id &&
        !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status)
      ).length;
      return { driver: `${d.first_name} ${d.last_name}`, rides: assigned };
    }).filter(d => d.rides > 8);

    if (overloadedDrivers.length > 0) {
      diagnostics.assignment_quality.warnings.push(
        `${overloadedDrivers.length} drivers assigned >8 rides`
      );
    }

    // ─── ROUTE HEALTH ──────────────────────────────────────────────────────

    const groupedRoutes = [];
    const groupedRidesByDriver = {};
    requests
      .filter(r => r.assigned_driver_id && !['completed', 'cancelled', 'denied'].includes(r.status))
      .forEach(r => {
        if (!groupedRidesByDriver[r.assigned_driver_id]) {
          groupedRidesByDriver[r.assigned_driver_id] = [];
        }
        groupedRidesByDriver[r.assigned_driver_id].push(r);
      });

    Object.entries(groupedRidesByDriver).forEach(([driverId, driverRides]) => {
      if (driverRides.length > 1) {
        const allHaveTime = driverRides.every(r => r.pickup_time && r.appointment_time);
        if (!allHaveTime) {
          diagnostics.route_health.warnings.push(
            `Driver ${driverRides[0].assigned_driver_name} has grouped rides missing timing data`
          );
        }
      }
    });

    // ─── NOTIFICATION READINESS ────────────────────────────────────────────

    const pendingNotifications = notifications.filter(n => n.status === 'pending');
    if (pendingNotifications.length > 50) {
      diagnostics.notification_readiness.warnings.push(
        `${pendingNotifications.length} notifications queued for delivery`
      );
    }

    const failedNotifications = notifications.filter(n => n.status === 'failed');
    if (failedNotifications.length > 0) {
      diagnostics.notification_readiness.issues.push(
        `${failedNotifications.length} notifications failed to send`
      );
      diagnostics.notification_readiness.status = 'degraded';
    }

    // ─── GPS / TRACKING READINESS ──────────────────────────────────────────

    diagnostics.gps_tracking_readiness.warnings.push(
      'GPS location updates not yet integrated - system ready for integration'
    );
    diagnostics.gps_tracking_readiness.warnings.push(
      'Driver location entity created and ready for live updates'
    );

    // ─── RIDER COMMUNICATION ──────────────────────────────────────────────

    const participantsMissingPhone = participants.filter(p => !p.phone).length;
    if (participantsMissingPhone > 0) {
      diagnostics.rider_communication_readiness.warnings.push(
        `${participantsMissingPhone} participants missing phone numbers - SMS unavailable`
      );
    }

    const participantsMissingEmail = participants.filter(p => !p.email).length;
    if (participantsMissingEmail > 0) {
      diagnostics.rider_communication_readiness.warnings.push(
        `${participantsMissingEmail} participants missing email - email notifications unavailable`
      );
    }

    // ─── SUMMARY ───────────────────────────────────────────────────────────

    const overallStatus = 
      diagnostics.dispatch_health.status === 'at_risk' || 
      diagnostics.assignment_quality.status === 'at_risk'
        ? 'at_risk'
        : diagnostics.notification_readiness.status === 'degraded'
        ? 'degraded'
        : 'operational';

    return Response.json({
      overall_status: overallStatus,
      data_coverage: diagnostics.data_coverage,
      dispatch_health: diagnostics.dispatch_health,
      assignment_quality: diagnostics.assignment_quality,
      route_health: diagnostics.route_health,
      notification_readiness: diagnostics.notification_readiness,
      gps_tracking_readiness: diagnostics.gps_tracking_readiness,
      rider_communication_readiness: diagnostics.rider_communication_readiness,
      recommendations: [
        ...(unassignedRides.length > 0 ? [`Assign drivers to ${unassignedRides.length} pending rides`] : []),
        ...(unassignedVehicles.length > 0 ? [`Assign vehicles to ${unassignedVehicles.length} pending rides`] : []),
        ...(driverConflicts.length > 0 ? ['Resolve driver scheduling conflicts in dispatch board'] : []),
        ...(overloadedDrivers.length > 0 ? ['Consider distributing rides among more drivers'] : []),
        ...(failedNotifications.length > 0 ? ['Review and retry failed notification deliveries'] : []),
        ...(participantsMissingPhone > 0 ? [`Add phone numbers to ${participantsMissingPhone} participant records for SMS delivery`] : []),
        ...(!['completed', 'cancelled'].includes('gps') ? ['Integrate GPS tracking to enable live location visibility'] : [])
      ],
      ready_for_live_dispatch: overallStatus === 'operational' && unassignedRides.length === 0 && driverConflicts.length === 0
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});