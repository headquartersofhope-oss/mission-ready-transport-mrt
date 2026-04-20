import { useState, useMemo } from 'react';
import PremiumPageHeader from '../components/premium/PremiumPageHeader';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search } from 'lucide-react';
import RecurringPlanForm from '../components/recurring/RecurringPlanForm';

const approvalColors = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  approved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  denied: 'bg-red-500/10 text-red-600 border-red-500/20',
  expired: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  under_review: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

const statusColors = {
  active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  paused: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  completed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  cancelled: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

export default function RecurringPlans() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['recurring-plans'],
    queryFn: () => base44.entities.RecurringTransportPlan.list('-created_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RecurringTransportPlan.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['recurring-plans'] }); setView('list'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RecurringTransportPlan.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['recurring-plans'] }); setView('list'); setSelected(null); },
  });

  const filtered = useMemo(() => {
    if (!search) return plans;
    const q = search.toLowerCase();
    return plans.filter(p => p.participant_name?.toLowerCase().includes(q) || p.purpose?.toLowerCase().includes(q));
  }, [plans, search]);

  const handleSave = async (data) => {
    if (selected) {
      await updateMutation.mutateAsync({ id: selected.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  if (view === 'form') {
    return <RecurringPlanForm existing={selected} onSave={handleSave} onCancel={() => { setView('list'); setSelected(null); }} />;
  }

  return (
    <div className="space-y-5">
      <PremiumPageHeader 
        title="Recurring Transport Plans" 
        subtitle={`${plans.length} plans configured`}
      >
        <Button onClick={() => { setSelected(null); setView('form'); }} className="bg-primary">
          <Plus className="w-4 h-4 mr-2" /> New Plan
        </Button>
      </PremiumPageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search plans…" className="pl-9 bg-input border-border" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Participant</TableHead>
                    <TableHead className="text-xs">Purpose</TableHead>
                    <TableHead className="text-xs">Days</TableHead>
                    <TableHead className="text-xs">Time</TableHead>
                    <TableHead className="text-xs">Provider</TableHead>
                    <TableHead className="text-xs">Review</TableHead>
                    <TableHead className="text-xs">Approval</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelected(p); setView('form'); }}>
                      <TableCell className="font-medium text-sm">{p.participant_name}</TableCell>
                      <TableCell className="text-sm capitalize">{p.purpose?.replace(/_/g, ' ')}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {p.weekday_pattern?.map(d => (
                            <span key={d} className="text-xs px-1.5 py-0.5 rounded bg-muted font-medium capitalize">{d.slice(0, 3)}</span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.pickup_time || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.assigned_provider_name || '—'}</TableCell>
                      <TableCell className="text-xs capitalize">{p.review_cycle}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${approvalColors[p.approval_status] || ''}`}>{p.approval_status?.replace(/_/g, ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${statusColors[p.status] || ''}`}>{p.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No recurring plans found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}