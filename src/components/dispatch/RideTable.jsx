import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

const statusStyles = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  approved: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  assigned: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  in_progress: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  no_show: 'bg-red-500/10 text-red-600 border-red-500/20',
  denied: 'bg-red-500/10 text-red-600 border-red-500/20',
  cancelled: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

const priorityStyles = {
  standard: 'bg-slate-500/10 text-slate-600',
  high: 'bg-amber-500/10 text-amber-600',
  urgent: 'bg-red-500/10 text-red-600',
};

export default function RideTable({ rides, onRowClick, compact = false }) {
  if (!rides?.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No rides to display</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Participant</TableHead>
            <TableHead className="text-xs">Time</TableHead>
            {!compact && <TableHead className="text-xs">Pickup</TableHead>}
            <TableHead className="text-xs">Dropoff</TableHead>
            <TableHead className="text-xs">Purpose</TableHead>
            <TableHead className="text-xs">Provider</TableHead>
            <TableHead className="text-xs">Priority</TableHead>
            <TableHead className="text-xs">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rides.map(ride => (
            <TableRow 
              key={ride.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onRowClick?.(ride)}
            >
              <TableCell className="font-medium text-sm">{ride.participant_name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{ride.pickup_time || '—'}</TableCell>
              {!compact && <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{ride.pickup_location}</TableCell>}
              <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{ride.dropoff_location}</TableCell>
              <TableCell>
                <span className="text-xs capitalize">{ride.purpose?.replace(/_/g, ' ')}</span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{ride.assigned_provider_name || '—'}</TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs ${priorityStyles[ride.priority] || ''}`}>
                  {ride.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs ${statusStyles[ride.status] || ''}`}>
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