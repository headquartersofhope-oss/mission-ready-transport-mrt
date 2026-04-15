import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info, Zap } from 'lucide-react';

const severityConfig = {
  critical: { color: 'bg-red-500/10 border-red-500/30 text-red-700', badge: 'bg-red-500 text-white', icon: Zap },
  high:     { color: 'bg-orange-500/10 border-orange-500/30 text-orange-700', badge: 'bg-orange-500 text-white', icon: AlertTriangle },
  medium:   { color: 'bg-amber-500/10 border-amber-500/30 text-amber-700', badge: 'bg-amber-400 text-white', icon: AlertCircle },
  low:      { color: 'bg-blue-500/10 border-blue-500/30 text-blue-700', badge: 'bg-blue-400 text-white', icon: Info },
};

const moduleLabels = {
  dispatch: 'Dispatch', scheduling: 'Scheduling', drivers: 'Drivers',
  vehicles: 'Vehicles', clients: 'Clients', incidents: 'Incidents',
  data_quality: 'Data Quality',
};

export default function IssueCard({ issue }) {
  const cfg = severityConfig[issue.severity] || severityConfig.low;
  const Icon = cfg.icon;

  return (
    <div className={`rounded-xl border p-4 space-y-2 ${cfg.color}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1">
          <Icon className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-sm font-semibold leading-snug">{issue.title}</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${cfg.badge}`}>{issue.severity}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 text-foreground/70 font-medium border">
            {moduleLabels[issue.module] || issue.module}
          </span>
        </div>
      </div>
      {issue.detail && <p className="text-xs opacity-80 ml-6">{issue.detail}</p>}
      <div className="ml-6 grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
        <div>
          <p className="text-xs font-semibold opacity-60 uppercase tracking-wide">Cause</p>
          <p className="text-xs">{issue.cause}</p>
        </div>
        <div>
          <p className="text-xs font-semibold opacity-60 uppercase tracking-wide">Fix</p>
          <p className="text-xs">{issue.fix}</p>
        </div>
        <div>
          <p className="text-xs font-semibold opacity-60 uppercase tracking-wide">Owner</p>
          <p className="text-xs font-medium">{issue.owner}</p>
        </div>
      </div>
    </div>
  );
}