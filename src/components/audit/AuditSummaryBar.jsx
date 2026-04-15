import { CheckCircle2, AlertTriangle, Zap, Info } from 'lucide-react';

export default function AuditSummaryBar({ issues, runAt }) {
  const critical = issues.filter(i => i.severity === 'critical').length;
  const high = issues.filter(i => i.severity === 'high').length;
  const medium = issues.filter(i => i.severity === 'medium').length;
  const low = issues.filter(i => i.severity === 'low').length;
  const total = issues.length;

  if (total === 0) {
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-500/8 border border-emerald-500/20 rounded-xl">
        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        <div>
          <p className="text-sm font-semibold text-emerald-700">No issues detected — system looks healthy</p>
          {runAt && <p className="text-xs text-emerald-600/70">Last checked: {new Date(runAt).toLocaleString()}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card border rounded-xl">
      <div className="flex-1">
        <p className="text-sm font-semibold">{total} issue{total !== 1 ? 's' : ''} detected</p>
        {runAt && <p className="text-xs text-muted-foreground">Last run: {new Date(runAt).toLocaleString()}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {critical > 0 && (
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-500 text-white">
            <Zap className="w-3 h-3" /> {critical} Critical
          </span>
        )}
        {high > 0 && (
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-orange-500 text-white">
            <AlertTriangle className="w-3 h-3" /> {high} High
          </span>
        )}
        {medium > 0 && (
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400 text-white">
            <AlertTriangle className="w-3 h-3" /> {medium} Medium
          </span>
        )}
        {low > 0 && (
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-400 text-white">
            <Info className="w-3 h-3" /> {low} Low
          </span>
        )}
      </div>
    </div>
  );
}