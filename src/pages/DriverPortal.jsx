import { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  MapPin, Clock, Phone, Navigation, CheckCircle2, AlertTriangle, 
  User, ChevronRight, MessageSquare, Truck, Calendar, ArrowRight
} from 'lucide-react';
import { format, addDays } from 'date-fns';

const statusConfig = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  driver_assigned: { label: 'Assigned', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  en_route: { label: 'En Route', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  rider_picked_up: { label: 'Picked Up', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  dropped_off: { label: 'Dropped Off', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  return_pending: { label: 'Return Pending', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  completed: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  no_show: { label: 'No-Show', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

function RideCard({ ride, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const config = statusConfig[ride.status] || { label: ride.status, color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };

  const nextActions = {
    driver_assigned: [{ label: 'Mark En Route', status: 'en_route' }],
    scheduled: [{ label: 'Mark En Route', status: 'en_route' }],
    en_route: [{ label: 'Rider Picked Up', status: 'rider_picked_up' }, { label: 'No-Show', status: 'no_show', variant: 'destructive' }],
    rider_picked_up: [{ label: 'Drop-Off Complete', status: ride.return_trip ? 'return_pending' : 'dropped_off' }],
    dropped_off: [{ label: 'Complete Ride', status: 'completed' }],
    return_pending: [{ label: 'Picked Up for Return', status: 'rider_picked_up' }],
  };

  const actions = nextActions[ride.status] || [];

  return (
    <Card className="border-l-4" style={{ borderLeftColor: ride.priority === 'urgent' ? '#ef4444' : ride.priority === 'high' ? '#f59e0b' : '#6366f1' }}>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-sm">{ride.participant_name}</span>
              {ride.priority !== 'standard' && (
                <Badge variant="outline" className={`text-xs ${ride.priority === 'urgent' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                  {ride.priority.toUpperCase()}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Pickup: <strong>{ride.pickup_time}</strong></span>
              {ride.appointment_time && <span className="text-xs text-muted-foreground">· Appt: {ride.appointment_time}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${config.color}`}>{config.label}</Badge>
            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-3">
          <div className="grid grid-cols-1 gap-2 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">Pickup</p>
                <p className="text-sm">{ride.pickup_location}</p>
                {ride.special_instructions && (
                  <p className="text-xs text-amber-600 mt-1 font-medium">⚠️ {ride.special_instructions}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">Destination</p>
                <p className="text-sm">{ride.dropoff_location}</p>
              </div>
            </div>
          </div>

          {ride.return_trip && (
            <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200/50 text-xs text-blue-700 dark:text-blue-400">
              🔄 Round trip — return pickup at <strong>{ride.return_pickup_time || 'TBD'}</strong>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p><span className="font-medium">Purpose:</span> {ride.purpose?.replace(/_/g, ' ')}</p>
            {ride.driver_notes && <p><span className="font-medium">Notes:</span> {ride.driver_notes}</p>}
          </div>

          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {actions.map(action => (
                <Button
                  key={action.status}
                  size="sm"
                  variant={action.variant || 'default'}
                  onClick={() => onAction(ride, action.status, notes)}
                >
                  {action.label}
                </Button>
              ))}
              <Button size="sm" variant="outline" onClick={() => setShowNotes(!showNotes)}>
                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                Add Note
              </Button>
            </div>
          )}

          {showNotes && (
            <div className="space-y-2">
              <Textarea
                placeholder="Add driver notes for this ride..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <Button size="sm" onClick={() => { onAction(ride, ride.status, notes); setShowNotes(false); }}>
                Save Note
              </Button>
            </div>
          )}

          {ride.status === 'completed' && ride.post_ride_notes && (
            <div className="p-2 bg-muted/30 rounded text-xs">
              <span className="font-medium">Post-ride notes:</span> {ride.post_ride_notes}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function DriverPortal() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [activeDay, setActiveDay] = useState('today');

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u) setCurrentUser(u);
    });
  }, []);

  const { data: allDrivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list('-created_date', 200),
  });

  useEffect(() => {
    if (currentUser && allDrivers.length > 0) {
      const profile = allDrivers.find(d => d.linked_user_email === currentUser.email || d.email === currentUser.email);
      setDriverProfile(profile || null);
    }
  }, [currentUser, allDrivers]);

  const { data: allRides = [] } = useQuery({
    queryKey: ['transport-requests'],
    queryFn: () => base44.entities.TransportRequest.list('-request_date', 500),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TransportRequest.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transport-requests'] }),
  });

  const myRides = useMemo(() => {
    if (!driverProfile) return { today: [], tomorrow: [] };
    const driverName = `${driverProfile.first_name} ${driverProfile.last_name}`;
    const todayRides = allRides.filter(r => r.request_date === today && (r.assigned_driver_name === driverName || r.assigned_driver_id === driverProfile.id));
    const tomorrowRides = allRides.filter(r => r.request_date === tomorrow && (r.assigned_driver_name === driverName || r.assigned_driver_id === driverProfile.id));
    const sortByTime = (a, b) => (a.pickup_time || '').localeCompare(b.pickup_time || '');
    return { today: todayRides.sort(sortByTime), tomorrow: tomorrowRides.sort(sortByTime) };
  }, [allRides, driverProfile, today, tomorrow]);

  const handleAction = async (ride, newStatus, notes) => {
    const now = new Date().toISOString();
    const update = { status: newStatus };
    if (notes) update.driver_notes = notes;
    if (newStatus === 'rider_picked_up') update.picked_up_at = now;
    if (newStatus === 'dropped_off' || newStatus === 'completed') update.dropped_off_at = now;
    if (newStatus === 'completed') update.completed_at = now;
    await updateMutation.mutateAsync({ id: ride.id, data: update });
  };

  const displayRides = activeDay === 'today' ? myRides.today : myRides.tomorrow;
  const completedToday = myRides.today.filter(r => r.status === 'completed').length;
  const pendingToday = myRides.today.filter(r => !['completed', 'cancelled', 'no_show'].includes(r.status)).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Driver Dispatch</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {driverProfile ? `Welcome, ${driverProfile.first_name}!` : 'Your daily ride schedule'}
          </p>
        </div>
        {driverProfile?.assigned_vehicle_name && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
            <Truck className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{driverProfile.assigned_vehicle_name}</span>
          </div>
        )}
      </div>

      {!driverProfile && (
        <Card className="p-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Driver profile not linked</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                Your user account ({currentUser?.email}) is not linked to a driver profile. Ask an admin to set your email in the Driver Management page under "Linked User Email".
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-2xl font-bold">{myRides.today.length}</p>
          <p className="text-xs text-muted-foreground">Total Today</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-emerald-600">{completedToday}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-amber-600">{pendingToday}</p>
          <p className="text-xs text-muted-foreground">Remaining</p>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeDay === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveDay('today')}
          className="gap-2"
        >
          <Calendar className="w-4 h-4" />
          Today ({myRides.today.length})
        </Button>
        <Button
          variant={activeDay === 'tomorrow' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveDay('tomorrow')}
          className="gap-2"
        >
          <Calendar className="w-4 h-4" />
          Tomorrow ({myRides.tomorrow.length})
        </Button>
      </div>

      {displayRides.length === 0 ? (
        <Card className="p-10 text-center">
          <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No rides scheduled</p>
          <p className="text-xs text-muted-foreground mt-1">
            {activeDay === 'today' ? "You're all clear for today." : "No rides assigned for tomorrow yet."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayRides.map(ride => (
            <RideCard key={ride.id} ride={ride} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  );
}