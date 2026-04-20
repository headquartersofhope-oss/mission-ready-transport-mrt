import React from 'react';
import { MapPin, Clock, User, Car } from 'lucide-react';

const statusColors = {
  requested: 'border-l-muted',
  pending: 'border-l-amber-400',
  approved: 'border-l-sky-400',
  scheduled: 'border-l-blue-400',
  driver_assigned: 'border-l-purple-400',
  en_route: 'border-l-sky-500',
  rider_picked_up: 'border-l-blue-500',
  dropped_off: 'border-l-emerald-400',
  completed: 'border-l-slate-400',
  cancelled: 'border-l-red-500',
};

export default function RideCard({ ride, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`board-card status-left-border group cursor-pointer transition-all ${statusColors[ride.status] || 'border-l-muted'}`}
      style={{ borderLeftWidth: '4px' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-primary">{ride.participant_name || 'Unknown'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{ride.request_date}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          ride.status === 'completed' ? 'bg-slate-500/20 text-slate-300' :
          ride.status === 'cancelled' ? 'bg-red-500/20 text-red-300' :
          ride.priority === 'high' ? 'bg-red-500/20 text-red-300' :
          'bg-blue-500/20 text-blue-300'
        }`}>
          {ride.status?.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 text-primary/60" />
          <span>{ride.pickup_location}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 text-emerald-400/60" />
          <span>{ride.dropoff_location}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-3.5 h-3.5 text-amber-400/60" />
          <span>{ride.pickup_time}</span>
        </div>
        {ride.assigned_driver_name && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-3.5 h-3.5 text-purple-400/60" />
            <span>{ride.assigned_driver_name}</span>
          </div>
        )}
      </div>
    </div>
  );
}