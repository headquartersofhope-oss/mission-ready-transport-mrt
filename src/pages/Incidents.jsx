import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, AlertTriangle, AlertCircle, Shield } from 'lucide-react';
import IncidentForm from '../components/incidents/IncidentForm';
import IncidentDetail from '../components/incidents/IncidentDetail';

const severityColors = {
  low: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  high: 'bg-red-500/10 text-red-600 border-red-500/20',
  critical: 'bg-red-700/10 text-red-700 border-red-700/20',
};

const statusColors = {
  open: 'bg-red-500/10 text-red-600 border-red-500/20',
  under_review: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  escalated: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  closed: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

export default function Incidents() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-incident_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Incident.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incidents'] }); setView('list'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Incident.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incidents'] }); setView('list'); setSelected(null); },
  });

  const filtered = useMemo(() => {
    return incidents.filter(i => {
      const matchSearch = !search || i.participant_name?.toLowerCase().includes(search.toLowerCase()) || i.driver_name?.toLowerCase().includes(search.toLowerCase()) || i.incident_type?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || i.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [incidents, search, statusFilter]);

  const handleSave = async (data) => {
    if (selected) {
      await updateMutation.mutateAsync({ id: selected.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  if (view === 'form') {
    return <IncidentForm existing={selected} onSave={handleSave} onCancel={() => { setView('list'); setSelected(null); }} />;
  }

  if (view === 'detail' && selected) {
    return <IncidentDetail incident={selected} onEdit={() => setView('form')} onBack={() => { setView('list'); setSelected(null); }} onSave={(data) => updateMutation.mutateAsync({ id: selected.id, data })} />;
  }

  const open = incidents.filter(i => i.status === 'open');
  const escalated = incidents.filter(i => i.status === 'escalated');
  const critical = incidents.filter(i => i.severity === 'critical' || i.severity === 'high');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Incident Log</h1>
          <p className="text-sm text-muted-foreground mt-1">{open.length} open · {escalated.length} escalated · {critical.length} high/critical</p>
        </div>
        <Button onClick={() => { setSelected(null); setView('form'); }} className="gap-2">
          <Plus className="w-4 h-4" /> Log Incident
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-xl font-bold">{open.length}</p>
              <p className="text-xs text-muted-foreground">Open Incidents</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-xl font-bold">{escalated.length}</p>
              <p className="text-xs text-muted-foreground">Escalated</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-xl font-bold">{critical.length}</p>
              <p className="text-xs text-muted-foreground">High / Critical</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by rider, driver, or type…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="under_review">Under Review</TabsTrigger>
            <TabsTrigger value="escalated">Escalated</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>
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
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Rider</TableHead>
                    <TableHead className="text-xs">Driver</TableHead>
                    <TableHead className="text-xs">Reported By</TableHead>
                    <TableHead className="text-xs">Severity</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(i => (
                    <TableRow key={i.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelected(i); setView('detail'); }}>
                      <TableCell className="text-sm">{i.incident_date}</TableCell>
                      <TableCell className="text-sm capitalize">{i.incident_type?.replace(/_/g, ' ')}</TableCell>
                      <TableCell className="text-sm">{i.participant_name || '—'}</TableCell>
                      <TableCell className="text-sm">{i.driver_name || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{i.reported_by || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs capitalize ${severityColors[i.severity] || ''}`}>{i.severity}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs capitalize ${statusColors[i.status] || ''}`}>
                          {i.status?.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No incidents found</TableCell>
                    </TableRow>
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