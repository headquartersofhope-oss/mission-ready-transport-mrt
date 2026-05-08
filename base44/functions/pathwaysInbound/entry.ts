/**
 * pathwaysInbound — Webhook receiver for the REJ Pathways Hub (App ID: 69cd2e070504b4c1c4e88766)
 *
 * Pathways posts here when a resident needs transport. We validate the request,
 * create a TransportRequest in MRT, and reply with the new request ID.
 *
 * Expected payload from Pathways:
 * {
 *   pathways_request_id: string,       // Pathways' own request ID
 *   resident_id: string,               // Pathways resident ID
 *   resident_name: string,
 *   resident_phone: string,
 *   pickup_address: string,
 *   dropoff_address: string,
 *   pickup_datetime: string,           // ISO-8601
 *   appointment_datetime: string,      // ISO-8601 (optional)
 *   purpose: string,                   // "medical" | "employment" | "court" | etc.
 *   priority: string,                  // "standard" | "urgent"
 *   special_instructions: string,
 *   return_trip: boolean,
 *   return_pickup_time: string,
 *   secret: string                     // shared secret for auth
 * }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SHARED_SECRET = Deno.env.get('PATHWAYS_SHARED_SECRET') || 'mrt-pathways-2026';
const PATHWAYS_APP_ID = '69cd2e070504b4c1c4e88766';

Deno.serve(async (req) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.json();

    // Validate shared secret
    if (body.secret !== SHARED_SECRET) {
      console.warn('Pathways inbound: invalid secret from', req.headers.get('x-forwarded-for'));
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);

    const {
      pathways_request_id,
      resident_id,
      resident_name,
      resident_phone,
      pickup_address,
      dropoff_address,
      pickup_datetime,
      appointment_datetime,
      purpose = 'other',
      priority = 'standard',
      special_instructions = '',
      return_trip = false,
      return_pickup_time = '',
      mobility_needs = '',
    } = body;

    if (!pickup_address || !dropoff_address || !pickup_datetime) {
      return Response.json({
        error: 'Missing required fields: pickup_address, dropoff_address, pickup_datetime'
      }, { status: 400 });
    }

    // Parse pickup datetime
    const pickupDate = new Date(pickup_datetime);
    const requestDate = pickupDate.toISOString().split('T')[0];
    const pickupTime = pickupDate.toTimeString().slice(0, 5); // HH:MM

    let appointmentTime = '';
    if (appointment_datetime) {
      const apptDate = new Date(appointment_datetime);
      appointmentTime = apptDate.toTimeString().slice(0, 5);
    }

    // Map Pathways purpose to MRT purpose enum
    const purposeMap = {
      medical: 'medical',
      employment: 'work_commute',
      job_interview: 'job_interview',
      court: 'court_probation',
      housing: 'housing_appointment',
      counseling: 'counseling_treatment',
      benefits: 'benefits_office',
      school: 'school_training',
      grocery: 'grocery_essential',
      emergency: 'emergency_support',
    };
    const mrtPurpose = purposeMap[purpose] || 'other';

    // Create the TransportRequest
    const transportRequest = await base44.asServiceRole.entities.TransportRequest.create({
      participant_name: resident_name,
      request_date: requestDate,
      pickup_time: pickupTime,
      appointment_time: appointmentTime,
      pickup_location: pickup_address,
      dropoff_location: dropoff_address,
      purpose: mrtPurpose,
      priority: priority === 'urgent' ? 'urgent' : 'standard',
      status: 'requested',
      return_trip: return_trip,
      return_pickup_time: return_pickup_time,
      trip_type: return_trip ? 'round_trip' : 'one_way',
      client_type: 'nonprofit_hoh',
      business_entity: 'headquarters_of_hope',
      funding_source_type: 'nonprofit_operating_budget',
      special_instructions: [
        special_instructions,
        mobility_needs ? `Mobility needs: ${mobility_needs}` : '',
        `Pathways Request ID: ${pathways_request_id}`,
        `Pathways Resident ID: ${resident_id}`,
        `Source App: ${PATHWAYS_APP_ID}`
      ].filter(Boolean).join('\n'),
      submitted_by: `pathways_hub:${pathways_request_id}`,
    });

    // Log the sync event
    await base44.asServiceRole.entities.PathwaysSync.create({
      event_type: 'trips_summary',
      payload_summary: `Inbound request from Pathways: ${resident_name} → ${dropoff_address}`,
      status: 'synced',
      synced_at: new Date().toISOString(),
      metrics: {
        total_trips_month: 1,
        hoh_program_trips: 1,
        commercial_trips: 0,
      }
    });

    console.log(`Pathways inbound: created TransportRequest ${transportRequest.id} for ${resident_name}`);

    return Response.json({
      success: true,
      mrt_request_id: transportRequest.id,
      pathways_request_id,
      status: 'received',
      message: `Transport request created for ${resident_name}. A dispatcher will assign a driver shortly.`
    });

  } catch (error) {
    console.error('pathwaysInbound error:', error);
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});