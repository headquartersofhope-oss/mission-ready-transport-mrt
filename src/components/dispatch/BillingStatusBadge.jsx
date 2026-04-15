import React from 'react';
import { Badge } from '@/components/ui/badge';

const BILLING_STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-700',
  pending_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  invoiced: 'bg-purple-100 text-purple-700',
  paid: 'bg-green-100 text-green-700',
  writeoff: 'bg-red-100 text-red-700',
  not_billable: 'bg-gray-100 text-gray-600'
};

const BILLING_STATUS_ICONS = {
  draft: '📝',
  pending_review: '⏳',
  approved: '✓',
  invoiced: '📄',
  paid: '✅',
  writeoff: '❌',
  not_billable: '⊘'
};

export default function BillingStatusBadge({ status, value, showValue = true }) {
  if (!status) return null;

  const colorClass = BILLING_STATUS_COLORS[status] || 'bg-slate-100';
  const icon = BILLING_STATUS_ICONS[status] || '';

  return (
    <Badge className={colorClass}>
      <span className="mr-1">{icon}</span>
      {status.replace(/_/g, ' ')}
      {showValue && value && <span className="ml-1 font-bold">${value.toFixed(0)}</span>}
    </Badge>
  );
}