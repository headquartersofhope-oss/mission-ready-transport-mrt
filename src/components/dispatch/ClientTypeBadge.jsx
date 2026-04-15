import React from 'react';
import { Badge } from '@/components/ui/badge';

const CLIENT_TYPE_COLORS = {
  nonprofit_hoh: 'bg-blue-100 text-blue-700 border-blue-300',
  external_contract: 'bg-green-100 text-green-700 border-green-300',
  external_delivery: 'bg-amber-100 text-amber-700 border-amber-300',
  external_medical: 'bg-red-100 text-red-700 border-red-300',
  internal_operations: 'bg-slate-100 text-slate-700 border-slate-300'
};

const CLIENT_TYPE_LABELS = {
  nonprofit_hoh: '🏢 HOH (Nonprofit)',
  external_contract: '💼 External Contract',
  external_delivery: '📦 Delivery',
  external_medical: '🏥 Medical',
  internal_operations: '⚙️ Internal'
};

export default function ClientTypeBadge({ clientType, showLabel = true }) {
  if (!clientType) return null;

  const colorClass = CLIENT_TYPE_COLORS[clientType] || CLIENT_TYPE_COLORS.nonprofit_hoh;
  const label = CLIENT_TYPE_LABELS[clientType] || clientType;

  return (
    <Badge className={`${colorClass} border`}>
      {showLabel ? label : clientType}
    </Badge>
  );
}