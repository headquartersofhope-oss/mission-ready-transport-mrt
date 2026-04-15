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

function AlertBanner({ rides, drivers, vehicles }) {
  const alerts = [];
  const urgentRides = rides.filter(r => r.priority === 'urgent' && !['completed', 'cancelled', 'no_show'].includes(r.status));
  const unassignedApproved = rides.filter(r => r.status === 'approved' && !r.assigned_driver_name);
  const noShowToday = rides.filter(r => r.status === 'no_show');
  const expiredLicenses = drivers.filter(d => d.license_status === 'expired' || d.license_status === 'expiring_soon');
  const maintenanceDue = vehicles.filter(v => v.maintenance_due_date && new Date(v.maintenance_due_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  if (urgentRides.length) alerts.push({ type: 'urgent', text: `${urgentRides.length} urgent ride${urgentRides.length > 1 ? 's' : ''} need immediate attention`, color: 'red' });
  if (unassignedApproved.length) alerts.push({ type: 'assignment', text: `${unassignedApproved.length} approved ride${unassignedApproved.length > 1 ? 's' : ''} not yet assigned to a driver`, color: 'amber' });
  if (noShowToday.length) alerts.push({ type: 'noshow', text: `${noShowToday.length} no-show${noShowToday.length > 1 ? 's' : ''} recorded today`, color: 'amber' });
  if (expiredLicenses.length) alerts.push({ type: 'license', text: `${expiredLicenses.length} driver license${expiredLicenses.length > 1 ? 's' : ''} expired or expiring soon`, color: 'amber' });
  if (maintenanceDue.length) alerts.push({ type: 'maintenance', text: `${maintenanceDue.length} vehicle${maintenanceDue.length > 1 ? 's' : ''} have maintenance due within 7 days`, color: 'amber' });

  if (alerts.length === 0) return (
    <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      <p className="text-sm text-emerald-600 font-medium">All systems operational — no active alerts</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => (
        <div key={i} className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium
          ${alert.color === 'red' ? 'bg-red-500/5 border-red-500/20 text-red-600' : 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400'}`}>
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
    const todayRides = allRequests.filter(r => r.request_date === today);
    const pending = allRequests.filter(r => ['pending', 'requested', 'under_review'].includes(r.status));
    const approved = allRequests.filter(r => r.status === 'approved');
    const assigned = allRequests.filter(r => ['driver_assigned', 'scheduled', 'assigned'].includes(r.status));
    const inProgress = allRequests.filter(r => ['en_route', 'rider_picked_up', 'dropped_off', 'return_pending', 'in_progress'].includes(r.status));
    const completed = allRequests.filter(r => r.status === 'completed');
    const noShows = allRequests.filter(r => r.status === 'no_show');
    const cancelled = allRequests.filter(r => r.status === 'cancelled');
    const highPriority = allRequests.filter(r => (r.priority === 'high' || r.priority === 'urgent') && !['completed', 'cancelled', 'denied', 'no_show'].includes(r.status));
    const totalCost = completed.reduce((sum, r) => sum + (r.actual_cost || r.estimated_cost || 0), 0);
    const activeRecurring = recurringPlans.filter(p => p.status === 'active');
    const activeDrivers = drivers.filter(d => d.status === 'active');
    const onDutyDrivers = drivers.filter(d => d.availability === 'on_duty' || d.availability === 'available');
    const availableVehicles = vehicles.filter(v => v.service_status === 'available' && v.status === 'active');
    const outOfServiceVehicles = vehicles.filter(v => v.service_status === 'out_of_service' || v.service_status === 'maintenance');

    const dateFiltered = dateFilter === today ? dateRides : allRequests.filter(r => r.request_date === dateFilter);
    const driverFiltered = driverFilter === 'all' ? dateFiltered : dateFiltered.filter(r => r.assigned_driver_name === driverFilter);

    return {
      todayRides, dateRides: driverFiltered, pending, approved, assigned, inProgress, completed,
      noShows, cancelled, highPriority, totalCost, activeRecurring, activeDrivers,
      onDutyDrivers, availableVehicles, outOfServiceVehicles,
      requestedToday: dateRides.filter(r => ['requested', 'pending'].includes(r.status)),
      assignedToday: dateRides.filter(r => ['driver_assigned', 'scheduled', 'assigned', 'en_route', 'rider_picked_up'].includes(r.status)),
      unassignedToday: dateRides.filter(r => ['approved', 'requested', 'pending'].includes(r.status)),
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

      {/* AI Alerts */}
      <AlertBanner rides={allRequests} drivers={drivers} vehicles={vehicles} />

      {/* Top KPI Grid */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Today's Operations — {dateFilter}</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Requested" value={stats.dateRides.length} icon={Clock} color="blue" />
          <StatCard label="Assigned" value={stats.assignedToday.length} icon={Truck} color="purple" />
          <StatCard label="Unassigned" value={stats.unassignedToday.length} icon={AlertTriangle} color="amber" onClick={() => navigate('/requests')} />
          <StatCard label="Completed" value={stats.completedToday.length} icon={CheckCircle2} color="emerald" />
          <StatCard label="No-Shows" value={stats.noShowToday.length} icon={XCircle} color="red" />
          <StatCard label="Cancelled" value={stats.cancelledToday.length} icon={XCircle} color="slate" />
        </div>
      </div>

      {/* Fleet & Operations KPIs */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Fleet & Personnel</p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <StatCard label="Drivers Active" value={stats.activeDrivers.length} icon={Users} color="emerald" subtext="total active" />
          <StatCard label="On Duty / Available" value={stats.onDutyDrivers.length} icon={Activity} color="blue" />
          <StatCard label="Vehicles Available" value={stats.availableVehicles.length} icon={Car} color="emerald" />
          <StatCard label="Out of Service" value={stats.outOfServiceVehicles.length} icon={AlertCircle} color="red" />
          <StatCard label="Recurring Plans" value={stats.activeRecurring.length} icon={RefreshCw} color="cyan" subtext="active" />
        </div>
      </div>

      {/* All-time KPIs */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">All-Time Metrics</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Pending Review" value={stats.pending.length} icon={Eye} color="amber" onClick={() => navigate('/requests')} />
          <StatCard label="High Priority" value={stats.highPriority.length} icon={Zap} color="red" onClick={() => navigate('/requests')} />
          <StatCard label="Total Completed" value={stats.completed.length} icon={TrendingUp} color="emerald" />
          <StatCard label="Total Cost" value={`$${stats.totalCost.toLocaleString()}`} icon={DollarSign} color="emerald" subtext="completed rides" />
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