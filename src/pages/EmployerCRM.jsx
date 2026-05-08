import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Plus, Search, Phone, Mail, DollarSign, Users, ChevronRight, Edit, TrendingUp } from 'lucide-react';
import EmployerForm from '@/components/crm/EmployerForm';

const STATUS_COLORS = {
  prospect: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  paused: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  churned: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function EmployerCRM() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data: employers = [], isLoading } = useQuery({
    queryKey: ['employers'],
    queryFn: () => base44.entities.Employer.list('-created_date', 200),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Employer.delete(id),
    onSuccess: () => qc.invalidateQueries(['employers']),
  });

  const filtered = employers.filter(e =>
    !search || e.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.contact_name?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: employers.length,
    active: employers.filter(e => e.status === 'active').length,
    prospects: employers.filter(e => e.status === 'prospect').length,
    monthly_revenue: employers.filter(e => e.status === 'active').reduce((s, e) => s + (e.contract_value_monthly || 0), 0),
  };

  if (showForm) return (
    <EmployerForm
      employer={selected}
      onSave={() => { setShowForm(false); setSelected(null); qc.invalidateQueries(['employers']); }}
      onCancel={() => { setShowForm(false); setSelected(null); }}
    />
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employer Partners</h1>
          <p className="text-muted-foreground mt-1">Workforce transport contracts & employer relationships</p>
        </div>
        <Button onClick={() => { setSelected(null); setShowForm(true); }}>
          <Plus className="w-4 h-4" /> Add Employer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Partners', value: stats.total, icon: Building2, color: 'text-blue-400' },
          { label: 'Active Contracts', value: stats.active, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Prospects', value: stats.prospects, icon: Users, color: 'text-amber-400' },
          { label: 'Monthly Revenue', value: `$${stats.monthly_revenue.toLocaleString()}`, icon: DollarSign, color: 'text-purple-400' },
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search employers..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading && <p className="text-muted-foreground text-sm">Loading...</p>}
        {filtered.map(emp => (
          <Card key={emp.id} className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => { setSelected(emp); setShowForm(true); }}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold">{emp.company_name}</p>
                    <p className="text-sm text-muted-foreground">{emp.industry?.replace('_', ' ')} {emp.contact_name ? `· ${emp.contact_name}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {emp.contract_value_monthly > 0 && (
                    <span className="text-sm font-semibold text-emerald-400">${emp.contract_value_monthly?.toLocaleString()}/mo</span>
                  )}
                  <Badge className={STATUS_COLORS[emp.status] || STATUS_COLORS.prospect}>{emp.status}</Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              {(emp.contact_phone || emp.contact_email) && (
                <div className="flex gap-4 mt-3 pt-3 border-t border-border/40">
                  {emp.contact_phone && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{emp.contact_phone}</span>}
                  {emp.contact_email && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{emp.contact_email}</span>}
                  {emp.mrt_enrolled_employees > 0 && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="w-3 h-3" />{emp.mrt_enrolled_employees} enrolled</span>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No employers found. Add your first employer partner.</div>
        )}
      </div>
    </div>
  );
}