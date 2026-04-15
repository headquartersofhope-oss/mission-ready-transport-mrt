import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, CheckCircle2, AlertTriangle, Truck, XCircle, 
  RefreshCw, DollarSign, AlertCircle
} from 'lucide-react';
import StatCard from '../components/dispatch/StatCard';
import RideTable from '../components/dispatch/RideTable';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function DispatchDashboard() {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: allRequests = [], isLoading } = useQuery({
    queryKey: ['transport-requests'],
    queryFn: () => base44.entities.TransportRequest.list('-created_date', 500),
  });

  const { data: recurringPlans = [] } = useQuery({
    queryKey: ['recurring-plans'],
    queryFn: () => base44.entities.RecurringTransportPlan.list('-created_date', 200),
  });

  const stats = useMemo(() => {
    const todayRides = allRequests.filter(r => r.request_date === today);
    const pending = allRequests.filter(r => r.status === 'pending');
    const approved = allRequests.filter(r => r.status === 'approved');
    const assigned = allRequests.filter(r => r.status === 'assigned' || r.status === 'in_progress');
    const completed = allRequests.filter(r => r.status === 'completed');
    const noShows = allRequests.filter(r => r.status === 'no_show');
    const highPriority = allRequests.filter(r => (r.priority === 'high' || r.priority === 'urgent') && !['completed', 'cancelled', 'denied'].includes(r.status));
    const totalCost = completed.reduce((sum, r) => sum + (r.actual_cost || r.estimated_cost || 0), 0);
    const activeRecurring = recurringPlans.filter(p => p.status === 'active');

    return { todayRides, pending, approved, assigned, completed, noShows, highPriority, totalCost, activeRecurring };
  }, [allRequests, recurringPlans, today]);

  const handleRowClick = (ride) => {
    navigate(`/requests?id=${ride.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dispatch Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Transportation operations overview for {format(new Date(), 'MMMM d, yyyy')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <StatCard label="Today's Rides" value={stats.todayRides.length} icon={Clock} color="blue" />
        <StatCard label="Pending Approval" value={stats.pending.length} icon={AlertTriangle} color="amber" />
        <StatCard label="Approved" value={stats.approved.length} icon={CheckCircle2} color="emerald" />
        <StatCard label="Active / Assigned" value={stats.assigned.length} icon={Truck} color="purple" />
        <StatCard label="High Priority" value={stats.highPriority.length} icon={AlertCircle} color="red" />
        <StatCard label="Completed" value={stats.completed.length} icon={CheckCircle2} color="emerald" subtext="all time" />
        <StatCard label="No-Shows" value={stats.noShows.length} icon={XCircle} color="red" subtext="all time" />
        <StatCard label="Recurring Plans" value={stats.activeRecurring.length} icon={RefreshCw} color="blue" subtext="active" />
        <StatCard label="Total Cost" value={`$${stats.totalCost.toLocaleString()}`} icon={DollarSign} color="emerald" subtext="completed rides" />
      </div>

      {/* Ride Panels */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today's Schedule ({stats.todayRides.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending.length})</TabsTrigger>
          <TabsTrigger value="priority">High Priority ({stats.highPriority.length})</TabsTrigger>
          <TabsTrigger value="no_show">No-Shows ({stats.noShows.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Today's Ride Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <RideTable rides={stats.todayRides} onRowClick={handleRowClick} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <RideTable rides={stats.pending} onRowClick={handleRowClick} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priority">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">High Priority Rides</CardTitle>
            </CardHeader>
            <CardContent>
              <RideTable rides={stats.highPriority} onRowClick={handleRowClick} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="no_show">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">No-Shows</CardTitle>
            </CardHeader>
            <CardContent>
              <RideTable rides={stats.noShows} onRowClick={handleRowClick} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}