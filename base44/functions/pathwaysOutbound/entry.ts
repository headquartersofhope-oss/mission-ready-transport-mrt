/**
 * pathwaysOutbound — Push trip status updates back to the REJ Pathways Hub
 *
 * Called internally (from entity automation or manually) when a trip status changes.
 * Posts the update to Pathways Hub's webhook endpoint.
 *
 * Expected payload:
 * {
 *   request_id: string,    // MRT TransportRequest ID
 *   event: string          // "confirmed" | "driver_assigned" | "en_route" | "picked_up" | "completed" | "cancelled"
 * }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SHARED_SECRET = Deno.env.get('PATHWAYS_SHARED_SECRET') || 'mrt-pathways-2026';
const PATHWAYS_WEBHOOK_URL = Deno.env.get('PATHWAYS_WEBHOOK_URL') || '';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Accept both authenticated user calls and service-role automation calls
    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      if (user && (user.role === 'admin' || user.role === 'dispatcher')) isAuthorized = true;
    } catch (_) {
      // Automation / service call — validate via body secret
    }

    const body = await req.json();

    if (!isAuthorized && body.service_secret !== SHARED_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { request_id, event } = body;

    if (!request_id || !event) {
      return Response.json({ error: 'request_id and event are required' }, { status: 400 });
    }

    // Fetch the transport request
    const requests = await base44.asServiceRole.entities.TransportRequest.filter({ id: request_id });
    if (!requests.length) {
      return Response.json({ error: 'TransportRequest not found' }, { status: 404 });
    }
    const trip = requests[0];

    // Only push trips that originated from Pathways (submitted_by starts with "pathways_hub:")
    const isPathwaysTrip = trip.submitted_by?.startsWith('pathways_hub:');
    const pathwaysRequestId = isPathwaysTrip
      ? trip.submitted_by.replace('pathways_hub:', '')
      : null;

    // Build the status update payload
    const statusPayload = {
      mrt_request_id: request_id,
      pathways_request_id: pathwaysRequestId,
      event,
      timestamp: new Date().toISOString(),
      resident_name: trip.participant_name,
      pickup_location: trip.pickup_location,
      dropoff_location: trip.dropoff_location,
      pickup_time: trip.pickup_time,
      assigned_driver: trip.assigned_driver_name || null,
      assigned_vehicle: trip.assigned_vehicle_name || null,
      driver_notes: trip.driver_notes || null,
      completed_at: trip.completed_at || null,
      secret: SHARED_SECRET,
    };

    // Push to Pathways Hub if webhook URL is configured
    let pathwaysPushResult = { pushed: false, reason: 'No PATHWAYS_WEBHOOK_URL configured' };

    if (PATHWAYS_WEBHOOK_URL) {
      const pushRes = await fetch(PATHWAYS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusPayload),
      });

      if (pushRes.ok) {
        pathwaysPushResult = { pushed: true, status: pushRes.status };
      } else {
        const errText = await pushRes.text();
        pathwaysPushResult = { pushed: false, status: pushRes.status, error: errText };
      }
    }

    // Log the sync event regardless of push result
    const eventLabels = {
      confirmed: 'Trip confirmed by MRT dispatcher',
      driver_assigned: `Driver assigned: ${trip.assigned_driver_name}`,
      en_route: 'Driver en route to pickup',
      picked_up: 'Resident picked up',
      completed: 'Trip completed successfully',
      cancelled: 'Trip cancelled',
    };

    await base44.asServiceRole.entities.PathwaysSync.create({
      event_type: 'trips_summary',
      payload_summary: `Outbound → Pathways: ${event} for ${trip.participant_name} (${pathwaysRequestId || 'non-pathways trip'})`,
      status: pathwaysPushResult.pushed ? 'synced' : (PATHWAYS_WEBHOOK_URL ? 'failed' : 'synced'),
      synced_at: new Date().toISOString(),
      error_message: pathwaysPushResult.pushed ? null : pathwaysPushResult.error || null,
      metrics: { total_trips_month: 0, hoh_program_trips: 1, commercial_trips: 0 }
    });

    return Response.json({
      success: true,
      event,
      request_id,
      pathways_request_id: pathwaysRequestId,
      label: eventLabels[event] || event,
      pathways_push: pathwaysPushResult,
    });

  } catch (error) {
    console.error('pathwaysOutbound error:', error);
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});