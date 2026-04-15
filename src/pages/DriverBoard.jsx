import { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  MapPin, Clock, Phone, CheckCircle2, AlertTriangle, User,
  ChevronDown, ChevronUp, MessageSquare, Truck, Calendar,
  ArrowRight, RotateCcw, Navigation, Zap, Car, Info
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import LocationPermissionPrompt from '../components/geolocation/LocationPermissionPrompt';

const STATUS_ACTIONS = {
  driver_assigned: [{ label: 'Mark En Route →', status: 'en_route', variant: 'default' }],
  scheduled:       [{ label: 'Mark En Route →', status: 'en_route', variant: 'default' }],
  approved:        [{ label: 'Mark En Route →', status: 'en_route', variant: 'default' }],
  en_route:        [
    { label: 'Rider Picked Up ✓', status: 'rider_picked_up', variant: 'default' },
    { label: 'No-Show', status: 'no_show', variant: 'destructive' },
  ],
  rider_picked_up: [{ label: 'Drop-Off Complete', status: 'dropped_off', variant: 'default' }],
  dropped_off:     [{ label: 'Complete Ride ✓', status: 'completed', variant: 'default' }],
  return_pending:  [{ label: 'Picked Up for Return', status: 'rider_picked_up', variant: 'default' }],
};

const STATUS_STYLE = {
  driver_assigned: 'bg-violet-100 text-violet-700',
  scheduled:       'bg-indigo-100 text-indigo-700',
  approved:        'bg-blue-100 text-blue-700',
  en_route:        'bg-yellow-200 text-yellow-800 font-bold',
  rider_picked_up: 'bg-orange-200 text-orange-800 font-bold',
  dropped_off:     'bg-teal-100 text-teal-700',
  return_pending:  'bg-cyan-100 text-cyan-700',
  completed:       'bg-emerald-100 text-emerald-700',
  no_show:         'bg-red-100 text-red-700',
  cancelled:       'bg-slate-100 text-slate-500',
};

const PRIORITY_BORDER = {
  urgent: 'border-l-red-500',
  high:   'border-l-amber-400',
  standard: 'border-l-primary/30',
};

function RideCard({ ride, onAction, isNext, participant }) {
  const [open, setOpen] = useState(isNext);
  const [notes, setNotes] = useState(ride.driver_notes || '');
  const [showNotes, setShowNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const actions = STATUS_ACTIONS[ride.status] || [];
  const isDone = ['completed', 'cancelled', 'no_show'].includes(ride.status);

  const handleAction = async (status) => {
    setSaving(true);
    await onAction(ride, status, notes);
    setSaving(false);
  };

  return (
    <Card className={`border-l-4 ${PRIORITY_BORDER[ride.priority] || PRIORITY_BORDER.standard} ${isDone ? 'opacity-60' : ''} transition-all`}>
      <div className="p-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {isNext && !isDone && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-bold flex items-center gap-1">
                  <Navigation className="w-2.5 h-2.5" /> NEXT
                </span>
              )}
              <span className="font-semibold text-sm">{ride.participant_name}</span>
              {ride.priority !== 'standard' && (
                <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${ride.priority === 'urgent' ? 'bg-red-500 text-white' : 'bg-amber-400 text-white'}`}>
                  {ride.priority.toUpperCase()}
                </span>
              )}
              {ride.return_trip && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 flex items-center gap-0.5">
                  <RotateCcw className="w-2.5 h-2.5" /> Round Trip
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1 font-medium"><Clock className="w-3 h-3" />{ride.pickup_time || 'TBD'}</span>
              {ride.appointment_time && <span>Appt: {ride.appointment_time}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLE[ride.status] || 'bg-slate-100 text-slate-600'}`}>
              {ride.status?.replace(/_/g, ' ')}
            </span>
            {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </div>

      {open && (
        <CardContent className="pt-0 px-3 pb-3 space-y-3">
          {/* Route */}
          <div className="rounded-lg bg-muted/40 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">PICKUP</p>
                <p className="text-sm font-medium">{ride.pickup_location}</p>
              </div>
            </div>
            <div className="flex items-center justify-center"><ArrowRight className="w-4 h-4 text-muted-foreground" /></div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">DESTINATION</p>
                <p className="text-sm font-medium">{ride.dropoff_location}</p>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {ride.special_instructions && (
            <div className="flex items-start gap-2 p-2.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Special Instructions</p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">{ride.special_instructions}</p>
              </div>
            </div>
          )}

          {/* Return trip details */}
          {ride.return_trip && (
            <div className="flex items-start gap-2 p-2.5 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 text-xs text-blue-700 dark:text-blue-400">
              <RotateCcw className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>Return pickup at <strong>{ride.return_pickup_time || 'TBD'}</strong>
                {ride.return_pickup_location ? ` from ${ride.return_pickup_location}` : ''}
              </span>
            </div>
          )}

          {/* Info row */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-muted-foreground">Purpose: </span><span className="font-medium capitalize">{ride.purpose?.replace(/_/g, ' ')}</span></div>
            {participant?.phone && (
              <div>
                <a href={`tel:${participant.phone}`} className="flex items-center gap-1 text-primary hover:underline font-medium">
                  <Phone className="w-3 h-3" />{participant.phone}
                </a>
              </div>
            )}
            {participant?.mobility_needs && (
              <div className="col-span-2 p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded text-blue-700 dark:text-blue-400">
                <span className="font-bold">Mobility: </span>{participant.mobility_needs}
              </div>
            )}
            {ride.driver_notes && <div className="col-span-2"><span className="text-muted-foreground">Notes: </span><span className="font-medium">{ride.driver_notes}</span></div>}
          </div>

          {/* Actions */}
          {actions.length > 0 && !isDone && (
            <div className="flex flex-wrap gap-2 pt-1">
              {actions.map(a => (
                <Button key={a.status} size="sm" variant={a.variant || 'default'} disabled={saving}
                  onClick={() => handleAction(a.status)}>
                  {saving ? 'Saving…' : a.label}
                </Button>
              ))}
              <Button size="sm" variant="outline" onClick={() => setShowNotes(!showNotes)}>
                <MessageSquare className="w-3.5 h-3.5 mr-1" />Notes
              </Button>
            </div>
          )}

          {showNotes && (
            <div className="space-y-2">
              <Textarea placeholder="Add driver note…" value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="text-sm" />
              <Button size="sm" onClick={() => { onAction(ride, ride.status, notes); setShowNotes(false); }}>Save Note</Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function DriverBoard() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [activeDay, setActiveDay] = useState('today');
  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  useEffect(() => { base44.auth.me().then(u => { if (u) setCurrentUser(u); }); }, []);

  const { data: allDrivers = [] } = useQuery({ queryKey: ['drivers'], queryFn: () => base44.entities.Driver.list('-created_date', 200) });
  const { data: allRides = [] } = useQuery({ queryKey: ['transport-requests'], queryFn: () => base44.entities.TransportRequest.list('-request_date', 1000) });
  const { data: participants = [] } = useQuery({ queryKey: ['participants'], queryFn: () => base44.entities.Participant.list('-created_date', 500) });

  useEffect(() => {
    if (currentUser && allDrivers.length > 0) {
      const p = allDrivers.find(d => d.linked_user_email === currentUser.email || d.email === currentUser.email);
      setDriverProfile(p || null);
    }
  }, [currentUser, allDrivers]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TransportRequest.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transport-requests'] }),
  });

  // Calculate myRides BEFORE it's used in geolocation effect
  const myRides = useMemo(() => {
    if (!driverProfile) return { today: [], tomorrow: [] };
    const name = `${driverProfile.first_name} ${driverProfile.last_name}`;
    const sort = (a, b) => (a.pickup_time || '99:99').localeCompare(b.pickup_time || '99:99');
    const match = r => r.assigned_driver_name === name || r.assigned_driver_id === driverProfile.id;
    const todayRides = allRides.filter(r => r.request_date === today && match(r)).sort(sort);
    const tomorrowRides = allRides.filter(r => r.request_date === tomorrow && match(r)).sort(sort);
    // week lookahead for awareness
    const weekRides = allRides.filter(r => r.request_date > tomorrow && r.request_date <= format(addDays(new Date(), 7), 'yyyy-MM-dd') && match(r)).sort(sort);
    return { today: todayRides, tomorrow: tomorrowRides, week: weekRides };
  }, [allRides, driverProfile, today, tomorrow]);

  // Geolocation tracking
  useEffect(() => {
    if (!driverProfile || !navigator.geolocation) return;
    
    const sendLocation = (position) => {
      const { latitude, longitude, accuracy, heading } = position.coords;
      const speed = position.coords.speed || null;
      
      // Find current ride status for ETA
      const currentRide = myRides.today?.find(r => 
        ['driver_assigned', 'scheduled', 'en_route', 'rider_picked_up'].includes(r.status)
      );
      
      base44.functions.invoke('captureDriverLocation', {
        driver_id: driverProfile.id,
        driver_name: `${driverProfile.first_name} ${driverProfile.last_name}`,
        vehicle_id: driverProfile.assigned_vehicle_id,
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
        current_status: currentRide?.status || 'idle',
        current_request_id: currentRide?.id
      }).catch(err => console.error('Location update failed:', err));
    };

    const watchId = navigator.geolocation.watchPosition(sendLocation, 
      err => console.warn('Geolocation error:', err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [driverProfile, myRides]);

  const handleAction = async (ride, newStatus, notes) => {
    const now = new Date().toISOString();
    const update = { status: newStatus };
    if (notes) update.driver_notes = notes;
    if (newStatus === 'rider_picked_up') update.picked_up_at = now;
    if (newStatus === 'dropped_off') update.dropped_off_at = now;
    if (newStatus === 'completed') { update.dropped_off_at = now; update.completed_at = now; }
    await updateMutation.mutateAsync({ id: ride.id, data: update });
  };

  const displayRides = activeDay === 'today' ? myRides.today : myRides.tomorrow;
  const pendingRides = displayRides.filter(r => !['completed', 'cancelled', 'no_show'].includes(r.status));
  const completedRides = displayRides.filter(r => r.status === 'completed');
  const nextRide = pendingRides.find(r => ['driver_assigned', 'scheduled', 'approved', 'en_route'].includes(r.status)) || pendingRides[0] || null;

  const getParticipant = (name) => participants.find(p => `${p.first_name} ${p.last_name}` === name) || null;

  if (!driverProfile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Driver Board</h1>
          <p className="text-sm text-muted-foreground mt-2">Your daily ride schedule and action panel</p>
        </div>
        <Card className="p-6 border-0 bg-amber-50/50 dark:bg-amber-950/10 shadow-card">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">Driver profile not linked</p>
              <p className="text-sm text-amber-800 dark:text-amber-300 mt-2">Your account ({currentUser?.email}) is not linked to a driver profile. Ask an admin to set your email in Driver Management under "Linked User Email".</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Driver Board</h1>
          <p className="text-sm text-muted-foreground mt-2">Welcome, <span className="font-semibold text-foreground">{driverProfile.first_name}</span> — {format(new Date(), 'EEEE, MMM d')}</p>
        </div>
        {driverProfile.assigned_vehicle_name && (
          <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 rounded-lg border border-primary/20 shadow-sm">
            <Car className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Vehicle</p>
              <p className="text-sm font-bold text-foreground">{driverProfile.assigned_vehicle_name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Location Tracking Prompt */}
      <LocationPermissionPrompt />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', val: displayRides.length, color: 'text-foreground' },
          { label: 'Remaining', val: pendingRides.length, color: 'text-amber-600' },
          { label: 'Completed', val: completedRides.length, color: 'text-emerald-600' },
          { label: 'On-Time Rate', val: `${driverProfile.on_time_rate || 100}%`, color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border/50 shadow-card rounded-lg p-4 text-center hover:shadow-md transition-shadow">
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Next Up Banner */}
      {nextRide && activeDay === 'today' && (
        <div className="p-5 rounded-xl bg-gradient-to-br from-primary to-primary/90 text-primary-foreground flex items-start gap-4 shadow-lg">
          <Navigation className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wide opacity-70">Next Pickup</p>
            <p className="text-lg font-bold">{nextRide.participant_name}</p>
            <p className="text-sm opacity-80">{nextRide.pickup_time} · {nextRide.pickup_location}</p>
            {(() => { const p = getParticipant(nextRide.participant_name); return p?.phone ? (
              <a href={`tel:${p.phone}`} className="inline-flex items-center gap-1.5 mt-2 text-sm opacity-90 hover:opacity-100">
                <Phone className="w-3.5 h-3.5" /> {p.phone}
              </a>
            ) : null; })()}
            {(() => { const p = getParticipant(nextRide.participant_name); return p?.mobility_needs ? (
              <p className="text-xs opacity-80 mt-1 bg-white/20 rounded px-2 py-0.5">♿ {p.mobility_needs}</p>
            ) : null; })()}
          </div>
          <div className="text-right">
            <p className="text-xs opacity-70">Status</p>
            <p className="text-sm font-bold capitalize">{nextRide.status?.replace(/_/g, ' ')}</p>
          </div>
        </div>
      )}

      {/* Day Switcher */}
      <div className="flex gap-2 flex-wrap">
        {[['today', 'Today', myRides.today.length], ['tomorrow', 'Tomorrow', myRides.tomorrow.length]].map(([v, l, c]) => (
          <Button key={v} variant={activeDay === v ? 'default' : 'outline'} size="sm" onClick={() => setActiveDay(v)} className="gap-2">
            <Calendar className="w-4 h-4" />{l} ({c})
          </Button>
        ))}
        {myRides.week?.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2 px-2 py-1 bg-muted/40 rounded-md">
            <Info className="w-3.5 h-3.5" />+{myRides.week.length} rides next 7 days
          </span>
        )}
      </div>

      {/* Shift Info */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground p-4 bg-card border border-border/50 shadow-card rounded-lg">
        {driverProfile.shift_schedule && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Shift: {driverProfile.shift_schedule}</span>}
        {driverProfile.service_area && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />Area: {driverProfile.service_area}</span>}
        {driverProfile.phone && (
          <a href={`tel:${driverProfile.phone}`} className="flex items-center gap-1 hover:text-foreground">
            <Phone className="w-3.5 h-3.5" />{driverProfile.phone}
          </a>
        )}
      </div>

      {/* Ride List */}
      {displayRides.length === 0 ? (
        <Card className="p-10 text-center">
          <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">{activeDay === 'today' ? "No rides for today" : "No rides assigned for tomorrow yet"}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Group by time blocks */}
          {[
            { label: 'Before 7 AM', rides: displayRides.filter(r => getHour(r.pickup_time) !== -1 && getHour(r.pickup_time) < 7) },
            { label: '7 – 9 AM (Morning)', rides: displayRides.filter(r => getHour(r.pickup_time) >= 7 && getHour(r.pickup_time) < 9) },
            { label: '9 – 11 AM', rides: displayRides.filter(r => getHour(r.pickup_time) >= 9 && getHour(r.pickup_time) < 11) },
            { label: '11 AM – 1 PM', rides: displayRides.filter(r => getHour(r.pickup_time) >= 11 && getHour(r.pickup_time) < 13) },
            { label: '1 – 3 PM', rides: displayRides.filter(r => getHour(r.pickup_time) >= 13 && getHour(r.pickup_time) < 15) },
            { label: '3 – 5 PM (Afternoon)', rides: displayRides.filter(r => getHour(r.pickup_time) >= 15 && getHour(r.pickup_time) < 17) },
            { label: 'After 5 PM', rides: displayRides.filter(r => getHour(r.pickup_time) >= 17) },
            { label: 'Time TBD', rides: displayRides.filter(r => !r.pickup_time) },
          ].filter(g => g.rides.length > 0).map(group => (
            <div key={group.label}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />{group.label}
                <span className="font-normal">({group.rides.length})</span>
              </p>
              <div className="space-y-2">
                {group.rides.map(ride => (
                  <RideCard key={ride.id} ride={ride} onAction={handleAction}
                    isNext={nextRide?.id === ride.id && activeDay === 'today'}
                    participant={getParticipant(ride.participant_name)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getHour(t) {
  if (!t) return -1;
  const [h] = t.split(':').map(Number);
  return isNaN(h) ? -1 : h;
}