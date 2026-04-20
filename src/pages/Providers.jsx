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
import ProviderForm from '../components/providers/ProviderForm';

const typeLabels = {
  bus_pass_vendor: 'Bus Pass',
  volunteer_driver: 'Volunteer',
  rideshare_voucher: 'Rideshare',
  staff_driver: 'Staff Driver',
  partner_org: 'Partner Org',
  reimbursement: 'Reimbursement',
};

const statusColors = {
  active: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  inactive: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
  pending_approval: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
};

export default function Providers() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: () => base44.entities.TransportProvider.list('name', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TransportProvider.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['providers'] }); setView('list'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TransportProvider.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['providers'] }); setView('list'); setSelected(null); },
  });

  const filtered = useMemo(() => {
    if (!search) return providers;
    const q = search.toLowerCase();
    return providers.filter(p => p.name?.toLowerCase().includes(q) || p.service_area?.toLowerCase().includes(q));
  }, [providers, search]);

  const handleSave = async (data) => {
    if (selected) {
      await updateMutation.mutateAsync({ id: selected.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  if (view === 'form') {
    return <ProviderForm existing={selected} onSave={handleSave} onCancel={() => { setView('list'); setSelected(null); }} />;
  }

  return (
    <div className="space-y-6">
      <PremiumPageHeader 
        title="Transport Providers" 
        subtitle={`${providers.length} providers registered`}
      >
        <Button onClick={() => { setSelected(null); setView('form'); }} className="bg-primary">
          <Plus className="w-4 h-4 mr-2" /> Add Provider
        </Button>
      </PremiumPageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search providers…" className="pl-9 bg-input border-border" value={search} onChange={e => setSearch(e.target.value)} />
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
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Contact</TableHead>
                    <TableHead className="text-xs">Service Area</TableHead>
                    <TableHead className="text-xs">Cost Method</TableHead>
                    <TableHead className="text-xs">Base Cost</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelected(p); setView('form'); }}>
                      <TableCell className="font-medium text-sm">{p.name}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{typeLabels[p.provider_type] || p.provider_type}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.contact_name || p.contact_email || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.service_area || '—'}</TableCell>
                      <TableCell className="text-xs capitalize">{p.cost_method?.replace(/_/g, ' ') || '—'}</TableCell>
                      <TableCell className="text-sm">{p.base_cost ? `$${p.base_cost}` : '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${statusColors[p.status] || ''}`}>{p.status?.replace(/_/g, ' ')}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No providers found</TableCell></TableRow>
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