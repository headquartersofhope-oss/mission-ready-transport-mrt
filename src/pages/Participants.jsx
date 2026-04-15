import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Phone, Mail, MapPin } from 'lucide-react';
import ParticipantForm from '../components/participants/ParticipantForm';

const statusColors = {
  active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  inactive: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  suspended: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function Participants() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

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
    if (!search) return participants;
    const q = search.toLowerCase();
    return participants.filter(p =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
      p.participant_id?.toLowerCase().includes(q) ||
      p.case_manager?.toLowerCase().includes(q)
    );
  }, [participants, search]);

  const handleSave = async (data) => {
    if (selected) {
      await updateMutation.mutateAsync({ id: selected.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  if (view === 'form') {
    return (
      <ParticipantForm
        existing={selected}
        onSave={handleSave}
        onCancel={() => { setView('list'); setSelected(null); }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Participant Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">{participants.length} participants registered</p>
        </div>
        <Button onClick={() => { setSelected(null); setView('form'); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Participant
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name, ID, or case manager…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
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
                    <TableHead className="text-xs">ID</TableHead>
                    <TableHead className="text-xs">Contact</TableHead>
                    <TableHead className="text-xs">Case Manager</TableHead>
                    <TableHead className="text-xs">Linked House</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelected(p); setView('form'); }}>
                      <TableCell className="font-medium text-sm">{p.first_name} {p.last_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.participant_id || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {p.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>}
                          {p.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.case_manager || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.linked_house || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${statusColors[p.status] || ''}`}>{p.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No participants found</TableCell>
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