import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Phone, Mail, Truck, Star } from 'lucide-react';
import DriverForm from '../components/drivers/DriverForm';
import DriverDetail from '../components/drivers/DriverDetail';

const statusColors = {
  active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  inactive: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  suspended: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const availColors = {
  available: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  on_duty: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  off_duty: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  on_leave: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  unavailable: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function Drivers() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Driver.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['drivers'] }); setView('list'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Driver.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['drivers'] }); setView('list'); setSelected(null); },
  });

  const filtered = useMemo(() => {
    return drivers.filter(d => {
      const matchSearch = !search || `${d.first_name} ${d.last_name}`.toLowerCase().includes(search.toLowerCase()) || d.driver_id?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || d.status === statusFilter || d.availability === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [drivers, search, statusFilter]);

  const handleSave = async (data) => {
    if (selected) {
      await updateMutation.mutateAsync({ id: selected.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  if (view === 'form') {
    return <DriverForm existing={selected} onSave={handleSave} onCancel={() => { setView('list'); setSelected(null); }} />;
  }

  if (view === 'detail' && selected) {
    return <DriverDetail driver={selected} onEdit={() => setView('form')} onBack={() => { setView('list'); setSelected(null); }} />;
  }

  const activeDrivers = drivers.filter(d => d.status === 'active');
  const onDuty = drivers.filter(d => d.availability === 'on_duty');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Driver Management</h1>
          <p className="text-sm font-medium text-muted-foreground mt-2">{activeDrivers.length} active drivers · {onDuty.length} on duty today</p>
        </div>
        <Button onClick={() => { setSelected(null); setView('form'); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Driver
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or ID…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All ({drivers.length})</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="on_duty">On Duty</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
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
                    <TableHead className="text-xs">Driver</TableHead>
                    <TableHead className="text-xs">ID</TableHead>
                    <TableHead className="text-xs">Contact</TableHead>
                    <TableHead className="text-xs">Availability</TableHead>
                    <TableHead className="text-xs">Assigned Vehicle</TableHead>
                    <TableHead className="text-xs">Rides</TableHead>
                    <TableHead className="text-xs">On-Time</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(d => (
                    <TableRow
                      key={d.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => { setSelected(d); setView('detail'); }}
                    >
                      <TableCell className="font-medium text-sm">{d.first_name} {d.last_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.driver_id || '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                          {d.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{d.phone}</span>}
                          {d.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{d.email}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs capitalize ${availColors[d.availability] || ''}`}>
                          {d.availability?.replace(/_/g, ' ') || 'unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {d.assigned_vehicle_name ? (
                          <span className="flex items-center gap-1 text-xs"><Truck className="w-3 h-3" />{d.assigned_vehicle_name}</span>
                        ) : <span className="text-xs text-muted-foreground">Unassigned</span>}
                      </TableCell>
                      <TableCell className="text-sm text-center">{d.total_rides_completed || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="w-3 h-3 text-amber-500" />
                          {d.on_time_rate || 100}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${statusColors[d.status] || ''}`}>{d.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No drivers found</TableCell>
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