export default function ScoreGauge({ label, score, size = 'md' }) {
  const color = score >= 85 ? 'text-emerald-600' : score >= 65 ? 'text-amber-500' : 'text-red-500';
  const ring = score >= 85 ? 'stroke-emerald-500' : score >= 65 ? 'stroke-amber-400' : 'stroke-red-500';
  const bg = score >= 85 ? 'bg-emerald-500/8' : score >= 65 ? 'bg-amber-500/8' : 'bg-red-500/8';

  const r = size === 'lg' ? 36 : 28;
  const cx = size === 'lg' ? 44 : 36;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`flex flex-col items-center gap-1 p-3 rounded-xl ${bg}`}>
      <svg width={cx * 2} height={cx * 2} className="-rotate-90">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
        <circle
          cx={cx} cy={cx} r={r} fill="none" strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${ring} transition-all duration-700`}
        />
      </svg>
      <span className={`text-xl font-bold -mt-1 ${color}`}>{score}</span>
      <span className="text-xs font-medium text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}