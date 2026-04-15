import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, CheckCircle2, AlertTriangle, Truck, XCircle, 
  RefreshCw, DollarSign, AlertCircle, Users, Car, 
  Activity, Zap, TrendingUp, Eye, Filter
} from 'lucide-react';
import RideTable from '../components/dispatch/RideTable';
import UnassignedQueue from '../components/dispatch/UnassignedQueue';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

function StatCard({ label, value, icon: Icon, color, subtext, onClick }) {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-600',
    amber: 'bg-amber-500/10 text-amber-600',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    red: 'bg-red-500/10 text-red-600',
    purple: 'bg-purple-500/10 text-purple-600',
    slate: 'bg-slate-500/10 text-slate-600',
    cyan: 'bg-cyan-500/10 text-cyan-600',
  };
  return (
    <Card className={`p-4 hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
        </div>
        <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.slate}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </Card>
  );
}

function AlertBanner({ rides, drivers, vehicles, driverConflicts = [] }) {
  const alerts = [];
  const today = new Date().toISOString().split('T')[0];
  const urgentRides = rides.filter(r => r.priority === 'urgent' && !['completed', 'cancelled', 'no_show'].includes(r.status));
  const unassignedActive = rides.filter(r => {
    const terminal = ['completed', 'cancelled', 'no_show', 'denied'];
    if (terminal.includes(r.status)) return false;
    const missingDriver = !r.assigned_driver_name;
    const missingVehicle = !r.assigned_vehicle_name;
    const missingTime = !r.pickup_time;
    return r.request_date >= today && (missingDriver || missingVehicle || missingTime);
  });
  const expiredLicenses = drivers.filter(d => d.license_status === 'expired');
  const expiringLicenses = drivers.filter(d => d.license_status === 'expiring_soon');
  const maintenanceOverdue = vehicles.filter(v => v.maintenance_due_date && new Date(v.maintenance_due_date) < new Date());
  const insuranceExpiring = vehicles.filter(v => v.insurance_expiry && new Date(v.insurance_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  if (driverConflicts.length) alerts.push({ text: `Double-booking detected for: ${driverConflicts.join(', ')}`, color: 'red' });
  if (urgentRides.length) alerts.push({ text: `${urgentRides.length} urgent ride${urgentRides.length > 1 ? 's' : ''} need immediate attention`, color: 'red' });
  if (unassignedActive.length) {
    const noDriver = unassignedActive.filter(r => !r.assigned_driver_name).length;
    const noVehicle = unassignedActive.filter(r => !r.assigned_vehicle_name).length;
    const noTime = unassignedActive.filter(r => !r.pickup_time).length;
    const parts = [];
    if (noDriver) parts.push(`${noDriver} missing driver`);
    if (noVehicle) parts.push(`${noVehicle} missing vehicle`);
    if (noTime) parts.push(`${noTime} missing pickup time`);
    alerts.push({ text: `${unassignedActive.length} incomplete ride${unassignedActive.length > 1 ? 's' : ''}: ${parts.join(' · ')} — dispatcher action required`, color: 'amber' });
  }
  if (expiredLicenses.length) alerts.push({ text: `${expiredLicenses.map(d => `${d.first_name} ${d.last_name}`).join(', ')} — license EXPIRED, cannot dispatch`, color: 'red' });
  if (expiringLicenses.length) alerts.push({ text: `${expiringLicenses.length} driver license${expiringLicenses.length > 1 ? 's' : ''} expiring soon — renew before dispatch`, color: 'amber' });
  if (maintenanceOverdue.length) alerts.push({ text: `${maintenanceOverdue.map(v => v.nickname || v.plate).join(', ')} — maintenance overdue`, color: 'amber' });
  if (insuranceExpiring.length) alerts.push({ text: `${insuranceExpiring.length} vehicle insurance${insuranceExpiring.length > 1 ? 's' : ''} expire within 30 days`, color: 'amber' });

  if (alerts.length === 0) return (
    <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      <p className="text-sm text-emerald-600 font-medium">All systems operational — no active alerts</p>
    </div>
  );

  return (
    <div className="space-y-1.5">
      {alerts.map((alert, i) => (
        <div key={i} className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm font-medium
          ${alert.color === 'red' ? 'bg-red-500/8 border-red-500/20 text-red-600' : 'bg-amber-500/8 border-amber-500/20 text-amber-700'}`}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {alert.text}
        </div>
      ))}
    </div>
  );
}

export default function DispatchDashboard() {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [dateFilter, setDateFilter] = useState(today);
  const [driverFilter, setDriverFilter] = useState('all');

  const { data: allRequests = [], isLoading } = useQuery({
    queryKey: ['transport-requests'],
    queryFn: () => base44.entities.TransportRequest.list('-created_date', 1000),
  });

  const { data: recurringPlans = [] } = useQuery({
    queryKey: ['recurring-plans'],
    queryFn: () => base44.entities.RecurringTransportPlan.list('-created_date', 200),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list('first_name', 200),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list('nickname', 100),
  });

  const stats = useMemo(() => {
    const dateRides = allRequests.filter(r => r.request_date === dateFilter);
    const pending = allRequests.filter(r => ['pending', 'requested', 'under_review'].includes(r.status));
    const approved = allRequests.filter(r => r.status === 'approved');
    const inProgress = allRequests.filter(r => ['en_route', 'rider_picked_up', 'dropped_off', 'return_pending', 'in_progress'].includes(r.status));
    const completed = allRequests.filter(r => r.status === 'completed');
    const noShows = allRequests.filter(r => r.status === 'no_show');
    const highPriority = allRequests.filter(r => (r.priority === 'high' || r.priority === 'urgent') && !['completed', 'cancelled', 'denied', 'no_show'].includes(r.status));
    const totalCost = completed.reduce((sum, r) => sum + (r.actual_cost || r.estimated_cost || 0), 0);
    const activeRecurring = recurringPlans.filter(p => p.status === 'active');
    const activeDrivers = drivers.filter(d => d.status === 'active');
    const onDutyDrivers = drivers.filter(d => d.availability === 'on_duty' || d.availability === 'available');
    const availableVehicles = vehicles.filter(v => v.service_status === 'available' && v.status === 'active');
    const outOfServiceVehicles = vehicles.filter(v => v.service_status === 'out_of_service' || v.service_status === 'maintenance');

    const dateFiltered = driverFilter === 'all' ? dateRides : dateRides.filter(r => r.assigned_driver_name === driverFilter);

    // Double-booking detection for today
    const todayActive = dateRides.filter(r => r.assigned_driver_id && r.pickup_time && !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status));
    const driverConflicts = new Set();
    const driverMap = {};
    todayActive.forEach(r => {
      const k = r.assigned_driver_id;
      if (!driverMap[k]) driverMap[k] = [];
      driverMap[k].push(r);
    });
    Object.values(driverMap).forEach(group => {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const [h1] = (group[i].pickup_time || '').split(':').map(Number);
          const [h2] = (group[j].pickup_time || '').split(':').map(Number);
          if (!isNaN(h1) && !isNaN(h2) && Math.abs(h1 * 60 - h2 * 60) < 60) {
            driverConflicts.add(group[i].assigned_driver_name);
          }
        }
      }
    });

    return {
      dateRides: dateFiltered, pending, approved, inProgress, completed,
      noShows, highPriority, totalCost, activeRecurring, activeDrivers,
      onDutyDrivers, availableVehicles, outOfServiceVehicles,
      driverConflicts: [...driverConflicts],
      assignedToday: dateRides.filter(r => ['driver_assigned', 'scheduled', 'assigned', 'en_route', 'rider_picked_up'].includes(r.status)),
      unassignedToday: dateRides.filter(r => !r.assigned_driver_name && !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status)),
      completedToday: dateRides.filter(r => r.status === 'completed'),
      cancelledToday: dateRides.filter(r => r.status === 'cancelled'),
      noShowToday: dateRides.filter(r => r.status === 'no_show'),
    };
  }, [allRequests, recurringPlans, drivers, vehicles, today, dateFilter, driverFilter]);

  const uniqueDrivers = [...new Set(allRequests.filter(r => r.assigned_driver_name).map(r => r.assigned_driver_name))];

  const handleRowClick = (ride) => navigate(`/requests?id=${ride.id}`);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dispatch Operations</h1>
          <p className="text-sm text-muted-foreground mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-transparent text-sm"
          />
          <Select value={driverFilter} onValueChange={setDriverFilter}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="All Drivers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Drivers</SelectItem>
              {uniqueDrivers.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Operational Alerts */}
      <AlertBanner rides={allRequests} drivers={drivers} vehicles={vehicles} driverConflicts={stats.driverConflicts} />

      {/* Unassigned Ride Queue — always visible when rides need action */}
      <UnassignedQueue
        rides={allRequests.filter(r => r.request_date >= today)}
        onRideClick={handleRowClick}
      />

      {/* Today's KPI Grid */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Day Snapshot — {dateFilter}</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Rides" value={stats.dateRides.length} icon={Clock} color="blue" subtext={dateFilter} />
          <StatCard label="Dispatched" value={stats.assignedToday.length} icon={Truck} color="purple" onClick={() => navigate('/dispatch-board')} />
          <StatCard label="Needs Assignment" value={stats.unassignedToday.length} icon={AlertTriangle} color="amber" onClick={() => navigate('/dispatch-board')} />
          <StatCard label="Completed" value={stats.completedToday.length} icon={CheckCircle2} color="emerald" onClick={() => navigate('/requests')} />
          <StatCard label="No-Shows" value={stats.noShowToday.length} icon={XCircle} color="red" onClick={() => navigate('/incidents')} />
          <StatCard label="Cancelled" value={stats.cancelledToday.length} icon={XCircle} color="slate" />
        </div>
      </div>

      {/* Fleet & Workforce */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Fleet & Workforce</p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <StatCard label="Active Drivers" value={stats.activeDrivers.length} icon={Users} color="emerald" onClick={() => navigate('/drivers')} />
          <StatCard label="Available Now" value={stats.onDutyDrivers.length} icon={Activity} color="blue" onClick={() => navigate('/drivers')} />
          <StatCard label="Vehicles Ready" value={stats.availableVehicles.length} icon={Car} color="emerald" onClick={() => navigate('/vehicles')} />
          <StatCard label="Out of Service" value={stats.outOfServiceVehicles.length} icon={AlertCircle} color="red" onClick={() => navigate('/vehicles')} />
          <StatCard label="Recurring Plans" value={stats.activeRecurring.length} icon={RefreshCw} color="cyan" subtext="active" onClick={() => navigate('/recurring')} />
        </div>
      </div>

      {/* Program-level Metrics */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Program Metrics</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Needs Review" value={stats.pending.length} icon={Eye} color="amber" onClick={() => navigate('/requests')} />
          <StatCard label="High / Urgent" value={stats.highPriority.length} icon={Zap} color="red" onClick={() => navigate('/requests')} subtext="open rides" />
          <StatCard label="Total Completed" value={stats.completed.length} icon={TrendingUp} color="emerald" onClick={() => navigate('/reports')} />
          <StatCard label="Total Program Cost" value={`$${stats.totalCost.toLocaleString()}`} icon={DollarSign} color="emerald" subtext="completed rides" onClick={() => navigate('/costs')} />
        </div>
      </div>

      {/* Ride Panels */}
      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="schedule">Day Schedule ({stats.dateRides.length})</TabsTrigger>
          <TabsTrigger value="pending">Needs Action ({stats.pending.length + stats.approved.length})</TabsTrigger>
          <TabsTrigger value="active">In Progress ({stats.inProgress.length})</TabsTrigger>
          <TabsTrigger value="priority">High Priority ({stats.highPriority.length})</TabsTrigger>
          <TabsTrigger value="issues">No-Shows / Issues ({stats.noShows.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Schedule for {dateFilter}</CardTitle>
            </CardHeader>
            <CardContent>
              <RideTable rides={stats.dateRides} onRowClick={handleRowClick} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Rides Needing Action</CardTitle>
            </CardHeader>
            <CardContent>
              <RideTable rides={[...stats.pending, ...stats.approved]} onRowClick={handleRowClick} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Currently In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <RideTable rides={stats.inProgress} onRowClick={handleRowClick} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priority">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">High Priority & Urgent Rides</CardTitle>
            </CardHeader>
            <CardContent>
              <RideTable rides={stats.highPriority} onRowClick={handleRowClick} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">No-Shows & Incident Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <RideTable rides={[...stats.noShows, ...allRequests.filter(r => r.status === 'incident_review')]} onRowClick={handleRowClick} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}