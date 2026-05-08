import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Plus, Search, DollarSign, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import ContractForm from '@/components/crm/ContractForm';
import { differenceInDays, parseISO } from 'date-fns';

const STATUS_COLORS = {
  draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  pending_signature: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  expired: 'bg-red-500/10 text-red-400 border-red-500/20',
  terminated: 'bg-red-500/10 text-red-400 border-red-500/20',
  renewed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export default function ContractManagement() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.Contract.list('-created_date', 200),
  });

  const filtered = contracts.filter(c =>
    !search || c.contract_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  const today = new Date();
  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    expiring_soon: contracts.filter(c => {
      if (c.status !== 'active' || !c.end_date) return false;
      return differenceInDays(parseISO(c.end_date), today) <= 30;
    }).length,
    total_value: contracts.filter(c => c.status === 'active').reduce((s, c) => s + (c.monthly_value || 0), 0),
  };

  if (showForm) return (
    <ContractForm
      contract={selected}
      onSave={() => { setShowForm(false); setSelected(null); qc.invalidateQueries(['contracts']); }}
      onCancel={() => { setShowForm(false); setSelected(null); }}
    />
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contract Management</h1>
          <p className="text-muted-foreground mt-1">Client contracts, renewals & billing terms</p>
        </div>
        <Button onClick={() => { setSelected(null); setShowForm(true); }}>
          <Plus className="w-4 h-4" /> New Contract
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Contracts', value: stats.total, icon: FileText, color: 'text-blue-400' },
          { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Expiring Soon', value: stats.expiring_soon, icon: AlertTriangle, color: 'text-amber-400' },
          { label: 'Monthly Revenue', value: `$${stats.total_value.toLocaleString()}`, icon: DollarSign, color: 'text-purple-400' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search contracts..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-muted-foreground text-sm">Loading...</p>}
        {filtered.map(c => {
          const daysLeft = c.end_date ? differenceInDays(parseISO(c.end_date), today) : null;
          const expiringSoon = daysLeft !== null && daysLeft <= 30 && c.status === 'active';
          return (
            <Card key={c.id} className={`hover:border-primary/40 transition-colors cursor-pointer ${expiringSoon ? 'border-amber-500/40' : ''}`} onClick={() => { setSelected(c); setShowForm(true); }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{c.contract_name}</p>
                      <p className="text-sm text-muted-foreground">{c.client_name} · {c.contract_type?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.monthly_value > 0 && <span className="text-sm font-semibold text-emerald-400">${c.monthly_value?.toLocaleString()}/mo</span>}
                    {expiringSoon && <span className="text-xs text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{daysLeft}d left</span>}
                    <Badge className={STATUS_COLORS[c.status] || STATUS_COLORS.draft}>{c.status?.replace('_', ' ')}</Badge>
                  </div>
                </div>
                {(c.start_date || c.end_date) && (
                  <div className="flex gap-4 mt-3 pt-3 border-t border-border/40">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />{c.start_date} → {c.end_date || 'ongoing'}
                    </span>
                    {c.auto_renew && <span className="text-xs text-blue-400">Auto-renews</span>}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No contracts yet. Create your first contract.</div>
        )}
      </div>
    </div>
  );
}