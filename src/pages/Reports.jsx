import { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['hsl(222,47%,20%)', 'hsl(38,92%,50%)', 'hsl(160,60%,40%)', 'hsl(280,55%,50%)', 'hsl(0,72%,51%)', 'hsl(200,60%,45%)', 'hsl(320,60%,50%)', 'hsl(100,50%,40%)'];

export default function Reports() {
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['transport-requests'],
    queryFn: () => base44.entities.TransportRequest.list('-created_date', 1000),
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: () => base44.entities.TransportProvider.list('name', 200),
  });

  const { data: recurringPlans = [] } = useQuery({
    queryKey: ['recurring-plans'],
    queryFn: () => base44.entities.RecurringTransportPlan.list('-created_date', 500),
  });

  const analytics = useMemo(() => {
    const completed = requests.filter(r => r.status === 'completed');
    const denied = requests.filter(r => r.status === 'denied');
    const noShows = requests.filter(r => r.status === 'no_show');
    const employment = requests.filter(r => r.purpose === 'employment');
    const noShowRate = requests.length > 0 ? ((noShows.length / requests.length) * 100).toFixed(1) : 0;

    // Rides by purpose
    const purposeCounts = {};
    requests.forEach(r => {
      const key = r.purpose || 'other';
      purposeCounts[key] = (purposeCounts[key] || 0) + 1;
    });
    const purposeData = Object.entries(purposeCounts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

    // Cost by purpose
    const costByPurpose = {};
    completed.forEach(r => {
      const key = r.purpose || 'other';
      costByPurpose[key] = (costByPurpose[key] || 0) + (r.actual_cost || r.estimated_cost || 0);
    });
    const costPurposeData = Object.entries(costByPurpose).map(([name, value]) => ({ name: name.replace(/_/g, ' '), cost: value }));

    // Provider usage
    const providerUsage = {};
    requests.filter(r => r.assigned_provider_name).forEach(r => {
      providerUsage[r.assigned_provider_name] = (providerUsage[r.assigned_provider_name] || 0) + 1;
    });
    const providerData = Object.entries(providerUsage).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    // Monthly trend
    const monthlyTrend = {};
    requests.forEach(r => {
      if (r.request_date) {
        const month = r.request_date.substring(0, 7);
        monthlyTrend[month] = (monthlyTrend[month] || 0) + 1;
      }
    });
    const trendData = Object.entries(monthlyTrend).sort().map(([month, count]) => ({ month, rides: count }));

    // Status breakdown
    const statusCounts = {};
    requests.forEach(r => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

    return { completed, denied, noShows, employment, noShowRate, purposeData, costPurposeData, providerData, trendData, statusData, recurringPlans };
  }, [requests, recurringPlans]);

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
        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Transportation operations insights and metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">Total Requests</p>
          <p className="text-2xl font-bold mt-1">{requests.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">Completed</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{analytics.completed.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">Denied</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{analytics.denied.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">No-Show Rate</p>
          <p className="text-2xl font-bold mt-1">{analytics.noShowRate}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">Employment Rides</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{analytics.employment.length}</p>
        </Card>
      </div>

      <Tabs defaultValue="demand" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="demand">Demand Trends</TabsTrigger>
          <TabsTrigger value="purpose">By Purpose</TabsTrigger>
          <TabsTrigger value="costs">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="providers">Provider Usage</TabsTrigger>
          <TabsTrigger value="status">Status Breakdown</TabsTrigger>
          <TabsTrigger value="denied">Denied Rides</TabsTrigger>
          <TabsTrigger value="recurring">Recurring Burden</TabsTrigger>
        </TabsList>

        <TabsContent value="demand">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Monthly Ride Demand</CardTitle></CardHeader>
            <CardContent>
              {analytics.trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.trendData}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rides" stroke="hsl(222,47%,20%)" strokeWidth={2} dot={{ fill: 'hsl(38,92%,50%)' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-8">No trend data available yet</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purpose">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Rides by Purpose</CardTitle></CardHeader>
            <CardContent>
              {analytics.purposeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.purposeData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(222,47%,20%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Cost by Purpose</CardTitle></CardHeader>
            <CardContent>
              {analytics.costPurposeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.costPurposeData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                    <Bar dataKey="cost" fill="hsl(38,92%,50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-8">No cost data yet</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Provider Usage</CardTitle></CardHeader>
            <CardContent>
              {analytics.providerData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={analytics.providerData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent*100).toFixed(0)}%)`}>
                        {analytics.providerData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Provider</TableHead>
                        <TableHead className="text-xs text-right">Rides</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.providerData.map(p => (
                        <TableRow key={p.name}>
                          <TableCell className="text-sm font-medium">{p.name}</TableCell>
                          <TableCell className="text-sm text-right">{p.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-8">No provider data yet</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Status Distribution</CardTitle></CardHeader>
            <CardContent>
              {analytics.statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={analytics.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent*100).toFixed(0)}%)`}>
                      {analytics.statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="denied">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Denied Rides</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Participant</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Purpose</TableHead>
                    <TableHead className="text-xs">Denial Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.denied.length > 0 ? analytics.denied.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm font-medium">{r.participant_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.request_date}</TableCell>
                      <TableCell className="text-sm capitalize">{r.purpose?.replace(/_/g, ' ')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.denial_reason || '—'}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No denied rides</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recurring">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Recurring Transport Plan Burden</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recurringPlans.filter(p => p.status === 'active').map(plan => {
                  const daysPerWeek = plan.weekday_pattern?.length || 0;
                  const ridesPerMonth = daysPerWeek * 4.3;
                  const costPerMonth = ridesPerMonth * (plan.estimated_cost_per_ride || 0);
                  return (
                    <div key={plan.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div>
                        <p className="text-sm font-medium">{plan.participant_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{plan.purpose?.replace(/_/g, ' ')} · {daysPerWeek} days/week</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">${costPerMonth.toFixed(0)}/mo</p>
                        <p className="text-xs text-muted-foreground">~{ridesPerMonth.toFixed(0)} rides/mo</p>
                      </div>
                    </div>
                  );
                })}
                {analytics.recurringPlans.filter(p => p.status === 'active').length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No active recurring plans</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}