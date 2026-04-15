import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Info, Zap, TrendingUp } from 'lucide-react';

const sev = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-amber-400 text-white',
  low: 'bg-blue-400 text-white',
  urgent: 'bg-red-500 text-white',
  recommended: 'bg-amber-400 text-white',
  optional: 'bg-slate-400 text-white',
};

export function ResultSection({ title, items = [], renderItem, color = 'text-foreground', emptyText }) {
  if (!items || items.length === 0) {
    if (emptyText) return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className={`text-sm ${color}`}>{title}</CardTitle></CardHeader>
        <CardContent><p className="text-xs text-muted-foreground">{emptyText}</p></CardContent>
      </Card>
    );
    return null;
  }
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm flex items-center gap-2 ${color}`}>
          {title}
          <span className="text-xs font-normal text-muted-foreground">({items.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, i) => renderItem(item, i))}
      </CardContent>
    </Card>
  );
}

export function BulletList({ items = [], color }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-xs">
          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${color || 'bg-primary'}`} />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function SeverityBadge({ level }) {
  return <span className={`text-xs px-2 py-0.5 rounded-full font-bold capitalize ${sev[level] || 'bg-slate-300 text-foreground'}`}>{level}</span>;
}

export function SummaryBox({ text, color = 'blue' }) {
  if (!text) return null;
  const styles = {
    blue: 'bg-blue-500/8 border-blue-500/20 text-blue-800',
    green: 'bg-emerald-500/8 border-emerald-500/20 text-emerald-800',
    amber: 'bg-amber-500/8 border-amber-500/20 text-amber-800',
  };
  return (
    <div className={`p-4 rounded-xl border text-sm leading-relaxed ${styles[color] || styles.blue}`}>
      <Info className="w-4 h-4 inline mr-2 opacity-60" />
      {text}
    </div>
  );
}

export function ScoreBadge({ score, label }) {
  const color = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-500' : 'text-red-500';
  const bg = score >= 80 ? 'bg-emerald-500/10' : score >= 60 ? 'bg-amber-500/10' : 'bg-red-500/10';
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${bg}`}>
      <TrendingUp className={`w-3.5 h-3.5 ${color}`} />
      <span className={`text-sm font-bold ${color}`}>{score}/100</span>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}