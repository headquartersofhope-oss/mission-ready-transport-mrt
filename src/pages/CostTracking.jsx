import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DollarSign, TrendingUp, Receipt, PiggyBank, Fuel, RotateCcw,
  User, Car, Truck, Brain, AlertTriangle, Loader2, CheckCircle2,
  BarChart3, Zap, RefreshCw
} from 'lucide-react';
import StatCard from '../components/premium/StatCard';
import PremiumPageHeader from '../components/premium/PremiumPageHeader';

const FUNDING_LABELS = {
  nonprofit_operating_budget: 'Nonprofit Budget',
  grant_funded: 'Grant-Funded',
  employer_sponsored: 'Employer-Sponsored',
  church_donor_sponsored: 'Church / Donor',
  client_paid: 'Client-Paid',
  emergency_support_fund: 'Emergency Fund',
  other: 'Other',
};

const PROGRAM_LABELS = {
  employment_support: 'Employment Support',
  medical_health: 'Medical / Health',
  legal_court: 'Legal / Court',
  housing: 'Housing',
  education_training: 'Education / Training',
  recovery_treatment: 'Recovery / Treatment',
  benefits_services: 'Benefits / Services',
  emergency: 'Emergency',
  other: 'Other',
};

const fmt = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function BarRow({ label, amount, total, color = 'bg-primary', sublabel }) {
  const pct = total > 0 ? Math.min((amount / total) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 shrink-0">
        <p className="text-xs font-medium truncate">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground truncate">{sublabel}</p>}
      </div>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold w-20 text-right shrink-0">{fmt(amount)}</span>
    </div>
  );
}

function CostTable({ rows, columns }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">#</TableHead>
            {columns.map(c => <TableHead key={c.key} className={`text-xs ${c.right ? 'text-right' : ''}`}>{c.label}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground py-8">No data yet</TableCell></TableRow>
          ) : rows.map((row, i) => (
            <TableRow key={i}>
              <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
              {columns.map(c => (
                <TableCell key={c.key} className={`text-sm ${c.right ? 'text-right' : ''} ${c.bold ? 'font-semibold' : ''} ${c.color?.(row[c.key]) || ''}`}>
                  {row[c.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function CostTracking() {
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['transport-requests'],
    queryFn: () => base44.entities.TransportRequest.list('-created_date', 1000),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list('nickname', 100),
  });

  const { data: recurringPlans = [] } = useQuery({
    queryKey: ['recurring-plans'],
    queryFn: () => base44.entities.RecurringTransportPlan.list('-created_date', 200),
  });

  const stats = useMemo(() => {
    const completed = requests.filter(r => r.status === 'completed');
    const allBillable = requests.filter(r => r.is_billable !== false && !['cancelled', 'denied'].includes(r.status));

    const sum = (arr, field) => arr.reduce((s, r) => s + (r[field] || 0), 0);
    const costOf = (r) => r.actual_cost || r.estimated_cost || 0;

    const totalEstimated = sum(completed, 'estimated_cost');
    const totalActual = sum(completed, 'actual_cost');
    const totalFuel = sum(completed, 'fuel_estimate');
    const totalReimbursement = sum(completed, 'reimbursement_amount');
    const totalContributions = sum(completed, 'participant_contribution');
    const netCost = totalActual - totalContributions;

    // By client
    const byClient = {};
    completed.forEach(r => {
      const k = r.participant_name || 'Unknown';
      if (!byClient[k]) byClient[k] = { total: 0, rides: 0, fuel: 0 };
      byClient[k].total += costOf(r);
      byClient[k].rides++;
      byClient[k].fuel += r.fuel_estimate || 0;
    });

    // By program category (with fallback to purpose)
    const byProgram = {};
    completed.forEach(r => {
      const k = r.program_category ? (PROGRAM_LABELS[r.program_category] || r.program_category) : (r.purpose?.replace(/_/g, ' ') || 'other');
      byProgram[k] = (byProgram[k] || 0) + costOf(r);
    });

    // By driver
    const byDriver = {};
    completed.forEach(r => {
      const k = r.assigned_driver_name || 'Unassigned';
      if (!byDriver[k]) byDriver[k] = { total: 0, rides: 0, fuel: 0 };
      byDriver[k].total += costOf(r);
      byDriver[k].rides++;
      byDriver[k].fuel += r.fuel_estimate || 0;
    });

    // By vehicle
    const byVehicle = {};
    completed.forEach(r => {
      const k = r.assigned_vehicle_name || 'Unassigned';
      if (!byVehicle[k]) byVehicle[k] = { total: 0, rides: 0, fuel: 0 };
      byVehicle[k].total += costOf(r);
      byVehicle[k].rides++;
      byVehicle[k].fuel += r.fuel_estimate || 0;
    });

    // By funding source type
    const byFundingType = {};
    completed.forEach(r => {
      const k = r.funding_source_type ? (FUNDING_LABELS[r.funding_source_type] || r.funding_source_type) : (r.funding_source || 'Unspecified');
      byFundingType[k] = (byFundingType[k] || 0) + costOf(r);
    });

    // By named funding source
    const byFundingName = {};
    completed.forEach(r => {
      const k = r.funding_source || 'Unspecified';
      byFundingName[k] = (byFundingName[k] || 0) + costOf(r);
    });

    // By recurring plan
    const byRecurring = {};
    completed.filter(r => r.is_recurring && r.recurring_plan_id).forEach(r => {
      const plan = recurringPlans.find(p => p.id === r.recurring_plan_id);
      const k = plan ? `${plan.participant_name} — ${plan.purpose?.replace(/_/g, ' ')}` : r.recurring_plan_id;
      if (!byRecurring[k]) byRecurring[k] = { total: 0, rides: 0 };
      byRecurring[k].total += costOf(r);
      byRecurring[k].rides++;
    });

    // Billable vs non-billable
    const billableTotal = completed.filter(r => r.is_billable !== false).reduce((s, r) => s + costOf(r), 0);
    const nonBillableTotal = completed.filter(r => r.is_billable === false).reduce((s, r) => s + costOf(r), 0);

    return {
      completed, totalEstimated, totalActual, totalFuel, totalReimbursement,
      totalContributions, netCost, billableTotal, nonBillableTotal,
      byClient, byProgram, byDriver, byVehicle, byFundingType, byFundingName, byRecurring
    };
  }, [requests, recurringPlans]);

  const handleAiAlert = async () => {
    setAiLoading(true);
    setAiResult(null);
    const costData = {
      totalActual: stats.totalActual,
      totalFuel: stats.totalFuel,
      totalRides: stats.completed.length,
      avgCostPerRide: stats.completed.length > 0 ? (stats.totalActual / stats.completed.length).toFixed(2) : 0,
      byClient: Object.entries(stats.byClient).sort((a, b) => b[1].total - a[1].total).slice(0, 15).map(([name, d]) => ({
        name, total: d.total, rides: d.rides, avgPerRide: d.rides > 0 ? +(d.total / d.rides).toFixed(2) : 0
      })),
      byDriver: Object.entries(stats.byDriver).map(([name, d]) => ({
        name, total: d.total, rides: d.rides, avgPerRide: d.rides > 0 ? +(d.total / d.rides).toFixed(2) : 0
      })),
      byVehicle: Object.entries(stats.byVehicle).map(([name, d]) => ({
        name, total: d.total, rides: d.rides, utilization: stats.completed.length > 0 ? ((d.rides / stats.completed.length) * 100).toFixed(1) + '%' : '0%'
      })),
      byProgram: Object.entries(stats.byProgram).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, total]) => ({ name, total })),
      byFunding: Object.entries(stats.byFundingType).sort((a, b) => b[1] - a[1]).map(([name, total]) => ({ name, total })),
      byRecurring: Object.entries(stats.byRecurring).sort((a, b) => b[1].total - a[1].total).slice(0, 10).map(([name, d]) => ({
        name, total: d.total, rides: d.rides, avgPerRide: d.rides > 0 ? +(d.total / d.rides).toFixed(2) : 0
      })),
      activeVehicles: vehicles.filter(v => v.status === 'active').length,
      billableVsNonBillable: { billable: stats.billableTotal, nonBillable: stats.nonBillableTotal },
    };

    const res = await base44.functions.invoke('aiOpsIntelligence', {
      mode: 'ops_query',
      data: {
        systemData: { costAnalysis: costData },
        question: `Analyze this transportation cost data and flag: (1) recurring rides becoming too expensive, (2) underused vehicles, (3) route waste and inefficiencies, (4) unusually expensive ride patterns or clients, (5) whether the data suggests needing another vehicle. Return JSON with fields: expensive_recurring_rides (array of strings), underused_vehicles (array of strings), route_waste (array of strings), expensive_patterns (array of strings), fleet_expansion_signal (object with recommended boolean and rationale string), cost_optimization_actions (array of {action, impact, priority}), overall_cost_health (string), summary (string)`
      }
    });
    setAiResult(res.data);
    setAiLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const maxTotal = stats.totalActual || 1;

  const clientRows = Object.entries(stats.byClient)
    .sort((a, b) => b[1].total - a[1].total).slice(0, 20)
    .map(([name, d]) => ({
      name, total: fmt(d.total), rides: d.rides,
      avg: fmt(d.rides > 0 ? d.total / d.rides : 0),
      fuel: fmt(d.fuel),
    }));

  const driverRows = Object.entries(stats.byDriver)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([name, d]) => ({
      name, total: fmt(d.total), rides: d.rides,
      avg: fmt(d.rides > 0 ? d.total / d.rides : 0),
      fuel: fmt(d.fuel),
    }));

  const vehicleRows = Object.entries(stats.byVehicle)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([name, d]) => ({
      name, total: fmt(d.total), rides: d.rides,
      avg: fmt(d.rides > 0 ? d.total / d.rides : 0),
      pct: stats.completed.length > 0 ? `${((d.rides / stats.completed.length) * 100).toFixed(0)}%` : '0%',
    }));

  const recurringRows = Object.entries(stats.byRecurring)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([name, d]) => ({
      name, total: fmt(d.total), rides: d.rides,
      avg: fmt(d.rides > 0 ? d.total / d.rides : 0),
    }));

  return (
    <div className="space-y-6">
      <PremiumPageHeader 
        title="Cost & Funding Tracking" 
        subtitle="Full operational cost visibility across riders, drivers, vehicles, and funding sources"
      >
        <Button onClick={handleAiAlert} disabled={aiLoading} className="bg-primary gap-2">
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          {aiLoading ? 'Analyzing…' : 'AI Cost Analysis'}
        </Button>
      </PremiumPageHeader>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Actual" value={fmt(stats.totalActual)} icon={DollarSign} color="emerald" />
        <StatCard label="Total Estimated" value={fmt(stats.totalEstimated)} icon={Receipt} color="blue" />
        <StatCard label="Fuel Costs" value={fmt(stats.totalFuel)} icon={Fuel} color="amber" />
        <StatCard label="Reimbursements" value={fmt(stats.totalReimbursement)} icon={RotateCcw} color="purple" />
        <StatCard label="Participant Contrib." value={fmt(stats.totalContributions)} icon={PiggyBank} color="cyan" />
        <StatCard label="Net Program Cost" value={fmt(stats.netCost)} icon={TrendingUp} color="red" />
      </div>

      {/* Billable split */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Billable Rides</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{fmt(stats.billableTotal)}</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.completed.filter(r => r.is_billable !== false).length} rides</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Non-Billable Rides</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{fmt(stats.nonBillableTotal)}</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.completed.filter(r => r.is_billable === false).length} rides</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Avg Cost / Ride</p>
          <p className="text-2xl font-bold mt-1">{fmt(stats.completed.length > 0 ? stats.totalActual / stats.completed.length : 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.completed.length} completed rides</p>
        </Card>
      </div>

      {/* AI Cost Alerts */}
      {(aiLoading || aiResult) && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />AI Cost Intelligence
              {aiResult?.overall_cost_health && (
                <Badge variant="outline" className="ml-auto text-xs">{aiResult.overall_cost_health}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiLoading && (
              <div className="flex items-center gap-3 py-4 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">AI analyzing your cost data…</span>
              </div>
            )}
            {aiResult && !aiLoading && (
              <div className="space-y-4">
                {aiResult.summary && (
                  <p className="text-sm bg-muted/40 p-3 rounded-lg leading-relaxed">{aiResult.summary}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'expensive_recurring_rides', label: 'Expensive Recurring Rides', color: 'text-red-600', bg: 'bg-red-500/5', icon: RotateCcw },
                    { key: 'underused_vehicles', label: 'Underused Vehicles', color: 'text-amber-600', bg: 'bg-amber-500/5', icon: Car },
                    { key: 'route_waste', label: 'Route Waste', color: 'text-orange-600', bg: 'bg-orange-500/5', icon: Fuel },
                    { key: 'expensive_patterns', label: 'Expensive Patterns', color: 'text-purple-600', bg: 'bg-purple-500/5', icon: TrendingUp },
                  ].filter(({ key }) => aiResult[key]?.length > 0).map(({ key, label, color, bg, icon: Icon }) => (
                    <div key={key} className={`p-3 rounded-lg ${bg}`}>
                      <p className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 mb-2 ${color}`}>
                        <Icon className="w-3.5 h-3.5" />{label}
                      </p>
                      <ul className="space-y-1">
                        {aiResult[key].map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs">
                            <span className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${color.replace('text-', 'bg-')}`} />{item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {aiResult.fleet_expansion_signal && (
                  <div className={`p-3 rounded-lg border ${aiResult.fleet_expansion_signal.recommended ? 'bg-blue-500/5 border-blue-500/20' : 'bg-muted/30 border-border'}`}>
                    <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 mb-1 text-blue-600">
                      <Truck className="w-3.5 h-3.5" />Fleet Expansion Signal
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${aiResult.fleet_expansion_signal.recommended ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                        {aiResult.fleet_expansion_signal.recommended ? 'Expansion Justified' : 'Hold'}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">{aiResult.fleet_expansion_signal.rationale}</p>
                  </div>
                )}

                {aiResult.cost_optimization_actions?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />Cost Optimization Actions
                    </p>
                    <div className="space-y-1.5">
                      {aiResult.cost_optimization_actions.map((a, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 text-xs p-2 bg-muted/30 rounded">
                          <div>
                            <p className="font-medium">{a.action}</p>
                            <p className="text-muted-foreground">{a.impact}</p>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold shrink-0 ${a.priority === 'urgent' || a.priority === 'high' ? 'bg-red-500 text-white' : a.priority === 'medium' ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-700'}`}>
                            {a.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Breakdowns */}
      <Tabs defaultValue="client" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="client" className="text-xs gap-1.5"><User className="w-3.5 h-3.5" />By Client</TabsTrigger>
          <TabsTrigger value="program" className="text-xs gap-1.5"><BarChart3 className="w-3.5 h-3.5" />By Program</TabsTrigger>
          <TabsTrigger value="driver" className="text-xs gap-1.5"><Truck className="w-3.5 h-3.5" />By Driver</TabsTrigger>
          <TabsTrigger value="vehicle" className="text-xs gap-1.5"><Car className="w-3.5 h-3.5" />By Vehicle</TabsTrigger>
          <TabsTrigger value="funding" className="text-xs gap-1.5"><PiggyBank className="w-3.5 h-3.5" />By Funding</TabsTrigger>
          <TabsTrigger value="recurring" className="text-xs gap-1.5"><RefreshCw className="w-3.5 h-3.5" />Recurring</TabsTrigger>
        </TabsList>

        {/* By Client */}
        <TabsContent value="client">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Cost by Client</CardTitle></CardHeader>
            <CardContent className="p-0">
              <CostTable rows={clientRows} columns={[
                { key: 'name', label: 'Client' },
                { key: 'rides', label: 'Rides', right: true },
                { key: 'total', label: 'Total Cost', right: true, bold: true },
                { key: 'avg', label: 'Avg/Ride', right: true },
                { key: 'fuel', label: 'Fuel', right: true },
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Program Category */}
        <TabsContent value="program">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Cost by Program Category</CardTitle></CardHeader>
            <CardContent className="space-y-3 pt-2">
              {Object.entries(stats.byProgram).sort((a, b) => b[1] - a[1]).map(([name, amount]) => (
                <BarRow key={name} label={name} amount={amount} total={maxTotal} color="bg-primary" />
              ))}
              {Object.keys(stats.byProgram).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Driver */}
        <TabsContent value="driver">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Cost by Driver</CardTitle></CardHeader>
            <CardContent className="p-0">
              <CostTable rows={driverRows} columns={[
                { key: 'name', label: 'Driver' },
                { key: 'rides', label: 'Rides', right: true },
                { key: 'total', label: 'Total Cost', right: true, bold: true },
                { key: 'avg', label: 'Avg/Ride', right: true },
                { key: 'fuel', label: 'Fuel', right: true },
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Vehicle */}
        <TabsContent value="vehicle">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Cost & Utilization by Vehicle</CardTitle></CardHeader>
            <CardContent className="p-0">
              <CostTable rows={vehicleRows} columns={[
                { key: 'name', label: 'Vehicle' },
                { key: 'rides', label: 'Rides', right: true },
                { key: 'pct', label: '% of Rides', right: true },
                { key: 'total', label: 'Total Cost', right: true, bold: true },
                { key: 'avg', label: 'Avg/Ride', right: true },
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Funding */}
        <TabsContent value="funding">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Cost by Funding Source Type</CardTitle></CardHeader>
              <CardContent className="space-y-3 pt-2">
                {Object.entries(stats.byFundingType).sort((a, b) => b[1] - a[1]).map(([name, amount]) => (
                  <BarRow key={name} label={name} amount={amount} total={maxTotal} color="bg-accent" />
                ))}
                {Object.keys(stats.byFundingType).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No funding data yet</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Cost by Named Funding Source</CardTitle></CardHeader>
              <CardContent className="space-y-3 pt-2">
                {Object.entries(stats.byFundingName).sort((a, b) => b[1] - a[1]).map(([name, amount]) => (
                  <BarRow key={name} label={name} amount={amount} total={maxTotal} color="bg-purple-500" />
                ))}
                {Object.keys(stats.byFundingName).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No funding source names set</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* By Recurring Plan */}
        <TabsContent value="recurring">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cost by Recurring Ride Group</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Only rides marked as recurring with a linked plan are shown here.</p>
            </CardHeader>
            <CardContent className="p-0">
              {recurringRows.length > 0 ? (
                <CostTable rows={recurringRows} columns={[
                  { key: 'name', label: 'Recurring Plan' },
                  { key: 'rides', label: 'Rides', right: true },
                  { key: 'total', label: 'Total Cost', right: true, bold: true },
                  { key: 'avg', label: 'Avg/Ride', right: true },
                ]} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No recurring ride cost data yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}