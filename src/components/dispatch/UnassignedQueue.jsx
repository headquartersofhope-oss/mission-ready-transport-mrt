import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, MapPin, User, Car, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInHours } from 'date-fns';

const URGENCY_CONFIG = {
  critical: { label: 'CRITICAL', bg: 'bg-red-500/10 border-red-500/30 border-l-red-500', badge: 'bg-red-500 text-white', icon: 'text-red-500' },
  high:     { label: 'HIGH',     bg: 'bg-amber-500/10 border-amber-400/30 border-l-amber-400', badge: 'bg-amber-400 text-white', icon: 'text-amber-500' },
  normal:   { label: 'PENDING',  bg: 'bg-blue-500/5 border-blue-300/20 border-l-blue-300', badge: 'bg-blue-100 text-blue-700', icon: 'text-blue-400' },
};

function getUrgency(ride) {
  if (ride.priority === 'urgent') return 'critical';
  if (ride.priority === 'high') return 'high';
  // rides within 4 hours become high urgency
  const today = format(new Date(), 'yyyy-MM-dd');
  if (ride.request_date === today && ride.pickup_time) {
    const [h, m] = ride.pickup_time.split(':').map(Number);
    const pickupMs = new Date().setHours(h, m || 0, 0, 0);
    const hoursUntil = (pickupMs - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < 2) return 'critical';
    if (hoursUntil < 4) return 'high';
  }
  return 'normal';
}

function getMissingItems(ride) {
  const missing = [];
  if (!ride.assigned_driver_name) missing.push('driver');
  if (!ride.assigned_vehicle_name) missing.push('vehicle');
  if (!ride.pickup_time) missing.push('pickup time');
  return missing;
}

export default function UnassignedQueue({ rides, onRideClick }) {
  const navigate = useNavigate();

  const unassigned = useMemo(() => {
    const terminal = ['completed', 'cancelled', 'no_show', 'denied'];
    return rides
      .filter(r => !terminal.includes(r.status) && getMissingItems(r).length > 0)
      .sort((a, b) => {
        const order = { critical: 0, high: 1, normal: 2 };
        const ua = getUrgency(a), ub = getUrgency(b);
        if (order[ua] !== order[ub]) return order[ua] - order[ub];
        return (a.pickup_time || '99:99').localeCompare(b.pickup_time || '99:99');
      });
  }, [rides]);

  if (unassigned.length === 0) {
    return (
      <Card className="border-emerald-300/40 bg-emerald-500/5">
        <CardContent className="flex items-center gap-3 py-4">
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <Car className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">All rides fully assigned</p>
            <p className="text-xs text-muted-foreground">No rides are missing driver, vehicle, or pickup time</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const critical = unassigned.filter(r => getUrgency(r) === 'critical');
  const high = unassigned.filter(r => getUrgency(r) === 'high');
  const normal = unassigned.filter(r => getUrgency(r) === 'normal');

  return (
    <Card className="border-amber-400/30">
      <CardHeader className="pb-3 bg-amber-500/5 border-b border-amber-400/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            Unassigned Ride Queue
            <Badge className="bg-amber-500 text-white ml-1">{unassigned.length}</Badge>
          </CardTitle>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => navigate('/dispatch-board')}>
            Open Dispatch Board <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="flex gap-3 mt-1 text-xs">
          {critical.length > 0 && <span className="text-red-600 font-bold">{critical.length} critical</span>}
          {high.length > 0 && <span className="text-amber-600 font-semibold">{high.length} high</span>}
          {normal.length > 0 && <span className="text-muted-foreground">{normal.length} pending</span>}
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {unassigned.map(ride => {
          const urgency = getUrgency(ride);
          const cfg = URGENCY_CONFIG[urgency];
          const missing = getMissingItems(ride);

          return (
            <div
              key={ride.id}
              className={`rounded-lg border border-l-4 p-3 cursor-pointer hover:shadow-sm transition-all ${cfg.bg}`}
              onClick={() => onRideClick(ride)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{ride.participant_name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${cfg.badge}`}>{cfg.label}</span>
                    {ride.return_trip && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">RT</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className={`w-3 h-3 ${!ride.pickup_time ? 'text-red-500' : cfg.icon}`} />
                      {ride.pickup_time || <span className="text-red-600 font-semibold">NO TIME SET</span>}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{ride.pickup_location}
                    </span>
                    <span className="text-muted-foreground">{ride.request_date}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right space-y-1">
                  <div className="flex flex-wrap gap-1 justify-end">
                    {missing.map(m => (
                      <span key={m} className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium">
                        No {m}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{ride.status?.replace(/_/g, ' ')}</p>
                </div>
              </div>
              {(ride.assigned_driver_name || ride.assigned_vehicle_name) && (
                <div className="flex gap-3 mt-2 text-xs border-t border-border/30 pt-2">
                  {ride.assigned_driver_name && (
                    <span className="flex items-center gap-1 text-violet-700 dark:text-violet-400">
                      <User className="w-3 h-3" />{ride.assigned_driver_name}
                    </span>
                  )}
                  {ride.assigned_vehicle_name && (
                    <span className="flex items-center gap-1 text-primary">
                      <Car className="w-3 h-3" />{ride.assigned_vehicle_name}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}