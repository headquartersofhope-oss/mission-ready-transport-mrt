import React from 'react';
import { Circle } from 'lucide-react';

const availabilityMap = {
  available: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Available' },
  on_duty: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'On Duty' },
  off_duty: { color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'Off Duty' },
  on_leave: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'On Leave' },
  on_call: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'On Call' },
};

export default function DriverAvailabilityBadge({ availability }) {
  const config = availabilityMap[availability] || availabilityMap.available;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      <Circle className="w-2 h-2 fill-current" />
      {config.label}
    </div>
  );
}