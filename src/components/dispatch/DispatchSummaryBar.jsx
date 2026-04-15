import { AlertCircle } from 'lucide-react';

const StatCard = ({ label, value, color, icon: Icon, subtle }) => (
  <div className={`rounded-lg border ${subtle ? 'border-border/40 bg-muted/20' : 'border-border/60 bg-card'} p-3 text-center transition-all hover:shadow-sm`}>
    {Icon && <Icon className={`w-4 h-4 mx-auto mb-1.5 ${color}`} />}
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-muted-foreground mt-1.5 font-medium">{label}</p>
  </div>
);

export default function DispatchSummaryBar({ summary, conflictNames }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
        <StatCard label="Total" value={summary.total} color="text-foreground" />
        <StatCard label="Unassigned" value={summary.unassigned} color={summary.unassigned > 0 ? 'text-red-500' : 'text-emerald-500'} subtle={summary.unassigned === 0} />
        <StatCard label="Live" value={summary.active} color="text-amber-500" />
        <StatCard label="Complete" value={summary.completed} color="text-emerald-500" subtle />
        <StatCard label="Urgent" value={summary.urgent} color={summary.urgent > 0 ? 'text-red-600' : 'text-muted-foreground'} />
        <StatCard label="Return" value={summary.returnTrips} color="text-blue-500" subtle />
        <StatCard label="Conflicts" value={summary.conflicts} color={summary.conflicts > 0 ? 'text-red-600' : 'text-muted-foreground'} />
      </div>

      {conflictNames.length > 0 && (
        <div className="flex items-start gap-2.5 p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-200/40 dark:border-red-900/40 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-red-600 dark:text-red-400">Double-booking detected</p>
            <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">{conflictNames.join(', ')}</p>
          </div>
        </div>
      )}
    </div>
  );
}