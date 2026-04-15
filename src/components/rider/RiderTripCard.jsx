import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin, Calendar, Clock, User, Car, ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
  RotateCcw, Phone
} from 'lucide-react';
import { format } from 'date-fns';

const statusConfig = {
  requested: { label: 'Requested', color: 'bg-slate-100 text-slate-700', icon: AlertCircle },
  pending: { label: 'Pending', color: 'bg-slate-100 text-slate-700', icon: Clock },
  under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: Calendar },
  driver_assigned: { label: 'Driver Assigned', color: 'bg-purple-100 text-purple-700', icon: User },
  assigned: { label: 'Assigned', color: 'bg-purple-100 text-purple-700', icon: User },
  en_route: { label: 'Driver En Route', color: 'bg-yellow-100 text-yellow-700', icon: Car },
  rider_picked_up: { label: 'In Progress', color: 'bg-orange-100 text-orange-700', icon: CheckCircle2 },
  dropped_off: { label: 'At Destination', color: 'bg-teal-100 text-teal-700', icon: MapPin },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  no_show: { label: 'No-Show', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  denied: { label: 'Denied', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

export default function RiderTripCard({ ride, participant }) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const queryClient = useQueryClient();

  const confirmMutation = useMutation({
    mutationFn: () => base44.functions.invoke('riderReadinessConfirmation', { request_id: ride.id }),
    onSuccess: () => {
      setConfirmed(true);
      queryClient.invalidateQueries({ queryKey: ['rider-rides'] });
    },
  });

  const sc = statusConfig[ride.status] || statusConfig.requested;
  const StatusIcon = sc.icon;
  const canConfirm = ['scheduled', 'approved', 'driver_assigned'].includes(ride.status) && !confirmed;
  const showPickupTime = ride.pickup_time;

  const handleConfirmReady = async () => {
    setConfirming(true);
    await confirmMutation.mutateAsync();
    setConfirming(false);
  };

  return (
    <Card className={`overflow-hidden ${ride.priority === 'urgent' ? 'border-red-300 border-2' : ''}`}>
      <div className="p-4">
        {/* Collapsed view */}
        <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground">{ride.participant_name}</h3>
              {ride.return_trip && (
                <Badge variant="outline" className="text-xs">
                  <RotateCcw className="w-3 h-3 mr-1" /> Round Trip
                </Badge>
              )}
              {ride.priority === 'urgent' && (
                <Badge className="bg-red-500 text-white text-xs">URGENT</Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {ride.request_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(ride.request_date), 'MMM d')}
                </span>
              )}
              {showPickupTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {ride.pickup_time}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${sc.color}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {sc.label}
            </Badge>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {/* Expanded view */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Locations */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Pickup
                </p>
                <p className="font-medium text-foreground">{ride.pickup_location}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-red-600" /> Destination
                </p>
                <p className="font-medium text-foreground">{ride.dropoff_location}</p>
              </div>
            </div>

            {/* Ride details */}
            {(ride.purpose || ride.appointment_time || ride.special_instructions) && (
              <div className="space-y-2 text-sm">
                {ride.purpose && (
                  <p>
                    <span className="font-semibold text-muted-foreground">Purpose:</span>{' '}
                    <span className="capitalize">{ride.purpose.replace(/_/g, ' ')}</span>
                  </p>
                )}
                {ride.appointment_time && (
                  <p>
                    <span className="font-semibold text-muted-foreground">Appointment time:</span> {ride.appointment_time}
                  </p>
                )}
                {ride.special_instructions && (
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200/50 text-xs">
                    <p className="font-semibold text-amber-700 dark:text-amber-300 mb-0.5">Special instructions:</p>
                    <p className="text-amber-700 dark:text-amber-300">{ride.special_instructions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Driver info */}
            {ride.assigned_driver_name && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200/50">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
                  <User className="w-4 h-4" /> Your Driver
                </div>
                <p className="mt-2 text-foreground font-medium">{ride.assigned_driver_name}</p>
                {ride.assigned_vehicle_name && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Car className="w-3.5 h-3.5" /> {ride.assigned_vehicle_name}
                  </p>
                )}
              </div>
            )}

            {/* Status-specific messages */}
            {ride.status === 'en_route' && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200/50 text-sm">
                <p className="text-yellow-700 dark:text-yellow-300">
                  🚙 Driver is on the way. Be ready at the pickup location.
                </p>
              </div>
            )}

            {ride.status === 'scheduled' && !showPickupTime && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200/50 text-sm">
                <p className="text-blue-700 dark:text-blue-300">
                  Pickup time will be confirmed soon.
                </p>
              </div>
            )}

            {ride.status === 'pending' && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200/50 text-sm">
                <p className="text-amber-700 dark:text-amber-300">
                  Your ride is being reviewed. You'll receive an update shortly.
                </p>
              </div>
            )}

            {/* Return trip info */}
            {ride.return_trip && ride.return_pickup_time && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded border border-purple-200/50 text-sm">
                <p className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                  <RotateCcw className="w-4 h-4" /> Return Trip
                </p>
                <p className="mt-1 text-foreground">
                  Pickup from destination at <span className="font-medium">{ride.return_pickup_time}</span>
                </p>
              </div>
            )}

            {/* Confirm ready button */}
            {canConfirm && (
              <Button
                onClick={handleConfirmReady}
                disabled={confirming}
                className="w-full"
              >
                {confirming ? 'Confirming...' : confirmed ? '✓ Readiness confirmed' : 'Confirm I\'m Ready'}
              </Button>
            )}

            {confirmed && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded border border-emerald-200/50 text-sm">
                <p className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Readiness confirmed
                </p>
              </div>
            )}

            {/* Support */}
            <div className="pt-2 border-t text-xs text-muted-foreground text-center">
              Need help? Call {participant?.emergency_contact_phone || 'support'}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}