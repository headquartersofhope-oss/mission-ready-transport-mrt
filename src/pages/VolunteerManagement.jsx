import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HandHeart, Plus, Search, Car, Clock, Shield, AlertTriangle } from 'lucide-react';
import VolunteerForm from '@/components/crm/VolunteerForm';

const STATUS_COLORS = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  pending_clearance: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  suspended: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const BG_STATUS_COLORS = {
  clear: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  flagged: 'bg-red-500/10 text-red-400 border-red-500/20',
  not_required: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function VolunteerManagement() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data: volunteers = [], isLoading } = useQuery({
    queryKey: ['volunteers'],
    queryFn: () => base44.entities.Volunteer.list('-created_date', 200),
  });

  const filtered = volunteers.filter(v =>
    !search ||
    `${v.first_name} ${v.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    v.church_affiliation?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: volunteers.length,
    active: volunteers.filter(v => v.status === 'active').length,
    pending: volunteers.filter(v => v.status === 'pending_clearance').length,
    total_hours: volunteers.reduce((s, v) => s + (v.total_hours_volunteered || 0), 0),
  };

  if (showForm) return (
    <VolunteerForm
      volunteer={selected}
      onSave={() => { setShowForm(false); setSelected(null); qc.invalidateQueries(['volunteers']); }}
      onCancel={() => { setShowForm(false); setSelected(null); }}
    />
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Volunteer Management</h1>
          <p className="text-muted-foreground mt-1">Volunteer drivers, backgrounds & scheduling</p>
        </div>
        <Button onClick={() => { setSelected(null); setShowForm(true); }}>
          <Plus className="w-4 h-4" /> Add Volunteer
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Volunteers', value: stats.total, icon: HandHeart, color: 'text-rose-400' },
          { label: 'Active', value: stats.active, icon: Shield, color: 'text-emerald-400' },
          { label: 'Pending Clearance', value: stats.pending, icon: AlertTriangle, color: 'text-amber-400' },
          { label: 'Total Hours', value: stats.total_hours, icon: Clock, color: 'text-blue-400' },
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
        <Input placeholder="Search volunteers..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-muted-foreground text-sm">Loading...</p>}
        {filtered.map(v => (
          <Card key={v.id} className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => { setSelected(v); setShowForm(true); }}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                    <HandHeart className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <p className="font-semibold">{v.first_name} {v.last_name}</p>
                    <p className="text-sm text-muted-foreground">{v.volunteer_type?.replace('_', ' ')} {v.church_affiliation ? `· ${v.church_affiliation}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={BG_STATUS_COLORS[v.background_check_status] || BG_STATUS_COLORS.pending}>
                    BG: {v.background_check_status?.replace('_', ' ')}
                  </Badge>
                  <Badge className={STATUS_COLORS[v.status] || STATUS_COLORS.pending_clearance}>{v.status?.replace('_', ' ')}</Badge>
                </div>
              </div>
              <div className="flex gap-4 mt-3 pt-3 border-t border-border/40">
                {v.vehicle_make && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Car className="w-3 h-3" />{v.vehicle_year} {v.vehicle_make} {v.vehicle_model}</span>}
                {v.total_hours_volunteered > 0 && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{v.total_hours_volunteered} hrs · {v.total_trips_completed} trips</span>}
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No volunteers yet. Add your first volunteer.</div>
        )}
      </div>
    </div>
  );
}