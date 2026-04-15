import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

const CLIENT_TYPES = [
  { value: 'nonprofit_hoh', label: '🏢 HOH (Nonprofit)', color: 'bg-blue-100 text-blue-700' },
  { value: 'external_contract', label: '💼 External Contract', color: 'bg-green-100 text-green-700' },
  { value: 'external_delivery', label: '📦 Delivery', color: 'bg-amber-100 text-amber-700' },
  { value: 'external_medical', label: '🏥 Medical', color: 'bg-red-100 text-red-700' },
  { value: 'internal_operations', label: '⚙️ Internal', color: 'bg-slate-100 text-slate-700' }
];

export default function ClientJobFilter({ selected, onChange }) {
  const toggleClientType = (type) => {
    const newSelected = selected.includes(type)
      ? selected.filter(s => s !== type)
      : [...selected, type];
    onChange(newSelected);
  };

  const nonprofitCount = selected.filter(t => t === 'nonprofit_hoh').length > 0 ? 1 : 0;
  const revenueCount = selected.filter(t => ['external_contract', 'external_delivery', 'external_medical'].includes(t)).length;

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Client Type Filter</span>
          <div className="flex gap-1 text-xs font-normal">
            {nonprofitCount > 0 && <Badge variant="secondary">Nonprofit</Badge>}
            {revenueCount > 0 && <Badge variant="secondary">Revenue</Badge>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs text-muted-foreground mb-3 pb-2 border-b">
          <p className="font-semibold">Separate view by client type and billing entity</p>
        </div>
        <div className="space-y-2">
          {CLIENT_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => toggleClientType(value)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border ${
                selected.includes(value)
                  ? 'bg-primary/10 border-primary'
                  : 'bg-background border-border hover:bg-muted'
              }`}
            >
              <Checkbox
                checked={selected.includes(value)}
                onChange={() => toggleClientType(value)}
                className="w-4 h-4"
              />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}