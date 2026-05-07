import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, resource_type, resource_id, participant_id, details } = await req.json();

    let flagged = false;
    let flag_reason = null;

    // Flag if driver accessing participant history outside assigned trips
    if (user.role === 'driver' && resource_type === 'participant_trip') {
      const request = await base44.asServiceRole.entities.TransportRequest.get(resource_id);
      if (request.assigned_driver_id !== user.id) {
        flagged = true;
        flag_reason = 'Driver accessing trip outside assigned requests';
      }
    }

    // Flag if non-case-manager accessing medical trip
    if (user.role !== 'case_manager' && user.role !== 'admin' && resource_type === 'medical_record') {
      const tripClass = await base44.asServiceRole.entities.TripClassification.list();
      const medicalTrip = tripClass.find(t => t.request_id === resource_id && t.is_medical_appointment);
      if (medicalTrip) {
        flagged = true;
        flag_reason = 'Unauthorized access to medical appointment data (PHI)';
      }
    }

    const auditLog = await base44.asServiceRole.entities.AuditLog.create({
      action,
      resource_type,
      resource_id,
      accessed_by: user.email,
      user_role: user.role,
      participant_id,
      details,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      flagged,
      flag_reason,
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      auditLogId: auditLog.id,
      flagged
    });
  } catch (error) {
    console.error('Audit log error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});