import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Clock, AlertTriangle, Truck, Car, User, RefreshCw, Zap,
  ArrowRight, CheckCircle2, XCircle, Filter, ChevronDown, ChevronUp,
  Phone, MapPin, RotateCcw, AlertCircle
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const TIME_BLOCKS = [
  { id: 'early', label: 'Early Morning', range: 'Before 7:00 AM', start: 0, end: 7 },
  { id: 'morning', label: 'Morning Rush', range: '7:00 – 9:00 AM', start: 7, end: 9 },
  { id: 'midmorning', label: 'Mid-Morning', range: '9:00 – 11:00 AM', start: 9, end: 11 },
  { id: 'midday', label: 'Midday', range: '11:00 AM – 1:00 PM', start: 11, end: 13 },
  { id: 'afternoon', label: 'Afternoon', range: '1:00 – 3:00 PM', start: 13, end: 15 },
  { id: 'late', label: 'Late Afternoon', range: '3:00 – 5:00 PM', start: 15, end: 17 },
  { id: 'evening', label: 'Evening', range: 'After 5:00 PM', start: 17, end: 24 },
  { id: 'none', label: 'No Time Set', range: 'Time TBD', start: -1, end: -1 },
];

const STATUS_CONFIG = {
  requested:      { label: 'Requested',      bg: 'bg-slate-100 dark:bg-slate-800',       border: 'border-l-slate-400',   badge: 'bg-slate-100 text-slate-600' },
  pending:        { label: 'Pending',         bg: 'bg-slate-100 dark:bg-slate-800',       border: 'border-l-slate-400',   badge: 'bg-slate-100 text-slate-600' },
  under_review:   { label: 'Under Review',    bg: 'bg-amber-50 dark:bg-amber-950/20',     border: 'border-l-amber-400',   badge: 'bg-amber-100 text-amber-700' },
  approved:       { label: 'Approved',        bg: 'bg-blue-50 dark:bg-blue-950/20',       border: 'border-l-blue-400',    badge: 'bg-blue-100 text-blue-700' },
  scheduled:      { label: 'Scheduled',       bg: 'bg-indigo-50 dark:bg-indigo-950/20',   border: 'border-l-indigo-400',  badge: 'bg-indigo-100 text-indigo-700' },
  driver_assigned:{ label: 'Assigned',        bg: 'bg-violet-50 dark:bg-violet-950/20',   border: 'border-l-violet-500',  badge: 'bg-violet-100 text-violet-700' },
  assigned:       { label: 'Assigned',        bg: 'bg-violet-50 dark:bg-violet-950/20',   border: 'border-l-violet-500',  badge: 'bg-violet-100 text-violet-700' },
  en_route:       { label: 'En Route',        bg: 'bg-yellow-50 dark:bg-yellow-950/20',   border: 'border-l-yellow-400',  badge: 'bg-yellow-100 text-yellow-700' },
  rider_picked_up:{ label: 'Picked Up',       bg: 'bg-orange-50 dark:bg-orange-950/20',   border: 'border-l-orange-400',  badge: 'bg-orange-100 text-orange-700' },
  dropped_off:    { label: 'Dropped Off',     bg: 'bg-teal-50 dark:bg-teal-950/20',       border: 'border-l-teal-400',    badge: 'bg-teal-100 text-teal-700' },
  return_pending: { label: 'Return Pending',  bg: 'bg-cyan-50 dark:bg-cyan-950/20',       border: 'border-l-cyan-400',    badge: 'bg-cyan-100 text-cyan-700' },
  completed:      { label: 'Completed',       bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-l-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  cancelled:      { label: 'Cancelled',       bg: 'bg-slate-100 dark:bg-slate-800',       border: 'border-l-slate-300',   badge: 'bg-slate-100 text-slate-500' },
  no_show:        { label: 'No-Show',         bg: 'bg-red-50 dark:bg-red-950/20',         border: 'border-l-red-500',     badge: 'bg-red-100 text-red-700' },
  denied:         { label: 'Denied',          bg: 'bg-slate-100 dark:bg-slate-800',       border: 'border-l-slate-300',   badge: 'bg-slate-100 text-slate-500' },
  in_progress:    { label: 'In Progress',     bg: 'bg-yellow-50 dark:bg-yellow-950/20',   border: 'border-l-yellow-400',  badge: 'bg-yellow-100 text-yellow-700' },
};

const PRIORITY_BORDER = {
  urgent: 'ring-2 ring-red-400',
  high: 'ring-1 ring-amber-400',
  standard: '',
};

function getHour(timeStr) {
  if (!timeStr) return -1;
  const [h] = timeStr.split(':').map(Number);
  return h;
}

function RideBlock({ ride, onAssign, drivers, vehicles, wouldConflict }) {
  const [open, setOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(ride.assigned_driver_id || '');
  const [selectedVehicle, setSelectedVehicle] = useState(ride.assigned_vehicle_id || '');
  const navigate = useNavigate();
  const conflictWarning = selectedDriver && selectedDriver !== ride.assigned_driver_id && wouldConflict?.(selectedDriver, ride.id, ride.request_date, ride.pickup_time);

  const sc = STATUS_CONFIG[ride.status] || STATUS_CONFIG.requested;
  const isUnassigned = !ride.assigned_driver_name && !['completed', 'cancelled', 'no_show', 'denied'].includes(ride.status);
  const isActive = ['en_route', 'rider_picked_up', 'in_progress'].includes(ride.status);

  const handleAssign = async () => {
    setAssigning(true);
    await onAssign(ride.id, selectedDriver, selectedVehicle);
    setAssigning(false);
    setOpen(false);
  };

  return (
    <div className={`rounded-lg border-l-4 ${sc.border} ${sc.bg} ${PRIORITY_BORDER[ride.priority] || ''} p-3 text-sm transition-all hover:shadow-sm`}>
      {/* Top row */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold truncate">{ride.participant_name}</span>
            {ride.priority !== 'standard' && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-bold uppercase ${ride.priority === 'urgent' ? 'bg-red-500 text-white' : 'bg-amber-400 text-white'}`}>
                {ride.priority}
              </span>
            )}
            {ride.return_trip && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium flex items-center gap-0.5">
                <RotateCcw className="w-2.5 h-2.5" /> RT
              </span>
            )}
            {isUnassigned && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-bold">UNASSIGNED</span>
            )}
            {isActive && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-200 text-yellow-800 font-bold animate-pulse">LIVE</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ride.pickup_time || 'TBD'}</span>
            {ride.assigned_driver_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{ride.assigned_driver_name}</span>}
            {ride.assigned_vehicle_name && <span className="flex items-center gap-1"><Car className="w-3 h-3" />{ride.assigned_vehicle_name}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.badge}`}>{sc.label}</span>
          <button onClick={() => setOpen(!open)} className="text-muted-foreground hover:text-foreground">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground font-medium flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-500" />Pickup</p>
              <p className="font-medium">{ride.pickup_location}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium flex items-center gap-1"><MapPin className="w-3 h-3 text-red-500" />Dropoff</p>
              <p className="font-medium">{ride.dropoff_location}</p>
            </div>
            {ride.appointment_time && <div><p className="text-muted-foreground">Appt Time</p><p className="font-medium">{ride.appointment_time}</p></div>}
            <div><p className="text-muted-foreground">Purpose</p><p className="font-medium capitalize">{ride.purpose?.replace(/_/g, ' ')}</p></div>
          </div>

          {ride.special_instructions && (
            <div className="flex items-start gap-1.5 p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200/50 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              <span className="text-amber-700 dark:text-amber-400">{ride.special_instructions}</span>
            </div>
          )}

          {/* Assignment controls */}
          {!['completed', 'cancelled', 'no_show', 'denied'].includes(ride.status) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assign</p>
              {conflictWarning && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200/60 p-2 rounded">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Driver conflict detected — this driver has another ride within 90 min
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                  <SelectTrigger className={`h-8 text-xs flex-1 min-w-[140px] ${conflictWarning ? 'border-red-400' : ''}`}>
                    <SelectValue placeholder="Select driver…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>— No driver —</SelectItem>
                    {drivers.filter(d => d.status === 'active').map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.first_name} {d.last_name} {d.availability === 'on_duty' ? '●' : '○'}
                        {d.license_status === 'expired' ? ' ⚠️' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger className="h-8 text-xs flex-1 min-w-[140px]">
                    <SelectValue placeholder="Select vehicle…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>— No vehicle —</SelectItem>
                    {vehicles.filter(v => v.status === 'active').map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.nickname || `${v.make} ${v.model}`} ({v.service_status}) Cap:{v.seat_capacity}
                        {v.wheelchair_accessible ? ' ♿' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" className={`h-8 text-xs ${conflictWarning ? 'bg-amber-500 hover:bg-amber-600' : ''}`} onClick={handleAssign} disabled={assigning}>
                  {assigning ? 'Saving…' : conflictWarning ? 'Force Assign' : 'Apply'}
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate(`/requests?id=${ride.id}`)}>
              Open Detail
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function VehicleLane({ vehicle, rides, drivers, onAssign, wouldConflict }) {
  const activeRides = rides.filter(r => !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status));
  const completed = rides.filter(r => r.status === 'completed');

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">{vehicle.nickname || `${vehicle.make} ${vehicle.model}`}</CardTitle>
            <Badge variant="outline" className="text-xs capitalize">{vehicle.service_status?.replace(/_/g, ' ')}</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">{activeRides.length} active</span>
            <span>·</span>
            <span>{completed.length} done</span>
            <span>·</span>
            <span>Cap: {vehicle.seat_capacity}</span>
            {vehicle.wheelchair_accessible && <span className="text-blue-600 font-medium">♿</span>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {rides.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No rides assigned to this vehicle</p>
        ) : (
          <div className="space-y-2">
            {rides.sort((a, b) => (a.pickup_time || '').localeCompare(b.pickup_time || '')).map(ride => (
              <RideBlock key={ride.id} ride={ride} onAssign={onAssign} drivers={drivers} vehicles={[vehicle]} wouldConflict={wouldConflict} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DispatchBoard() {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [viewMode, setViewMode] = useState('time'); // 'time' | 'driver' | 'vehicle'
  const [driverFilter, setDriverFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [collapsedBlocks, setCollapsedBlocks] = useState({});

  const { data: allRequests = [] } = useQuery({ queryKey: ['transport-requests'], queryFn: () => base44.entities.TransportRequest.list('-created_date', 1000) });
  const { data: drivers = [] } = useQuery({ queryKey: ['drivers'], queryFn: () => base44.entities.Driver.list('first_name', 200) });
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: () => base44.entities.Vehicle.list('nickname', 100) });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TransportRequest.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transport-requests'] }),
  });

  // Detect if assigning driverId to a ride on `date` at `time` would conflict
  const wouldConflict = (driverId, rideId, rideDate, rideTime) => {
    if (!driverId || !rideTime) return false;
    const [rh, rm] = rideTime.split(':').map(Number);
    const rMin = rh * 60 + (rm || 0);
    return allRequests.some(r =>
      r.id !== rideId &&
      r.assigned_driver_id === driverId &&
      r.request_date === rideDate &&
      r.pickup_time &&
      !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status) &&
      (() => { const [h, m] = r.pickup_time.split(':').map(Number); return Math.abs(h * 60 + (m || 0) - rMin) < 90; })()
    );
  };

  const handleAssign = async (rideId, driverId, vehicleId) => {
    const driver = drivers.find(d => d.id === driverId);
    const vehicle = vehicles.find(v => v.id === vehicleId);
    const ride = allRequests.find(r => r.id === rideId);
    const update = {};
    if (driver) {
      // Warn but still allow — dispatcher makes final call
      update.assigned_driver_id = driver.id;
      update.assigned_driver_name = `${driver.first_name} ${driver.last_name}`;
    }
    if (vehicleId === '') { update.assigned_vehicle_id = ''; update.assigned_vehicle_name = ''; }
    else if (vehicle) { update.assigned_vehicle_id = vehicle.id; update.assigned_vehicle_name = vehicle.nickname || `${vehicle.make} ${vehicle.model}`; }
    if (Object.keys(update).length > 0) {
      if (!['completed', 'cancelled', 'no_show', 'denied', 'en_route', 'rider_picked_up'].includes(ride?.status)) {
        update.status = 'driver_assigned';
      }
      await updateMutation.mutateAsync({ id: rideId, data: update });
    }
  };

  const dateRides = useMemo(() => {
    let rides = allRequests.filter(r => r.request_date === date);
    if (driverFilter !== 'all') rides = rides.filter(r => r.assigned_driver_name === driverFilter || r.assigned_driver_id === driverFilter);
    if (statusFilter !== 'all') {
      if (statusFilter === 'unassigned') rides = rides.filter(r => !r.assigned_driver_name && !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status));
      else if (statusFilter === 'active') rides = rides.filter(r => ['en_route', 'rider_picked_up', 'in_progress'].includes(r.status));
      else rides = rides.filter(r => r.status === statusFilter);
    }
    return rides;
  }, [allRequests, date, driverFilter, statusFilter]);

  const ridesByBlock = useMemo(() => {
    const map = {};
    TIME_BLOCKS.forEach(b => { map[b.id] = []; });
    dateRides.forEach(ride => {
      const h = getHour(ride.pickup_time);
      const block = h === -1 ? 'none' : TIME_BLOCKS.find(b => b.id !== 'none' && h >= b.start && h < b.end);
      const blockId = block ? block.id : 'none';
      if (map[blockId]) map[blockId].push(ride);
    });
    return map;
  }, [dateRides]);

  const ridesByDriver = useMemo(() => {
    const map = {};
    drivers.filter(d => d.status === 'active').forEach(d => {
      const name = `${d.first_name} ${d.last_name}`;
      map[d.id] = { driver: d, rides: dateRides.filter(r => r.assigned_driver_name === name || r.assigned_driver_id === d.id) };
    });
    // unassigned bucket
    map['__unassigned__'] = { driver: null, rides: dateRides.filter(r => !r.assigned_driver_id && !r.assigned_driver_name && !['cancelled', 'denied'].includes(r.status)) };
    return map;
  }, [dateRides, drivers]);

  const ridesByVehicle = useMemo(() => {
    const map = {};
    vehicles.filter(v => v.status === 'active').forEach(v => {
      map[v.id] = { vehicle: v, rides: dateRides.filter(r => r.assigned_vehicle_id === v.id) };
    });
    return map;
  }, [dateRides, vehicles]);

  // Detect driver conflicts for today's date
  const driverConflictNames = useMemo(() => {
    const active = dateRides.filter(r => r.assigned_driver_id && r.pickup_time && !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status));
    const map = {};
    active.forEach(r => {
      const k = r.assigned_driver_id;
      if (!map[k]) map[k] = [];
      map[k].push(r);
    });
    const names = new Set();
    Object.values(map).forEach(group => {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const [h1, m1] = (group[i].pickup_time || '').split(':').map(Number);
          const [h2, m2] = (group[j].pickup_time || '').split(':').map(Number);
          if (!isNaN(h1) && !isNaN(h2) && Math.abs((h1 * 60 + (m1 || 0)) - (h2 * 60 + (m2 || 0))) < 90) {
            names.add(group[i].assigned_driver_name);
          }
        }
      }
    });
    return [...names];
  }, [dateRides]);

  const summary = useMemo(() => ({
    total: dateRides.length,
    unassigned: dateRides.filter(r => !r.assigned_driver_name && !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status)).length,
    active: dateRides.filter(r => ['en_route', 'rider_picked_up', 'in_progress'].includes(r.status)).length,
    completed: dateRides.filter(r => r.status === 'completed').length,
    urgent: dateRides.filter(r => r.priority === 'urgent').length,
    returnTrips: dateRides.filter(r => r.return_trip).length,
    conflicts: driverConflictNames.length,
  }), [dateRides, driverConflictNames]);

  const toggleBlock = (id) => setCollapsedBlocks(p => ({ ...p, [id]: !p[id] }));
  const uniqueDriverNames = [...new Set(allRequests.filter(r => r.assigned_driver_name).map(r => r.assigned_driver_name))];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" /> Dispatch Board
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time ride assignments, driver load, and vehicle utilization</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-transparent text-sm" />
          <Button size="sm" variant="outline" onClick={() => setDate(today)}>Today</Button>
          <Button size="sm" variant="outline" onClick={() => setDate(format(addDays(new Date(date), 1), 'yyyy-MM-dd'))}>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
        {[
          { label: 'Total Rides', val: summary.total, color: 'text-foreground', bg: 'bg-muted/50' },
          { label: 'Unassigned', val: summary.unassigned, color: summary.unassigned > 0 ? 'text-red-600' : 'text-emerald-600', bg: summary.unassigned > 0 ? 'bg-red-500/8' : 'bg-emerald-500/8' },
          { label: 'Live Now', val: summary.active, color: 'text-amber-600', bg: 'bg-amber-500/8' },
          { label: 'Completed', val: summary.completed, color: 'text-emerald-600', bg: 'bg-emerald-500/8' },
          { label: 'Urgent', val: summary.urgent, color: summary.urgent > 0 ? 'text-red-700 font-bold' : 'text-muted-foreground', bg: summary.urgent > 0 ? 'bg-red-500/8' : 'bg-muted/30' },
          { label: 'Round Trips', val: summary.returnTrips, color: 'text-blue-600', bg: 'bg-blue-500/8' },
          { label: 'Conflicts', val: summary.conflicts, color: summary.conflicts > 0 ? 'text-red-700 font-bold' : 'text-muted-foreground', bg: summary.conflicts > 0 ? 'bg-red-500/15' : 'bg-muted/30' },
        ].map(s => (
          <div key={s.label} className={`rounded-lg p-3 ${s.bg} text-center`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      {driverConflictNames.length > 0 && (
        <div className="flex items-center gap-2 p-2.5 bg-red-500/8 border border-red-400/30 rounded-lg text-xs text-red-600 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Double-booking conflict: {driverConflictNames.join(', ')} — expand those rides to resolve
        </div>
      )}

      {/* Filters + View Switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-input overflow-hidden text-sm">
          {[['time', 'Time Blocks'], ['driver', 'By Driver'], ['vehicle', 'By Vehicle']].map(([v, l]) => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === v ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
              {l}
            </button>
          ))}
        </div>
        <Select value={driverFilter} onValueChange={setDriverFilter}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="All Drivers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drivers</SelectItem>
            {uniqueDriverNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            <SelectItem value="active">Live / Active</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="driver_assigned">Assigned</SelectItem>
            <SelectItem value="en_route">En Route</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">{dateRides.length} rides on {date}</span>
      </div>

      {/* ── TIME VIEW ── */}
      {viewMode === 'time' && (
        <div className="space-y-3">
          {TIME_BLOCKS.map(block => {
            const rides = ridesByBlock[block.id] || [];
            if (rides.length === 0) return null;
            const collapsed = collapsedBlocks[block.id];
            const hasUrgent = rides.some(r => r.priority === 'urgent');
            const hasUnassigned = rides.some(r => !r.assigned_driver_name && !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status));
            return (
              <Card key={block.id} className="overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => toggleBlock(block.id)}>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-primary" />
                    <div>
                      <span className="font-semibold text-sm">{block.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{block.range}</span>
                    </div>
                    {hasUrgent && <span className="text-xs px-1.5 py-0.5 rounded bg-red-500 text-white font-bold">URGENT</span>}
                    {hasUnassigned && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-400 text-white font-bold">UNASSIGNED</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{rides.length} ride{rides.length !== 1 ? 's' : ''}</Badge>
                    {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </div>
                </button>
                {!collapsed && (
                  <div className="p-3 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                    {rides.sort((a, b) => {
                      const pOrder = { urgent: 0, high: 1, standard: 2 };
                      const pDiff = (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
                      if (pDiff !== 0) return pDiff;
                      return (a.pickup_time || '').localeCompare(b.pickup_time || '');
                    }).map(ride => (
                      <RideBlock key={ride.id} ride={ride} onAssign={handleAssign} drivers={drivers} vehicles={vehicles} wouldConflict={wouldConflict} />
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
          {dateRides.length === 0 && (
            <Card className="p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">No rides on {date}</p>
              <p className="text-xs text-muted-foreground mt-1">Adjust your filters or select a different date.</p>
            </Card>
          )}
        </div>
      )}

      {/* ── DRIVER VIEW ── */}
      {viewMode === 'driver' && (
        <div className="space-y-4">
          {Object.entries(ridesByDriver).map(([id, { driver, rides }]) => {
            if (rides.length === 0) return null;
            const name = driver ? `${driver.first_name} ${driver.last_name}` : 'Unassigned Rides';
            const active = rides.filter(r => !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status));
            const done = rides.filter(r => r.status === 'completed');
            return (
              <Card key={id} className="overflow-hidden">
                <CardHeader className="pb-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className={`w-4 h-4 ${driver ? 'text-primary' : 'text-red-500'}`} />
                      <CardTitle className="text-sm">{name}</CardTitle>
                      {driver && (
                        <>
                          <Badge variant="outline" className="text-xs capitalize">{driver.availability?.replace(/_/g, ' ')}</Badge>
                          {driver.assigned_vehicle_name && <span className="text-xs text-muted-foreground flex items-center gap-1"><Car className="w-3 h-3" />{driver.assigned_vehicle_name}</span>}
                        </>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{active.length}</span> active · <span className="text-emerald-600">{done.length}</span> done
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                  {rides.sort((a, b) => (a.pickup_time || '').localeCompare(b.pickup_time || '')).map(ride => (
                    <RideBlock key={ride.id} ride={ride} onAssign={handleAssign} drivers={drivers} vehicles={vehicles} wouldConflict={wouldConflict} />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── VEHICLE VIEW ── */}
      {viewMode === 'vehicle' && (
        <div className="space-y-4">
          {Object.entries(ridesByVehicle).map(([id, { vehicle, rides }]) => {
            if (rides.length === 0 && vehicle.service_status !== 'available') return null;
            return <VehicleLane key={id} vehicle={vehicle} rides={rides} drivers={drivers} onAssign={handleAssign} wouldConflict={wouldConflict} />;
          })}
          {/* Unassigned to any vehicle */}
          {(() => {
            const noVehicle = dateRides.filter(r => !r.assigned_vehicle_id && !['cancelled', 'denied'].includes(r.status));
            if (noVehicle.length === 0) return null;
            return (
              <Card className="overflow-hidden border-dashed border-amber-400">
                <CardHeader className="pb-2 bg-amber-50 dark:bg-amber-950/20">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <CardTitle className="text-sm text-amber-700 dark:text-amber-400">No Vehicle Assigned ({noVehicle.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-3 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                  {noVehicle.sort((a, b) => (a.pickup_time || '').localeCompare(b.pickup_time || '')).map(ride => (
                    <RideBlock key={ride.id} ride={ride} onAssign={handleAssign} drivers={drivers} vehicles={vehicles} wouldConflict={wouldConflict} />
                  ))}
                </CardContent>
              </Card>
            );
          })()}
        </div>
      )}
    </div>
  );
}