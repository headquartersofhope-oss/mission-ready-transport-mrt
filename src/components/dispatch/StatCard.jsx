import { Card } from '@/components/ui/card';

export default function StatCard({ label, value, icon: Icon, color = 'blue', subtext }) {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-600',
    amber: 'bg-amber-500/10 text-amber-600',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    red: 'bg-red-500/10 text-red-600',
    purple: 'bg-purple-500/10 text-purple-600',
    slate: 'bg-slate-500/10 text-slate-600',
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${colorMap[color] || colorMap.blue}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
    </Card>
  );
}