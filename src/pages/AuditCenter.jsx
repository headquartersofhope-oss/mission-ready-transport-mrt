import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck, Play, Loader2, Brain, AlertTriangle,
  CheckCircle2, Target, TrendingUp, Filter, RefreshCw
} from 'lucide-react';
import { runFullDiagnostic } from '@/lib/auditEngine';
import ScoreGauge from '@/components/audit/ScoreGauge';
import IssueCard from '@/components/audit/IssueCard';
import AuditSummaryBar from '@/components/audit/AuditSummaryBar';

const MODULE_OPTIONS = ['all', 'dispatch', 'scheduling', 'drivers', 'vehicles', 'clients', 'incidents', 'data_quality'];
const SEV_OPTIONS = ['all', 'critical', 'high', 'medium', 'low'];

const riskColors = {
  low: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  moderate: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  elevated: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const readinessColor = (v) => {
  if (!v) return 'text-muted-foreground';
  if (v.startsWith('ready')) return 'text-emerald-600';
  if (v.startsWith('at risk')) return 'text-amber-500';
  return 'text-red-500';
};

function AiInsightSection({ aiResult, loading }) {
  if (loading) return (
    <div className="flex items-center gap-3 p-6 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">AI is analyzing system patterns…</span>
    </div>
  );
  if (!aiResult) return (
    <div className="p-6 text-center text-muted-foreground text-sm">
      Run the AI Audit to get intelligent analysis and pattern detection.
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Executive Summary */}
      <div className={`p-4 rounded-xl border ${riskColors[aiResult.risk_level] || riskColors.moderate}`}>
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wide">AI Executive Summary</span>
          <Badge className={`ml-auto text-xs border ${riskColors[aiResult.risk_level]}`}>
            Risk: {aiResult.risk_level}
          </Badge>
        </div>
        <p className="text-sm leading-relaxed">{aiResult.executive_summary}</p>
      </div>

      {/* Readiness Assessment */}
      {aiResult.readiness_assessment && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Readiness Assessment</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {Object.entries(aiResult.readiness_assessment).map(([area, assessment]) => (
                <div key={area} className="p-3 bg-muted/40 rounded-lg">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 capitalize">{area}</p>
                  <p className={`text-xs font-bold ${readinessColor(assessment?.toLowerCase())}`}>
                    {typeof assessment === 'string' ? assessment : JSON.stringify(assessment)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 5 Priorities */}
      {aiResult.top_5_priorities?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Top 5 Priorities to Resolve</CardTitle></CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {aiResult.top_5_priorities.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm">{p}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Detail Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: 'dispatch_bottlenecks', label: 'Dispatch Bottlenecks', color: 'text-orange-600' },
          { key: 'overload_risks', label: 'Overload Risks', color: 'text-red-600' },
          { key: 'data_quality_concerns', label: 'Data Quality Concerns', color: 'text-amber-600' },
          { key: 'service_gap_risks', label: 'Service Gap Risks', color: 'text-purple-600' },
          { key: 'operational_patterns', label: 'Operational Patterns', color: 'text-blue-600' },
        ].map(({ key, label, color }) => {
          const items = aiResult[key] || [];
          if (items.length === 0) return null;
          return (
            <Card key={key}>
              <CardHeader className="pb-2"><CardTitle className={`text-sm ${color}`}>{label}</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-current mt-1.5 shrink-0 opacity-60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function AuditCenter() {
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [runningAi, setRunningAi] = useState(false);
  const [moduleFilter, setModuleFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const { data: requests = [] } = useQuery({ queryKey: ['transport-requests'], queryFn: () => base44.entities.TransportRequest.list('-created_date', 1000) });
  const { data: drivers = [] } = useQuery({ queryKey: ['drivers'], queryFn: () => base44.entities.Driver.list('first_name', 200) });
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: () => base44.entities.Vehicle.list('nickname', 100) });
  const { data: participants = [] } = useQuery({ queryKey: ['participants'], queryFn: () => base44.entities.Participant.list('-created_date', 500) });
  const { data: incidents = [] } = useQuery({ queryKey: ['incidents'], queryFn: () => base44.entities.Incident.list('-created_date', 200) });
  const { data: recurringPlans = [] } = useQuery({ queryKey: ['recurring-plans'], queryFn: () => base44.entities.RecurringTransportPlan.list('-created_date', 200) });

  const handleRunDiagnostic = () => {
    setRunning(true);
    setTimeout(() => {
      const result = runFullDiagnostic({ requests, drivers, vehicles, participants, incidents, recurringPlans });
      setDiagnosticResult(result);
      setRunning(false);
    }, 800);
  };

  const handleRunAiAudit = async () => {
    setRunningAi(true);
    const issues = diagnosticResult?.issues || runFullDiagnostic({ requests, drivers, vehicles, participants, incidents, recurringPlans }).issues;
    const systemSummary = {
      totalRequests: requests.length,
      activeDrivers: drivers.filter(d => d.status === 'active').length,
      availableVehicles: vehicles.filter(v => v.service_status === 'available').length,
      totalParticipants: participants.length,
      openIncidents: incidents.filter(i => ['open', 'under_review'].includes(i.status)).length,
      issueCount: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      highIssues: issues.filter(i => i.severity === 'high').length,
      issuesByModule: Object.fromEntries(
        ['dispatch', 'scheduling', 'drivers', 'vehicles', 'clients', 'data_quality', 'incidents'].map(m => [m, issues.filter(i => i.module === m).length])
      ),
      noShowParticipants: participants.filter(p => (p.no_show_count || 0) >= 3).length,
      unassignedRides: requests.filter(r => ['approved', 'scheduled'].includes(r.status) && !r.assigned_driver_id).length,
      purposeBreakdown: (() => {
        const pb = {};
        requests.forEach(r => { if (r.purpose) pb[r.purpose] = (pb[r.purpose] || 0) + 1; });
        return pb;
      })(),
    };
    const res = await base44.functions.invoke('runAiAudit', { systemSummary });
    setAiResult(res.data);
    setRunningAi(false);
  };

  const filteredIssues = useMemo(() => {
    if (!diagnosticResult) return [];
    return diagnosticResult.issues.filter(i => {
      if (moduleFilter !== 'all' && i.module !== moduleFilter) return false;
      if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
      return true;
    });
  }, [diagnosticResult, moduleFilter, severityFilter]);

  const scores = diagnosticResult?.scores;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Audit & Diagnostics Center</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Self-check, self-report, and tighten the system before breakdowns happen in live operations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRunDiagnostic} disabled={running} variant="outline" className="gap-2">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? 'Running…' : 'Run Full Diagnostic'}
          </Button>
          <Button onClick={handleRunAiAudit} disabled={runningAi} className="gap-2">
            {runningAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {runningAi ? 'Analyzing…' : 'AI Audit'}
          </Button>
        </div>
      </div>

      {/* Quick-launch if nothing run yet */}
      {!diagnosticResult && !aiResult && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">Platform Audit Ready</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Run a Full Diagnostic to check for scheduling conflicts, missing data, compliance gaps, and operational risks.
                Then run the AI Audit for intelligent pattern detection and prioritized recommendations.
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleRunDiagnostic} disabled={running} variant="outline" size="lg" className="gap-2">
                <Play className="w-4 h-4" /> Run Full Diagnostic
              </Button>
              <Button onClick={handleRunAiAudit} disabled={runningAi} size="lg" className="gap-2">
                <Brain className="w-4 h-4" /> Run AI Audit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scores */}
      {scores && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Platform Health Scores</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <ScoreGauge label="Overall Health" score={scores.overall} size="lg" />
            <ScoreGauge label="Dispatch Readiness" score={scores.dispatch} />
            <ScoreGauge label="Driver Readiness" score={scores.driverReadiness} />
            <ScoreGauge label="Vehicle Readiness" score={scores.vehicleReadiness} />
            <ScoreGauge label="Scheduling Quality" score={scores.scheduling} />
            <ScoreGauge label="Client Data Quality" score={scores.clientQuality} />
          </div>
        </div>
      )}

      {/* Tabs */}
      {(diagnosticResult || aiResult) && (
        <Tabs defaultValue={diagnosticResult ? 'issues' : 'ai'} className="space-y-4">
          <TabsList>
            <TabsTrigger value="issues">
              Issues {diagnosticResult && `(${diagnosticResult.issues.length})`}
            </TabsTrigger>
            <TabsTrigger value="ai">
              AI Insights {aiResult && <span className="ml-1 w-2 h-2 rounded-full bg-primary inline-block" />}
            </TabsTrigger>
            <TabsTrigger value="summary">System Summary</TabsTrigger>
          </TabsList>

          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-4">
            {diagnosticResult && (
              <>
                <AuditSummaryBar issues={diagnosticResult.issues} runAt={diagnosticResult.runAt} />

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={moduleFilter} onValueChange={setModuleFilter}>
                    <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Module" /></SelectTrigger>
                    <SelectContent>
                      {MODULE_OPTIONS.map(m => (
                        <SelectItem key={m} value={m} className="capitalize">{m === 'all' ? 'All Modules' : m.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Severity" /></SelectTrigger>
                    <SelectContent>
                      {SEV_OPTIONS.map(s => (
                        <SelectItem key={s} value={s} className="capitalize">{s === 'all' ? 'All Severity' : s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(moduleFilter !== 'all' || severityFilter !== 'all') && (
                    <button onClick={() => { setModuleFilter('all'); setSeverityFilter('all'); }} className="text-xs text-muted-foreground hover:text-foreground underline">
                      Clear
                    </button>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">{filteredIssues.length} shown</span>
                </div>

                <div className="space-y-3">
                  {filteredIssues
                    .sort((a, b) => {
                      const order = { critical: 0, high: 1, medium: 2, low: 3 };
                      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
                    })
                    .map(issue => <IssueCard key={issue.id} issue={issue} />)
                  }
                  {filteredIssues.length === 0 && (
                    <div className="flex items-center gap-2 p-6 text-center text-muted-foreground">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                      <p className="text-sm">No issues match the current filters.</p>
                    </div>
                  )}
                </div>
              </>
            )}
            {!diagnosticResult && (
              <div className="text-center text-muted-foreground text-sm py-10">Run the Full Diagnostic to see issues.</div>
            )}
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="ai">
            <AiInsightSection aiResult={aiResult} loading={runningAi} />
          </TabsContent>

          {/* System Summary Tab */}
          <TabsContent value="summary">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Total Ride Requests', value: requests.length },
                { label: 'Active Drivers', value: drivers.filter(d => d.status === 'active').length },
                { label: 'Vehicles in Service', value: vehicles.filter(v => v.status === 'active').length },
                { label: 'Available Vehicles', value: vehicles.filter(v => v.service_status === 'available').length },
                { label: 'Active Clients', value: participants.filter(p => p.status === 'active').length },
                { label: 'Open Incidents', value: incidents.filter(i => ['open', 'under_review'].includes(i.status)).length },
                { label: 'Active Recurring Plans', value: recurringPlans.filter(p => p.status === 'active').length },
                { label: 'Clients with 3+ No-Shows', value: participants.filter(p => (p.no_show_count || 0) >= 3).length },
                { label: 'Unassigned Approved Rides', value: requests.filter(r => r.status === 'approved' && !r.assigned_driver_id).length },
                { label: 'Completed Rides (All Time)', value: requests.filter(r => r.status === 'completed').length },
                { label: 'Drivers with Expired License', value: drivers.filter(d => d.license_status === 'expired').length },
                { label: 'Vehicles Overdue Maintenance', value: vehicles.filter(v => v.maintenance_due_date && new Date(v.maintenance_due_date) < new Date()).length },
              ].map(({ label, value }) => (
                <Card key={label} className="p-4">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                  <p className="text-2xl font-bold mt-1">{value}</p>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}