import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Plus, Search, DollarSign, Star, TrendingUp, Calendar } from 'lucide-react';
import DonorForm from '@/components/crm/DonorForm';

const STAGE_COLORS = {
  prospect: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  first_time: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  recurring: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  major_donor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  lapsed: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  champion: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

export default function DonorCRM() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data: donors = [], isLoading } = useQuery({
    queryKey: ['donors'],
    queryFn: () => base44.entities.Donor.list('-last_gift_date', 200),
  });

  const filtered = donors.filter(d =>
    !search || d.donor_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.contact_email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: donors.length,
    ytd: donors.reduce((s, d) => s + (d.total_given_ytd || 0), 0),
    lifetime: donors.reduce((s, d) => s + (d.total_given_lifetime || 0), 0),
    major: donors.filter(d => d.stewardship_level === 'major' || d.relationship_stage === 'major_donor').length,
  };

  if (showForm) return (
    <DonorForm
      donor={selected}
      onSave={() => { setShowForm(false); setSelected(null); qc.invalidateQueries(['donors']); }}
      onCancel={() => { setShowForm(false); setSelected(null); }}
    />
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Donor Relations</h1>
          <p className="text-muted-foreground mt-1">Fundraising, donor stewardship & giving history</p>
        </div>
        <Button onClick={() => { setSelected(null); setShowForm(true); }}>
          <Plus className="w-4 h-4" /> Add Donor
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Donors', value: stats.total, icon: Heart, color: 'text-rose-400' },
          { label: 'YTD Giving', value: `$${stats.ytd.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Lifetime Giving', value: `$${stats.lifetime.toLocaleString()}`, icon: DollarSign, color: 'text-blue-400' },
          { label: 'Major Donors', value: stats.major, icon: Star, color: 'text-purple-400' },
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
        <Input placeholder="Search donors..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-muted-foreground text-sm">Loading...</p>}
        {filtered.map(donor => (
          <Card key={donor.id} className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => { setSelected(donor); setShowForm(true); }}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <p className="font-semibold">{donor.donor_name}</p>
                    <p className="text-sm text-muted-foreground">{donor.donor_type?.replace('_', ' ')} · {donor.designation?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {donor.total_given_lifetime > 0 && (
                    <span className="text-sm font-semibold text-emerald-400">${donor.total_given_lifetime?.toLocaleString()} lifetime</span>
                  )}
                  <Badge className={STAGE_COLORS[donor.relationship_stage] || STAGE_COLORS.prospect}>
                    {donor.relationship_stage?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              {(donor.last_gift_amount || donor.next_ask_date) && (
                <div className="flex gap-4 mt-3 pt-3 border-t border-border/40">
                  {donor.last_gift_amount && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <DollarSign className="w-3 h-3" />Last gift: ${donor.last_gift_amount?.toLocaleString()} · {donor.last_gift_date}
                    </span>
                  )}
                  {donor.next_ask_date && (
                    <span className="flex items-center gap-1.5 text-xs text-amber-400">
                      <Calendar className="w-3 h-3" />Next ask: {donor.next_ask_date}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No donors yet. Add your first donor record.</div>
        )}
      </div>
    </div>
  );
}