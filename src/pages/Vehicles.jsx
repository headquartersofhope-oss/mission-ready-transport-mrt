import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Truck, AlertTriangle, Wrench, CheckCircle2, Users } from 'lucide-react';
import VehicleForm from '../components/vehicles/VehicleForm';
import VehicleDetail from '../components/vehicles/VehicleDetail';

const serviceColors = {
  available: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  in_use: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  maintenance: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  out_of_service: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function Vehicles() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Vehicle.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vehicles'] }); setView('list'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Vehicle.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vehicles'] }); setView('list'); setSelected(null); },
  });

  const filtered = useMemo(() => {
    return vehicles.filter(v => {
      const matchSearch = !search || `${v.make} ${v.model} ${v.nickname || ''} ${v.plate || ''}`.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' || v.service_status === filter;
      return matchSearch && matchFilter;
    });
  }, [vehicles, search, filter]);

  const handleSave = async (data) => {
    if (selected) {
      await updateMutation.mutateAsync({ id: selected.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  if (view === 'form') {
    return <VehicleForm existing={selected} onSave={handleSave} onCancel={() => { setView('list'); setSelected(null); }} />;
  }

  if (view === 'detail' && selected) {
    return <VehicleDetail vehicle={selected} onEdit={() => setView('form')} onBack={() => { setView('list'); setSelected(null); }} />;
  }

  const available = vehicles.filter(v => v.service_status === 'available');
  const inUse = vehicles.filter(v => v.service_status === 'in_use');
  const maintenance = vehicles.filter(v => v.service_status === 'maintenance' || v.service_status === 'out_of_service');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicle Fleet</h1>
          <p className="text-sm font-medium text-muted-foreground mt-2">
            {available.length} available · {inUse.length} in use · {maintenance.length} in maintenance
          </p>
        </div>
        <Button onClick={() => { setSelected(null); setView('form'); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Vehicle
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all shadow-sm" onClick={() => setFilter('available')}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{available.length}</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Available</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all shadow-sm" onClick={() => setFilter('in_use')}>
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{inUse.length}</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">In Use</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all shadow-sm" onClick={() => setFilter('maintenance')}>
          <div className="flex items-center gap-3">
            <Wrench className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{vehicles.filter(v => v.service_status === 'maintenance').length}</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Maintenance</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all shadow-sm" onClick={() => setFilter('out_of_service')}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{vehicles.filter(v => v.service_status === 'out_of_service').length}</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Out of Service</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, plate, or make…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="in_use">In Use</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="out_of_service">OOS</TabsTrigger>
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
                    <TableHead className="text-xs">Vehicle</TableHead>
                    <TableHead className="text-xs">ID / Plate</TableHead>
                    <TableHead className="text-xs">Capacity</TableHead>
                    <TableHead className="text-xs">Assigned Driver</TableHead>
                    <TableHead className="text-xs">Odometer</TableHead>
                    <TableHead className="text-xs">Next Maintenance</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(v => {
                    const maintenanceDue = v.maintenance_due_date && new Date(v.maintenance_due_date) < new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
                    return (
                      <TableRow key={v.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelected(v); setView('detail'); }}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{v.nickname || `${v.year} ${v.make} ${v.model}`}</p>
                            <p className="text-xs text-muted-foreground">{v.year} {v.make} {v.model}{v.color ? ` · ${v.color}` : ''}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <p className="font-medium">{v.vehicle_id || '—'}</p>
                            <p className="text-muted-foreground">{v.plate}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <Users className="w-3 h-3" />{v.seat_capacity || '—'}
                            {v.wheelchair_accessible && <span className="ml-1 text-blue-500">♿</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{v.assigned_driver_name || 'Unassigned'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{v.odometer_miles ? `${v.odometer_miles.toLocaleString()} mi` : '—'}</TableCell>
                        <TableCell>
                          {v.maintenance_due_date ? (
                            <span className={`text-xs font-medium ${maintenanceDue ? 'text-red-500' : 'text-muted-foreground'}`}>
                              {maintenanceDue && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                              {v.maintenance_due_date}
                            </span>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs capitalize ${serviceColors[v.service_status] || ''}`}>
                            {v.service_status?.replace(/_/g, ' ') || 'unknown'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No vehicles found</TableCell>
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