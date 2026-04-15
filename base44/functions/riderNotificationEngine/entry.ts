import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { request_id, notification_type, trigger_data = {} } = body;

  try {
    const ride = await base44.entities.TransportRequest.get(request_id);
    if (!ride) return Response.json({ error: 'Ride not found' }, { status: 404 });

    const participant = await base44.entities.Participant.get(ride.participant_id);
    
    const messages = {
      ride_approved: {
        subject: `Your ride is approved - ${ride.pickup_time || 'Time TBD'}`,
        body: `Great news! Your ride on ${ride.request_date} has been approved.\n\nPickup: ${ride.pickup_location}\nDestination: ${ride.dropoff_location}\nPickup Time: ${ride.pickup_time || 'To be confirmed'}\n\nYou'll receive driver and vehicle details soon.`,
        channels: ['sms', 'email']
      },
      driver_assigned: {
        subject: `Driver assigned to your ride`,
        body: `Your driver is ${ride.assigned_driver_name || 'assigned'}.\n\nPickup: ${ride.pickup_location} at ${ride.pickup_time}\nDestination: ${ride.dropoff_location}\n\nPlease be ready 5 minutes early.`,
        channels: ['sms', 'email', 'in_app']
      },
      pickup_confirmed: {
        subject: `Ready for pickup?`,
        body: `We're confirming your ride for ${ride.request_date} at ${ride.pickup_time}.\n\nPickup location: ${ride.pickup_location}\nDestination: ${ride.dropoff_location}\n\nPlease confirm you're ready.`,
        channels: ['sms']
      },
      en_route: {
        subject: `Driver is on the way!`,
        body: `Your driver ${ride.assigned_driver_name} is heading to pick you up at ${ride.pickup_location}.\n\nEstimated arrival: ${trigger_data.eta || 'Shortly'}\n\nPlease be ready with your belongings.`,
        channels: ['sms', 'in_app']
      },
      arriving_soon: {
        subject: `Driver arriving in 5 minutes`,
        body: `Your driver is just around the corner! Be ready at ${ride.pickup_location}.`,
        channels: ['sms']
      },
      arrived: {
        subject: `Driver has arrived`,
        body: `Your driver ${ride.assigned_driver_name} has arrived at ${ride.pickup_location}. Please come out.`,
        channels: ['sms']
      },
      delayed: {
        subject: `Your ride is running ${trigger_data.delay_minutes || 10} minutes late`,
        body: `We apologize. Your pickup has been delayed by ${trigger_data.delay_minutes || 10} minutes.\n\nNew estimated pickup: ${trigger_data.new_eta || 'Shortly'}\n\nDriver: ${ride.assigned_driver_name}`,
        channels: ['sms', 'in_app']
      },
      completed: {
        subject: `Ride complete - Thank you!`,
        body: `Your ride on ${ride.request_date} has been completed.\n\nIf you have feedback, please let us know.\n\nThank you for using our service!`,
        channels: ['email']
      },
      no_show: {
        subject: `Ride marked as no-show`,
        body: `Your scheduled ride for ${ride.pickup_time} at ${ride.pickup_location} was not completed as the rider was not available.\n\nPlease contact us if this was an error.`,
        channels: ['sms', 'email']
      },
      cancelled: {
        subject: `Your ride has been cancelled`,
        body: `Your scheduled ride on ${ride.request_date} at ${ride.pickup_time} has been cancelled.\n\nIf you need to reschedule, please contact us.`,
        channels: ['sms', 'email']
      },
      reminder: {
        subject: `Reminder: Ride tomorrow at ${ride.pickup_time}`,
        body: `You have a scheduled ride tomorrow at ${ride.pickup_time}.\n\nPickup: ${ride.pickup_location}\nDestination: ${ride.dropoff_location}\n\nBe ready 5 minutes early. Driver details will be sent in the morning.`,
        channels: ['sms', 'email']
      }
    };

    const template = messages[notification_type];
    if (!template) {
      return Response.json({ error: `Unknown notification type: ${notification_type}` }, { status: 400 });
    }

    // Determine channels based on participant preferences
    const preferredChannels = participant?.preferred_communication === 'email' ? ['email'] : 
                             participant?.preferred_communication === 'text' ? ['sms'] : 
                             ['sms', 'email'];
    const finalChannels = template.channels.filter(c => preferredChannels.includes(c));

    // Create notification record
    const notificationData = {
      request_id,
      participant_id: ride.participant_id,
      participant_name: ride.participant_name,
      participant_phone: participant?.phone,
      participant_email: participant?.email,
      notification_type,
      message_body: template.body,
      driver_name: ride.assigned_driver_name,
      driver_phone: trigger_data.driver_phone,
      vehicle_info: ride.assigned_vehicle_name,
      pickup_time: ride.pickup_time,
      appointment_time: ride.appointment_time,
      estimated_arrival: trigger_data.eta,
      channels: finalChannels,
      status: 'pending'
    };

    const notification = await base44.entities.RiderNotification.create(notificationData);

    // Queue actual delivery (in real system, integrate with SMS/email provider)
    // For now, just return prepared message
    return Response.json({
      notification_id: notification.id,
      request_id,
      notification_type,
      status: 'queued',
      message: template.body,
      channels: finalChannels,
      participant: {
        name: ride.participant_name,
        phone: participant?.phone,
        email: participant?.email,
        communication_preference: participant?.preferred_communication
      },
      sent_at: new Date().toISOString()
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});