import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ label, value, color = 'primary', trend, icon: Icon, onClick }) {
  const colorMap = {
    primary: 'from-primary',
    success: 'from-emerald-500',
    warning: 'from-amber-500',
    destructive: 'from-red-500',
    info: 'from-sky-500',
  };

  return (
    <div
      onClick={onClick}
      className={`stat-card status-left-border glow-on-hover cursor-pointer group`}
      style={{
        borderLeftColor: color === 'primary' ? '#3B82F6' : color === 'success' ? '#34D399' : color === 'warning' ? '#FBBF24' : color === 'destructive' ? '#F87171' : '#60A5FA',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}
        {trend && (
          <div className="flex items-center gap-1">
            {trend > 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
      <div className="stat-number">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}