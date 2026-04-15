import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Phone, Mail, AlertTriangle, Link2, XCircle } from 'lucide-react';
import ParticipantForm from '../components/participants/ParticipantForm';
import DriverAssignmentPanel from '../components/drivers/DriverAssignmentPanel';

const statusColors = {
  active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  inactive: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  suspended: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const reliabilityColors = {
  excellent: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  good: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  fair: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  poor: 'bg-red-500/10 text-red-600 border-red-500/20',
  probation: 'bg-red-700/10 text-red-700 border-red-700/20',
};

export default function Participants() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [assignmentTarget, setAssignmentTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ['participants'],
    queryFn: () => base44.entities.Participant.list('-created_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Participant.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['participants'] }); setView('list'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Participant.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['participants'] }); setView('list'); setSelected(null); },
  });

  const filtered = useMemo(() => {
    return participants.filter(p => {
      const matchSearch = !search || `${p.first_name} ${p.last_name} ${p.participant_id || ''} ${p.case_manager || ''}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [participants, search, statusFilter]);

  const handleSave = async (data) => {
    if (selected) {
      await updateMutation.mutateAsync({ id: selected.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  if (view === 'form') {
    return (
      <div className="space-y-5">
        <ParticipantForm existing={selected} onSave={handleSave} onCancel={() => { setView('list'); setSelected(null); setAssignmentTarget(null); }} />
        {selected && (
          <DriverAssignmentPanel participant={selected} onClose={() => setAssignmentTarget(null)} />
        )}
      </div>
    );
  }

  const activeCount = participants.filter(p => p.status === 'active').length;
  const suspendedCount = participants.filter(p => p.status === 'suspended').length;
  const highNoShow = participants.filter(p => (p.no_show_count || 0) >= 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Directory</h1>
          <p className="text-sm font-medium text-muted-foreground mt-2">
            {activeCount} active · {suspendedCount} suspended · {highNoShow.length} with 3+ no-shows
          </p>
        </div>
        <Button onClick={() => { setSelected(null); setView('form'); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Client
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, ID, or case manager…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
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
                    <TableHead className="text-xs">Client</TableHead>
                    <TableHead className="text-xs">ID</TableHead>
                    <TableHead className="text-xs">Contact</TableHead>
                    <TableHead className="text-xs">Mobility / Notes</TableHead>
                    <TableHead className="text-xs">Case Manager</TableHead>
                    <TableHead className="text-xs">No-Shows</TableHead>
                    <TableHead className="text-xs">Reliability</TableHead>
                    <TableHead className="text-xs">Pref. Driver</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => { setSelected(p); setView('form'); setAssignmentTarget(p); }}
                    >
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{p.first_name} {p.last_name}</p>
                          {p.preferred_name && <p className="text-xs text-muted-foreground">"{p.preferred_name}"</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.participant_id || '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                          {p.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>}
                          {p.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px]">
                        {p.mobility_needs ? <span className="text-amber-600 font-medium">{p.mobility_needs}</span> : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.case_manager || '—'}</TableCell>
                      <TableCell>
                        {(p.no_show_count || 0) >= 3 ? (
                          <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                            <AlertTriangle className="w-3 h-3" />{p.no_show_count}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">{p.no_show_count || 0}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs capitalize ${reliabilityColors[p.reliability_rating] || ''}`}>
                          {p.reliability_rating || 'good'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                       {p.preferred_driver_name ? (
                         <span className="flex items-center gap-1 text-primary font-medium"><Link2 className="w-3 h-3" />{p.preferred_driver_name}</span>
                       ) : '—'}
                      </TableCell>
                      <TableCell>
                       <Badge variant="outline" className={`text-xs ${statusColors[p.status] || ''}`}>{p.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No clients found</TableCell>
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