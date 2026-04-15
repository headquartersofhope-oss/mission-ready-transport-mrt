/**
 * HOH Transport — Audit & Diagnostics Engine
 * Deterministic checks run entirely on the client from loaded entity data.
 */

const today = new Date();
const todayStr = today.toISOString().split('T')[0];

function daysDiff(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - today) / (1000 * 60 * 60 * 24));
}

function parseTime(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

// ─── INDIVIDUAL CHECK FUNCTIONS ────────────────────────────────────────────

export function checkUnassignedRides(requests) {
  const issues = requests.filter(r =>
    ['approved', 'scheduled'].includes(r.status) && !r.assigned_driver_id && !r.assigned_driver_name
  );
  return issues.map(r => ({
    id: `unassigned-${r.id}`,
    module: 'dispatch',
    severity: 'high',
    title: 'Ride approved but no driver assigned',
    detail: `${r.participant_name} — ${r.request_date} at ${r.pickup_time || 'N/A'}`,
    cause: 'Ride was approved without being dispatched to a driver',
    fix: 'Open the ride and assign a driver from the Dispatch panel',
    owner: 'Dispatcher',
    recordId: r.id,
  }));
}

export function checkMissingVehicle(requests) {
  const issues = requests.filter(r =>
    ['driver_assigned', 'scheduled', 'assigned', 'en_route'].includes(r.status) && !r.assigned_vehicle_id
  );
  return issues.map(r => ({
    id: `no-vehicle-${r.id}`,
    module: 'dispatch',
    severity: 'medium',
    title: 'Ride has driver but no vehicle assigned',
    detail: `${r.participant_name} — ${r.request_date}`,
    cause: 'Driver was assigned without linking a vehicle',
    fix: 'Edit the ride and assign a vehicle',
    owner: 'Dispatcher',
    recordId: r.id,
  }));
}

export function checkOverdueRides(requests) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 1);
  const activeStatuses = ['approved', 'scheduled', 'driver_assigned', 'assigned', 'en_route', 'rider_picked_up', 'in_progress', 'return_pending'];
  const issues = requests.filter(r =>
    activeStatuses.includes(r.status) && r.request_date && new Date(r.request_date) < cutoff
  );
  return issues.map(r => ({
    id: `overdue-${r.id}`,
    module: 'dispatch',
    severity: 'high',
    title: 'Active ride from a past date never closed',
    detail: `${r.participant_name} — scheduled ${r.request_date}, still "${r.status}"`,
    cause: 'Ride was never marked completed, cancelled, or no-show',
    fix: 'Review and close out this ride with the correct final status',
    owner: 'Dispatcher',
    recordId: r.id,
  }));
}

export function checkInvalidLocations(requests) {
  const issues = requests.filter(r =>
    !r.pickup_location || r.pickup_location.trim().length < 5 ||
    !r.dropoff_location || r.dropoff_location.trim().length < 5
  );
  return issues.map(r => ({
    id: `bad-location-${r.id}`,
    module: 'data_quality',
    severity: 'medium',
    title: 'Ride has incomplete pickup or dropoff address',
    detail: `${r.participant_name} — pickup: "${r.pickup_location || 'MISSING'}" / drop: "${r.dropoff_location || 'MISSING'}"`,
    cause: 'Address was entered too briefly or left blank',
    fix: 'Edit the ride and provide full street addresses',
    owner: 'Case Manager',
    recordId: r.id,
  }));
}

export function checkDriverDoubleBookings(requests) {
  const active = requests.filter(r =>
    r.assigned_driver_id && r.request_date && r.pickup_time &&
    !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status)
  );
  const conflicts = [];
  const seen = {};
  active.forEach(r => {
    const key = `${r.assigned_driver_id}|${r.request_date}`;
    if (!seen[key]) seen[key] = [];
    seen[key].push(r);
  });
  Object.values(seen).forEach(group => {
    if (group.length < 2) return;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = parseTime(group[i].pickup_time);
        const b = parseTime(group[j].pickup_time);
        if (a !== null && b !== null && Math.abs(a - b) < 60) {
          conflicts.push({
            id: `driver-conflict-${group[i].id}-${group[j].id}`,
            module: 'scheduling',
            severity: 'critical',
            title: 'Driver double-booked within 60 minutes',
            detail: `${group[i].assigned_driver_name} — ${group[i].pickup_time} (${group[i].participant_name}) and ${group[j].pickup_time} (${group[j].participant_name}) on ${group[i].request_date}`,
            cause: 'Two rides assigned to the same driver at overlapping times',
            fix: 'Reassign one ride to another available driver',
            owner: 'Dispatcher',
          });
        }
      }
    }
  });
  return conflicts;
}

export function checkVehicleDoubleBookings(requests) {
  const active = requests.filter(r =>
    r.assigned_vehicle_id && r.request_date && r.pickup_time &&
    !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status)
  );
  const seen = {};
  active.forEach(r => {
    const key = `${r.assigned_vehicle_id}|${r.request_date}`;
    if (!seen[key]) seen[key] = [];
    seen[key].push(r);
  });
  const conflicts = [];
  Object.values(seen).forEach(group => {
    if (group.length < 2) return;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = parseTime(group[i].pickup_time);
        const b = parseTime(group[j].pickup_time);
        if (a !== null && b !== null && Math.abs(a - b) < 45) {
          conflicts.push({
            id: `vehicle-conflict-${group[i].id}-${group[j].id}`,
            module: 'scheduling',
            severity: 'critical',
            title: 'Vehicle double-booked within 45 minutes',
            detail: `${group[i].assigned_vehicle_name || group[i].assigned_vehicle_id} — ${group[i].pickup_time} and ${group[j].pickup_time} on ${group[i].request_date}`,
            cause: 'Same vehicle assigned to concurrent trips',
            fix: 'Assign a different vehicle to one of the rides',
            owner: 'Dispatcher',
          });
        }
      }
    }
  });
  return conflicts;
}

export function checkRepeatedNoShows(participants) {
  return participants
    .filter(p => (p.no_show_count || 0) >= 3)
    .map(p => ({
      id: `noshows-${p.id}`,
      module: 'clients',
      severity: p.no_show_count >= 5 ? 'high' : 'medium',
      title: 'Client has repeated no-shows',
      detail: `${p.first_name} ${p.last_name} — ${p.no_show_count} no-shows recorded`,
      cause: 'Pattern of missed rides may indicate scheduling, communication, or eligibility issues',
      fix: 'Schedule a case manager check-in and consider updating preferred communication method',
      owner: 'Case Manager',
      recordId: p.id,
    }));
}

export function checkOpenIncidents(incidents) {
  const stale = incidents.filter(i => ['open', 'under_review'].includes(i.status));
  return stale.map(i => ({
    id: `open-incident-${i.id}`,
    module: 'incidents',
    severity: i.severity === 'critical' || i.severity === 'high' ? 'high' : 'medium',
    title: 'Incident unresolved',
    detail: `${i.incident_type?.replace(/_/g, ' ')} — ${i.incident_date || 'no date'} (${i.status})`,
    cause: 'Incident was logged but not followed up to resolution',
    fix: 'Review the incident, add resolution notes, and close or escalate',
    owner: 'Operations Manager',
    recordId: i.id,
  }));
}

export function checkDriverSetup(drivers) {
  const issues = [];
  drivers.filter(d => d.status === 'active').forEach(d => {
    const missing = [];
    if (!d.license_number) missing.push('license number');
    if (!d.license_expiry) missing.push('license expiry');
    if (!d.phone) missing.push('phone');
    if (!d.shift_schedule) missing.push('shift schedule');
    if (d.license_status === 'expired') missing.push('⚠ license EXPIRED');
    if (missing.length > 0) {
      issues.push({
        id: `driver-setup-${d.id}`,
        module: 'drivers',
        severity: d.license_status === 'expired' ? 'critical' : 'medium',
        title: 'Driver missing required setup fields',
        detail: `${d.first_name} ${d.last_name} — missing: ${missing.join(', ')}`,
        cause: 'Driver profile was not fully completed during onboarding',
        fix: 'Open the driver record and fill in all required fields',
        owner: 'HR / Operations',
        recordId: d.id,
      });
    }
  });
  return issues;
}

export function checkVehicleMaintenance(vehicles) {
  const issues = [];
  vehicles.filter(v => v.status === 'active').forEach(v => {
    const missing = [];
    if (!v.maintenance_due_date) missing.push('maintenance due date');
    if (!v.last_inspection_date) missing.push('last inspection date');
    if (!v.insurance_expiry) missing.push('insurance expiry');
    if (!v.registration_expiry) missing.push('registration expiry');

    const maintDays = daysDiff(v.maintenance_due_date);
    const insDays = daysDiff(v.insurance_expiry);
    const regDays = daysDiff(v.registration_expiry);

    if (maintDays !== null && maintDays < 0) missing.push('⚠ maintenance OVERDUE');
    if (insDays !== null && insDays < 30) missing.push(`⚠ insurance expires in ${insDays}d`);
    if (regDays !== null && regDays < 30) missing.push(`⚠ registration expires in ${regDays}d`);

    if (missing.length > 0) {
      issues.push({
        id: `vehicle-maint-${v.id}`,
        module: 'vehicles',
        severity: missing.some(m => m.includes('⚠')) ? 'high' : 'medium',
        title: 'Vehicle missing maintenance or compliance data',
        detail: `${v.nickname || v.make + ' ' + v.model} (${v.plate}) — ${missing.join(', ')}`,
        cause: 'Vehicle record was not fully set up with compliance dates',
        fix: 'Update the vehicle record with accurate maintenance and insurance dates',
        owner: 'Fleet Manager',
        recordId: v.id,
      });
    }
  });
  return issues;
}

export function checkStaleClients(participants) {
  return participants
    .filter(p => {
      const hasName = p.first_name && p.last_name;
      const missingContact = !p.phone && !p.email;
      const missingAddress = !p.pickup_address;
      return hasName && (missingContact || missingAddress);
    })
    .map(p => ({
      id: `stale-client-${p.id}`,
      module: 'clients',
      severity: 'low',
      title: 'Client record missing contact or address',
      detail: `${p.first_name} ${p.last_name} — missing: ${[!p.phone && !p.email ? 'any contact info' : null, !p.pickup_address ? 'pickup address' : null].filter(Boolean).join(', ')}`,
      cause: 'Record was created without complete contact or location details',
      fix: 'Contact the case manager and update the client profile',
      owner: 'Case Manager',
      recordId: p.id,
    }));
}

export function checkDuplicateClients(participants) {
  const seen = {};
  const issues = [];
  participants.forEach(p => {
    const key = `${p.first_name?.toLowerCase().trim()}|${p.last_name?.toLowerCase().trim()}`;
    if (!seen[key]) seen[key] = [];
    seen[key].push(p);
  });
  Object.entries(seen).forEach(([key, group]) => {
    if (group.length > 1) {
      issues.push({
        id: `dup-client-${key}`,
        module: 'data_quality',
        severity: 'medium',
        title: 'Possible duplicate client records',
        detail: `"${group[0].first_name} ${group[0].last_name}" appears ${group.length} times`,
        cause: 'Client was entered more than once, possibly by different staff',
        fix: 'Review and merge or delete the duplicate entries',
        owner: 'Admin',
      });
    }
  });
  return issues;
}

export function checkDuplicateDrivers(drivers) {
  const seen = {};
  const issues = [];
  drivers.forEach(d => {
    const key = `${d.first_name?.toLowerCase().trim()}|${d.last_name?.toLowerCase().trim()}`;
    if (!seen[key]) seen[key] = [];
    seen[key].push(d);
  });
  Object.entries(seen).forEach(([key, group]) => {
    if (group.length > 1) {
      issues.push({
        id: `dup-driver-${key}`,
        module: 'data_quality',
        severity: 'medium',
        title: 'Possible duplicate driver records',
        detail: `"${group[0].first_name} ${group[0].last_name}" appears ${group.length} times`,
        cause: 'Driver was entered more than once',
        fix: 'Review and merge or delete the duplicate records',
        owner: 'Admin',
      });
    }
  });
  return issues;
}

export function checkOrphanedRecurringPlans(plans, participants) {
  const participantIds = new Set(participants.map(p => p.id));
  return plans
    .filter(p => p.status === 'active' && p.participant_id && !participantIds.has(p.participant_id))
    .map(p => ({
      id: `orphan-plan-${p.id}`,
      module: 'data_quality',
      severity: 'medium',
      title: 'Recurring plan references a deleted client',
      detail: `Plan for "${p.participant_name}" — linked client ID not found`,
      cause: 'Client record was deleted but recurring plan was not deactivated',
      fix: 'Deactivate or reassign this recurring plan',
      owner: 'Admin',
      recordId: p.id,
    }));
}

// ─── PATTERN ANALYSIS (AI-style heuristics) ────────────────────────────────

export function analyzeDispatchPatterns(requests, drivers) {
  const insights = [];

  // Overloaded drivers
  const driverRideCount = {};
  const activeRides = requests.filter(r => !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status));
  activeRides.forEach(r => {
    if (r.assigned_driver_name) {
      driverRideCount[r.assigned_driver_name] = (driverRideCount[r.assigned_driver_name] || 0) + 1;
    }
  });
  Object.entries(driverRideCount).forEach(([name, count]) => {
    if (count > 6) {
      insights.push({
        id: `overloaded-${name}`,
        module: 'dispatch',
        severity: 'medium',
        title: 'Driver appears overloaded',
        detail: `${name} has ${count} active open rides assigned`,
        cause: 'Dispatch concentration on a single driver',
        fix: 'Redistribute some rides to available drivers',
        owner: 'Dispatcher',
        type: 'pattern',
      });
    }
  });

  // Unassigned high-priority
  const urgentUnassigned = requests.filter(r =>
    r.priority === 'urgent' && !r.assigned_driver_name &&
    !['completed', 'cancelled', 'denied', 'no_show'].includes(r.status)
  );
  if (urgentUnassigned.length > 0) {
    insights.push({
      id: 'urgent-unassigned',
      module: 'dispatch',
      severity: 'critical',
      title: 'Urgent rides have no driver assigned',
      detail: `${urgentUnassigned.length} urgent ride(s) pending assignment`,
      cause: 'High-priority requests not being dispatched first',
      fix: 'Sort dispatch queue by priority and assign immediately',
      owner: 'Dispatcher',
      type: 'pattern',
    });
  }

  // Purpose concentration
  const purposeCounts = {};
  requests.forEach(r => { if (r.purpose) purposeCounts[r.purpose] = (purposeCounts[r.purpose] || 0) + 1; });
  const topPurpose = Object.entries(purposeCounts).sort((a, b) => b[1] - a[1])[0];
  if (topPurpose && topPurpose[1] > requests.length * 0.4) {
    insights.push({
      id: 'purpose-concentration',
      module: 'scheduling',
      severity: 'low',
      title: 'Ride demand highly concentrated on one purpose',
      detail: `"${topPurpose[0].replace(/_/g, ' ')}" accounts for ${Math.round(topPurpose[1] / requests.length * 100)}% of all rides`,
      cause: 'Single service type driving most transport volume',
      fix: 'Consider dedicated scheduling blocks for this purpose type',
      owner: 'Operations Manager',
      type: 'pattern',
    });
  }

  // Drivers with no rides
  const assignedDriverNames = new Set(requests.filter(r => r.assigned_driver_name).map(r => r.assigned_driver_name));
  const unusedDrivers = drivers.filter(d => d.status === 'active' && !assignedDriverNames.has(`${d.first_name} ${d.last_name}`));
  if (unusedDrivers.length > 0) {
    insights.push({
      id: 'unused-drivers',
      module: 'dispatch',
      severity: 'low',
      title: 'Active drivers with no ride assignments',
      detail: `${unusedDrivers.length} active driver(s) not assigned to any current ride`,
      cause: 'Driver capacity not being utilized',
      fix: 'Review workload distribution and balance assignments',
      owner: 'Dispatcher',
      type: 'pattern',
    });
  }

  return insights;
}

// ─── SCORING ENGINE ────────────────────────────────────────────────────────

export function computeScores(allIssues, requests, drivers, vehicles, participants) {
  const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
  const highCount = allIssues.filter(i => i.severity === 'high').length;
  const medCount = allIssues.filter(i => i.severity === 'medium').length;

  const penalize = (base, issues) => Math.max(0, Math.min(100, base - issues.filter(i => i.severity === 'critical').length * 20 - issues.filter(i => i.severity === 'high').length * 8 - issues.filter(i => i.severity === 'medium').length * 3));

  const dispatchIssues = allIssues.filter(i => i.module === 'dispatch' || i.module === 'scheduling');
  const driverIssues = allIssues.filter(i => i.module === 'drivers');
  const vehicleIssues = allIssues.filter(i => i.module === 'vehicles');
  const clientIssues = allIssues.filter(i => i.module === 'clients');
  const dataIssues = allIssues.filter(i => i.module === 'data_quality');

  const dispatch = penalize(100, dispatchIssues);
  const driverReadiness = penalize(100, driverIssues);
  const vehicleReadiness = penalize(100, vehicleIssues);
  const scheduling = penalize(100, allIssues.filter(i => i.module === 'scheduling'));
  const clientQuality = penalize(100, [...clientIssues, ...dataIssues]);
  const overall = Math.round((dispatch + driverReadiness + vehicleReadiness + scheduling + clientQuality) / 5);

  return { dispatch, driverReadiness, vehicleReadiness, scheduling, clientQuality, overall, criticalCount, highCount, medCount };
}

// ─── FULL DIAGNOSTIC RUN ──────────────────────────────────────────────────

export function runFullDiagnostic({ requests, drivers, vehicles, participants, incidents, recurringPlans }) {
  const issues = [
    ...checkUnassignedRides(requests),
    ...checkMissingVehicle(requests),
    ...checkOverdueRides(requests),
    ...checkInvalidLocations(requests),
    ...checkDriverDoubleBookings(requests),
    ...checkVehicleDoubleBookings(requests),
    ...checkRepeatedNoShows(participants),
    ...checkOpenIncidents(incidents),
    ...checkDriverSetup(drivers),
    ...checkVehicleMaintenance(vehicles),
    ...checkStaleClients(participants),
    ...checkDuplicateClients(participants),
    ...checkDuplicateDrivers(drivers),
    ...checkOrphanedRecurringPlans(recurringPlans, participants),
    ...analyzeDispatchPatterns(requests, drivers),
  ];

  // Deduplicate by id
  const seen = new Set();
  const deduped = issues.filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; });

  const scores = computeScores(deduped, requests, drivers, vehicles, participants);

  return { issues: deduped, scores, runAt: new Date().toISOString() };
}