import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { request_date, driver_id } = await req.json();

    // Get all driver's jobs for the date
    const driverJobs = await base44.entities.TransportRequest.filter({
      request_date,
      assigned_driver_id: driver_id,
      status: { $nin: ['completed', 'cancelled', 'no_show'] }
    });

    // Separate nonprofit vs revenue jobs
    const nonprofitJobs = driverJobs.filter(j => j.client_type === 'nonprofit_hoh');
    const revenueJobs = driverJobs.filter(j => ['external_contract', 'external_delivery', 'external_medical'].includes(j.client_type));

    // Check for conflicts
    const conflicts = [];
    const issues = [];

    // Rule: Nonprofit jobs always come first
    for (const revenue of revenueJobs) {
      for (const nonprofit of nonprofitJobs) {
        // Check if revenue job overlaps with nonprofit job time
        if (timeWindowOverlap(revenue.pickup_time, nonprofit.pickup_time, nonprofit.appointment_time)) {
          conflicts.push({
            type: 'time_overlap',
            revenue_job_id: revenue.id,
            revenue_time: revenue.pickup_time,
            nonprofit_job_id: nonprofit.id,
            nonprofit_appointment: nonprofit.appointment_time,
            message: `Revenue job conflicts with nonprofit appointment. Nonprofit job must have priority.`,
            recommendation: 'Reschedule revenue job or reassign to different driver'
          });
        }
      }
    }

    // Check for at-risk appointments
    for (const nonprofit of nonprofitJobs) {
      if (nonprofit.status === 'driver_assigned' && nonprofit.appointment_time) {
        const bufferMinutes = 30;
        const appointmentTime = new Date(`2000-01-01T${nonprofit.appointment_time}`);
        const pickupTime = new Date(`2000-01-01T${nonprofit.pickup_time}`);
        const timeDiff = (appointmentTime - pickupTime) / 1000 / 60;

        if (timeDiff < bufferMinutes) {
          issues.push({
            type: 'tight_schedule',
            job_id: nonprofit.id,
            participant: nonprofit.participant_name,
            pickup: nonprofit.pickup_time,
            appointment: nonprofit.appointment_time,
            buffer_minutes: timeDiff,
            message: `Appointment buffer is only ${Math.round(timeDiff)} minutes. Recommend 30 min minimum.`,
            recommendation: 'Adjust pickup time or confirm driver availability'
          });
        }
      }
    }

    // Verify proper ordering
    const sortedByPriority = [...nonprofitJobs, ...revenueJobs].sort((a, b) => {
      const aTime = timeToMinutes(a.pickup_time);
      const bTime = timeToMinutes(b.pickup_time);
      return aTime - bTime;
    });

    return Response.json({
      status: 'success',
      driver_id,
      request_date,
      summary: {
        total_jobs: driverJobs.length,
        nonprofit_jobs: nonprofitJobs.length,
        revenue_jobs: revenueJobs.length,
        conflicts_detected: conflicts.length,
        issues_detected: issues.length
      },
      conflicts,
      issues,
      priority_order: sortedByPriority.map(j => ({
        id: j.id,
        type: j.client_type === 'nonprofit_hoh' ? 'NONPROFIT' : 'REVENUE',
        participant: j.participant_name,
        time: j.pickup_time,
        appointment: j.appointment_time
      })),
      compliance: {
        is_priority_enforced: conflicts.length === 0,
        message: conflicts.length === 0 
          ? 'Driver schedule complies with nonprofit priority rules' 
          : 'Driver schedule has conflicts that violate nonprofit priority'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function timeWindowOverlap(revenueStart, nonprofitStart, nonprofitEnd) {
  const revenueMinutes = timeToMinutes(revenueStart);
  const nonprofitStartMin = timeToMinutes(nonprofitStart);
  const nonprofitEndMin = timeToMinutes(nonprofitEnd);

  // Assume 45 min revenue job and check if it overlaps
  return revenueMinutes >= nonprofitStartMin - 45 && revenueMinutes <= nonprofitEndMin;
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}