import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

const SERVICE_TYPES = [
  { value: 'client_transport', label: 'Client Transport', color: 'bg-blue-500/10 text-blue-600' },
  { value: 'workforce_transport', label: 'Workforce Transport', color: 'bg-purple-500/10 text-purple-600' },
  { value: 'medical_delivery', label: 'Medical Delivery', color: 'bg-red-500/10 text-red-600' },
  { value: 'package_delivery', label: 'Package Delivery', color: 'bg-amber-500/10 text-amber-600' },
  { value: 'contract_route', label: 'Contract Route', color: 'bg-green-500/10 text-green-600' }
];

export default function ServiceTypeFilter({ selected, onChange }) {
  const toggleService = (type) => {
    const newSelected = selected.includes(type)
      ? selected.filter(s => s !== type)
      : [...selected, type];
    onChange(newSelected);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Service Type</label>
      <div className="flex flex-wrap gap-2">
        {SERVICE_TYPES.map(({ value, label, color }) => (
          <button
            key={value}
            onClick={() => toggleService(value)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all border ${
              selected.includes(value)
                ? `${color} border-current`
                : 'bg-background border-border hover:bg-muted'
            }`}
          >
            <Checkbox
              checked={selected.includes(value)}
              onChange={() => toggleService(value)}
              className="w-4 h-4"
            />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}