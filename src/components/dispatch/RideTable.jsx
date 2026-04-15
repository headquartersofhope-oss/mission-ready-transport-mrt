import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, User, MapPin, Truck, AlertTriangle } from 'lucide-react';

const statusColors = {
  requested:       'bg-slate-500/10 text-slate-600 border-slate-500/20',
  pending:         'bg-amber-500/10 text-amber-600 border-amber-500/20',
  under_review:    'bg-amber-500/10 text-amber-600 border-amber-500/20',
  approved:        'bg-blue-500/10 text-blue-600 border-blue-500/20',
  denied:          'bg-red-500/10 text-red-600 border-red-500/20',
  scheduled:       'bg-blue-500/10 text-blue-600 border-blue-500/20',
  driver_assigned: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  assigned:        'bg-purple-500/10 text-purple-600 border-purple-500/20',
  en_route:        'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  rider_picked_up: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  dropped_off:     'bg-teal-500/10 text-teal-600 border-teal-500/20',
  return_pending:  'bg-amber-500/10 text-amber-600 border-amber-500/20',
  in_progress:     'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  completed:       'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled:       'bg-slate-500/10 text-slate-600 border-slate-500/20',
  no_show:         'bg-red-500/10 text-red-600 border-red-500/20',
  incident_review: 'bg-red-700/10 text-red-700 border-red-700/20',
};

const priorityColors = {
  standard: '',
  high: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  urgent: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function RideTable({ rides, onRowClick, compact = false }) {
  if (!rides || rides.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No rides to display
      </div>
    );
  }

  const sorted = [...rides].sort((a, b) => (a.pickup_time || '').localeCompare(b.pickup_time || ''));

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Rider</TableHead>
            <TableHead className="text-xs">Date / Time</TableHead>
            {!compact && <TableHead className="text-xs">Pickup → Destination</TableHead>}
            <TableHead className="text-xs">Purpose</TableHead>
            {!compact && <TableHead className="text-xs">Driver / Vehicle</TableHead>}
            <TableHead className="text-xs">Priority</TableHead>
            <TableHead className="text-xs">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(ride => (
            <TableRow
              key={ride.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onRowClick?.(ride)}
            >
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{ride.participant_name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  <p className="font-medium">{ride.request_date}</p>
                  {ride.pickup_time && (
                    <p className="flex items-center gap-1 text-muted-foreground mt-0.5">
                      <Clock className="w-3 h-3" />{ride.pickup_time}
                    </p>
                  )}
                </div>
              </TableCell>
              {!compact && (
                <TableCell>
                  <div className="text-xs space-y-0.5 max-w-[220px]">
                    <p className="flex items-center gap-1 text-emerald-600">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{ride.pickup_location}</span>
                    </p>
                    <p className="flex items-center gap-1 text-red-500">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{ride.dropoff_location}</span>
                    </p>
                    {ride.return_trip && <p className="text-blue-500 text-xs">↩ Round trip</p>}
                  </div>
                </TableCell>
              )}
              <TableCell>
                <span className="text-xs capitalize text-muted-foreground">
                  {ride.purpose?.replace(/_/g, ' ')}
                </span>
              </TableCell>
              {!compact && (
                <TableCell>
                  <div className="text-xs space-y-0.5">
                    {ride.assigned_driver_name ? (
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <User className="w-3 h-3" />{ride.assigned_driver_name}
                      </p>
                    ) : <p className="text-muted-foreground/50 italic">No driver</p>}
                    {ride.assigned_vehicle_name && (
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <Truck className="w-3 h-3" />{ride.assigned_vehicle_name}
                      </p>
                    )}
                  </div>
                </TableCell>
              )}
              <TableCell>
                {ride.priority !== 'standard' ? (
                  <Badge variant="outline" className={`text-xs ${priorityColors[ride.priority] || ''}`}>
                    {ride.priority === 'urgent' && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {ride.priority}
                  </Badge>
                ) : <span className="text-xs text-muted-foreground">Standard</span>}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs capitalize ${statusColors[ride.status] || ''}`}>
                  {ride.status?.replace(/_/g, ' ')}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}