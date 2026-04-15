import { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, Receipt, PiggyBank } from 'lucide-react';
import StatCard from '../components/dispatch/StatCard';

export default function CostTracking() {
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['transport-requests'],
    queryFn: () => base44.entities.TransportRequest.list('-created_date', 500),
  });

  const stats = useMemo(() => {
    const completed = requests.filter(r => r.status === 'completed');
    const totalEstimated = completed.reduce((s, r) => s + (r.estimated_cost || 0), 0);
    const totalActual = completed.reduce((s, r) => s + (r.actual_cost || 0), 0);
    const totalContributions = completed.reduce((s, r) => s + (r.participant_contribution || 0), 0);
    const netCost = totalActual - totalContributions;

    // Cost by purpose
    const byPurpose = {};
    completed.forEach(r => {
      const key = r.purpose || 'other';
      byPurpose[key] = (byPurpose[key] || 0) + (r.actual_cost || r.estimated_cost || 0);
    });

    // Cost by participant
    const byParticipant = {};
    completed.forEach(r => {
      const key = r.participant_name || 'Unknown';
      byParticipant[key] = (byParticipant[key] || 0) + (r.actual_cost || r.estimated_cost || 0);
    });

    // Funding source breakdown
    const byFunding = {};
    completed.forEach(r => {
      const key = r.funding_source || 'Unspecified';
      byFunding[key] = (byFunding[key] || 0) + (r.actual_cost || r.estimated_cost || 0);
    });

    return { completed, totalEstimated, totalActual, totalContributions, netCost, byPurpose, byParticipant, byFunding };
  }, [requests]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const sortedByPurpose = Object.entries(stats.byPurpose).sort((a, b) => b[1] - a[1]);
  const sortedByParticipant = Object.entries(stats.byParticipant).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const sortedByFunding = Object.entries(stats.byFunding).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cost & Funding Tracking</h1>
        <p className="text-sm text-muted-foreground mt-1">Financial overview of transportation operations</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Estimated" value={`$${stats.totalEstimated.toLocaleString()}`} icon={Receipt} color="blue" />
        <StatCard label="Total Actual" value={`$${stats.totalActual.toLocaleString()}`} icon={DollarSign} color="emerald" />
        <StatCard label="Participant Contrib." value={`$${stats.totalContributions.toLocaleString()}`} icon={PiggyBank} color="purple" />
        <StatCard label="Net Program Cost" value={`$${stats.netCost.toLocaleString()}`} icon={TrendingUp} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By Purpose */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cost by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedByPurpose.map(([purpose, amount]) => {
                const pct = stats.totalActual > 0 ? (amount / stats.totalActual * 100).toFixed(1) : 0;
                return (
                  <div key={purpose} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-sm font-medium capitalize w-28">{purpose.replace(/_/g, ' ')}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-semibold ml-3">${amount.toLocaleString()}</span>
                  </div>
                );
              })}
              {sortedByPurpose.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>}
            </div>
          </CardContent>
        </Card>

        {/* By Funding Source */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cost by Funding Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedByFunding.map(([source, amount]) => {
                const pct = stats.totalActual > 0 ? (amount / stats.totalActual * 100).toFixed(1) : 0;
                return (
                  <div key={source} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-sm font-medium w-28 truncate">{source}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-semibold ml-3">${amount.toLocaleString()}</span>
                  </div>
                );
              })}
              {sortedByFunding.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top participants by cost */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top Participants by Cost</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">#</TableHead>
                  <TableHead className="text-xs">Participant</TableHead>
                  <TableHead className="text-xs text-right">Total Cost</TableHead>
                  <TableHead className="text-xs text-right">Rides</TableHead>
                  <TableHead className="text-xs text-right">Avg Cost/Ride</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedByParticipant.map(([name, amount], i) => {
                  const rides = stats.completed.filter(r => r.participant_name === name).length;
                  return (
                    <TableRow key={name}>
                      <TableCell className="text-sm text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium text-sm">{name}</TableCell>
                      <TableCell className="text-sm text-right font-semibold">${amount.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-right">{rides}</TableCell>
                      <TableCell className="text-sm text-right">${rides > 0 ? (amount / rides).toFixed(2) : '0.00'}</TableCell>
                    </TableRow>
                  );
                })}
                {sortedByParticipant.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No completed rides yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}