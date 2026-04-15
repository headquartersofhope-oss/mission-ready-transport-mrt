import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Brain, Truck, BarChart3, UserX, UserCheck,
  Calendar, FileText, Database, MessageSquare,
  Loader2, Send, CheckCircle2, AlertTriangle, Zap
} from 'lucide-react';
import AiModuleShell from '@/components/ai/AiModuleShell';
import { ResultSection, BulletList, SeverityBadge, SummaryBox, ScoreBadge } from '@/components/ai/AiResultPanel';

// ─── DATA HELPERS ──────────────────────────────────────────────────────────

function buildDriverWorkloads(requests, drivers) {
  return drivers.filter(d => d.status === 'active').map(d => {
    const name = `${d.first_name} ${d.last_name}`;
    const assigned = requests.filter(r =>
      r.assigned_driver_name === name && !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status)
    );
    return {
      driver: name, driver_id: d.id, availability: d.availability,
      shift_schedule: d.shift_schedule, ride_count: assigned.length,
      on_time_rate: d.on_time_rate, incident_count: d.incident_count,
      rides: assigned.map(r => ({ id: r.id, date: r.request_date, time: r.pickup_time, participant: r.participant_name }))
    };
  });
}

function buildTimeBlocks(requests) {
  const blocks = { 'Before 7am': 0, '7-9am': 0, '9-11am': 0, '11am-1pm': 0, '1-3pm': 0, '3-5pm': 0, 'After 5pm': 0, 'No time set': 0 };
  requests.forEach(r => {
    if (!r.pickup_time) { blocks['No time set']++; return; }
    const [h] = r.pickup_time.split(':').map(Number);
    if (h < 7) blocks['Before 7am']++;
    else if (h < 9) blocks['7-9am']++;
    else if (h < 11) blocks['9-11am']++;
    else if (h < 13) blocks['11am-1pm']++;
    else if (h < 15) blocks['1-3pm']++;
    else if (h < 17) blocks['3-5pm']++;
    else blocks['After 5pm']++;
  });
  return blocks;
}

// ─── MODULE RENDERERS ──────────────────────────────────────────────────────

function DispatchResult({ r }) {
  return (
    <div className="space-y-5">
      <SummaryBox text={r.summary} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ResultSection title="Recommended Driver Assignments" items={r.driver_assignments} color="text-blue-600"
          renderItem={(item, i) => (
            <div key={i} className="flex items-start justify-between gap-2 py-1.5 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{item.participant_name}</p>
                <p className="text-xs text-muted-foreground">→ {item.recommended_driver}</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">{item.reason}</p>
              </div>
              <SeverityBadge level={item.confidence} />
            </div>
          )}
        />
        <ResultSection title="High-Risk Rides" items={r.high_risk_rides} color="text-red-600"
          renderItem={(item, i) => (
            <div key={i} className="py-1.5 border-b last:border-0">
              <p className="text-sm font-medium">{item.participant_name}</p>
              <p className="text-xs text-red-600">{item.risk}</p>
              <p className="text-xs text-muted-foreground mt-0.5">→ {item.action}</p>
            </div>
          )}
        />
        <ResultSection title="Trip Grouping Opportunities" items={r.grouping_opportunities} color="text-emerald-600"
          renderItem={(item, i) => (
            <div key={i} className="py-1.5 border-b last:border-0">
              <p className="text-xs font-medium">{item.rides?.join(', ')}</p>
              <p className="text-xs text-muted-foreground">{item.reason}</p>
              {item.estimated_savings && <p className="text-xs text-emerald-600 font-medium">{item.estimated_savings}</p>}
            </div>
          )}
        />
        <ResultSection title="Needs Escalation" items={r.escalation_needed} color="text-orange-600"
          renderItem={(item, i) => (
            <div key={i} className="py-1.5 border-b last:border-0">
              <p className="text-sm font-medium">{item.participant_name}</p>
              <p className="text-xs text-orange-600">{item.reason}</p>
            </div>
          )}
        />
      </div>
      {r.dispatch_order?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-purple-600">Recommended Dispatch Order</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            {r.dispatch_order.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-xs py-1 border-b last:border-0">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">{item.position}</span>
                <span className="font-medium">{item.participant_name}</span>
                <span className="text-muted-foreground">{item.reason}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LoadBalanceResult({ r }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <SummaryBox text={r.summary} />
        {r.balance_score !== undefined && <ScoreBadge score={r.balance_score} label="Balance Score" />}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ResultSection title="Overloaded Drivers" items={r.overloaded_drivers} color="text-red-600"
          renderItem={(item, i) => (
            <div key={i} className="py-1.5 border-b last:border-0">
              <p className="text-sm font-medium">{item.driver} <span className="text-red-500 font-bold">({item.ride_count} rides)</span></p>
              <p className="text-xs text-muted-foreground">{item.recommendation}</p>
            </div>
          )}
        />
        <ResultSection title="Underutilized Drivers" items={r.underutilized_drivers} color="text-amber-600"
          renderItem={(item, i) => (
            <div key={i} className="py-1.5 border-b last:border-0">
              <p className="text-sm font-medium">{item.driver} <span className="text-amber-500">({item.ride_count} rides)</span></p>
              <p className="text-xs text-muted-foreground">{item.recommendation}</p>
            </div>
          )}
        />
        <ResultSection title="Overloaded Time Blocks" items={r.overloaded_time_blocks} color="text-orange-600"
          renderItem={(item, i) => (
            <div key={i} className="py-1.5 border-b last:border-0">
              <p className="text-sm font-medium">{item.block} — {item.ride_count} rides</p>
              <p className="text-xs text-muted-foreground">{item.recommendation}</p>
            </div>
          )}
        />
        <ResultSection title="Rebalancing Actions" items={r.rebalancing_actions} color="text-blue-600"
          renderItem={(item, i) => (
            <div key={i} className="flex items-start justify-between gap-2 py-1.5 border-b last:border-0">
              <div>
                <p className="text-xs font-medium">{item.action}</p>
                <p className="text-xs text-muted-foreground">{item.impact}</p>
              </div>
              <SeverityBadge level={item.priority} />
            </div>
          )}
        />
      </div>
      {r.vehicle_activation_needed && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          {r.vehicle_recommendation}
        </div>
      )}
    </div>
  );
}

function NoShowResult({ r }) {
  return (
    <div className="space-y-5">
      <SummaryBox text={r.summary} />
      {r.patterns?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Detected Patterns</CardTitle></CardHeader>
          <CardContent><BulletList items={r.patterns} color="bg-purple-500" /></CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ResultSection title="High-Risk Clients" items={r.high_risk_clients} color="text-red-600"
          renderItem={(item, i) => (
            <div key={i} className="py-1.5 border-b last:border-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{item.name}</p>
                <SeverityBadge level={item.risk_level} />
              </div>
              <p className="text-xs text-red-600 mt-0.5">No-shows: {item.no_show_count}</p>
              {item.risk_factors?.length > 0 && <BulletList items={item.risk_factors} color="bg-red-400" />}
              <p className="text-xs text-muted-foreground mt-1 italic">→ {item.recommended_action}</p>
            </div>
          )}
        />
        <div className="space-y-4">
          <ResultSection title="Needs Confirmation Reminder" items={r.needs_confirmation_reminder} color="text-amber-600"
            renderItem={(item, i) => (
              <div key={i} className="py-1 border-b last:border-0 text-xs">
                <span className="font-medium">{item.name}</span> — {item.reason}
              </div>
            )}
          />
          <ResultSection title="Needs Case Manager Follow-Up" items={r.needs_case_manager_followup} color="text-purple-600"
            renderItem={(item, i) => (
              <div key={i} className="py-1 border-b last:border-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">{item.name}</p>
                  <span className="text-xs text-purple-600 font-medium">{item.urgency}</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.reason}</p>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}

function DriverPerfResult({ r }) {
  return (
    <div className="space-y-5">
      <SummaryBox text={r.summary} color="green" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ResultSection title="Strong Performers" items={r.strong_performers} color="text-emerald-600"
          renderItem={(item, i) => (
            <div key={i} className="py-1.5 border-b last:border-0">
              <p className="text-sm font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{item.driver}</p>
              <BulletList items={item.strengths} color="bg-emerald-500" />
            </div>
          )}
        />
        <ResultSection title="Needs Coaching" items={r.needs_coaching} color="text-orange-600"
          renderItem={(item, i) => (
            <div key={i} className="py-1.5 border-b last:border-0">
              <p className="text-sm font-medium">{item.driver}</p>
              <BulletList items={item.issues} color="bg-orange-400" />
              {item.coaching_focus && <p className="text-xs text-orange-600 font-medium mt-1">Focus: {item.coaching_focus}</p>}
            </div>
          )}
        />
        <ResultSection title="On-Time Concerns" items={r.on_time_concerns} color="text-amber-600"
          renderItem={(item, i) => (
            <div key={i} className="py-1.5 border-b last:border-0 text-xs">
              <span className="font-medium">{item.driver}</span> — {item.on_time_rate}% on-time
              <p className="text-muted-foreground">{item.context}</p>
            </div>
          )}
        />
        <ResultSection title="Cancellation Concerns" items={r.cancellation_concerns} color="text-red-600"
          renderItem={(item, i) => (
            <div key={i} className="py-1.5 border-b last:border-0 text-xs">
              <span className="font-medium">{item.driver}</span> — {item.cancellation_count} cancellations
              <p className="text-muted-foreground">{item.pattern}</p>
            </div>
          )}
        />
      </div>
    </div>
  );
}

function ScheduleQualityResult({ r }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <SummaryBox text={r.summary} />
        {r.overall_quality_score !== undefined && <ScoreBadge score={r.overall_quality_score} label="Quality Score" />}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ResultSection title="Sequencing Issues" items={r.sequencing_issues} color="text-orange-600"
          renderItem={(item, i) => (
            <div key={i} className="py-1.5 border-b last:border-0 text-xs">
              <p className="font-medium">{item.detail}</p>
              <p className="text-muted-foreground">{item.impact}</p>
              <p className="text-blue-600 mt-0.5">→ {item.fix}</p>
            </div>
          )}
        />
        <ResultSection title="Unrealistic Timings" items={r.unrealistic_timings} color="text-red-600"
          renderItem={(item, i) => (
            <div key={i} className="py-1.5 border-b last:border-0 text-xs">
              <p className="font-medium">{item.detail}</p>
              <p className="text-muted-foreground">{item.rides_affected}</p>
              <p className="text-blue-600 mt-0.5">→ {item.fix}</p>
            </div>
          )}
        />
        <ResultSection title="Trip Combination Opportunities" items={r.trip_combination_opportunities} color="text-emerald-600"
          renderItem={(item, i) => (
            <div key={i} className="py-1.5 border-b last:border-0 text-xs">
              <p className="font-medium">{item.rides?.join(' + ')}</p>
              <p className="text-muted-foreground">{item.rationale}</p>
              {item.time_savings && <p className="text-emerald-600 font-medium">{item.time_savings}</p>}
            </div>
          )}
        />
        <ResultSection title="Scheduling Conflicts" items={r.conflicts} color="text-red-600"
          renderItem={(item, i) => (
            <div key={i} className="py-1.5 border-b last:border-0 text-xs">
              <p className="font-medium">{item.detail}</p>
              <SeverityBadge level={item.severity} />
            </div>
          )}
        />
      </div>
    </div>
  );
}

function OpsSummaryResult({ r }) {
  return (
    <div className="space-y-5">
      {r.daily_summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Completed', value: r.daily_summary.completed, color: 'text-emerald-600', bg: 'bg-emerald-500/8' },
            { label: 'Missed', value: r.daily_summary.missed, color: 'text-red-600', bg: 'bg-red-500/8' },
            { label: 'No-Show', value: r.daily_summary.no_show, color: 'text-orange-600', bg: 'bg-orange-500/8' },
            { label: 'Cancelled', value: r.daily_summary.cancelled, color: 'text-slate-600', bg: 'bg-slate-500/8' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`p-3 rounded-xl ${bg} text-center`}>
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
            </div>
          ))}
        </div>
      )}
      {r.daily_summary?.narrative && <SummaryBox text={r.daily_summary.narrative} />}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {r.busiest_periods?.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-600">Busiest Periods</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {r.busiest_periods.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                  <span className="font-medium">{p.period}</span>
                  <span className="text-muted-foreground">{p.volume} rides{p.notes ? ` — ${p.notes}` : ''}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {r.recommended_prep_actions?.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-primary">Prep Actions</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {r.recommended_prep_actions.map((a, i) => (
                <div key={i} className="flex items-start justify-between gap-2 text-xs py-1 border-b last:border-0">
                  <div>
                    <p className="font-medium">{a.action}</p>
                    <p className="text-muted-foreground">Owner: {a.owner}</p>
                  </div>
                  <SeverityBadge level={a.urgency} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {r.top_risks_tomorrow?.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-red-600">Top Risks — Tomorrow</CardTitle></CardHeader>
            <CardContent><BulletList items={r.top_risks_tomorrow} color="bg-red-400" /></CardContent>
          </Card>
        )}
        {r.top_risks_next_week?.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-amber-600">Top Risks — Next Week</CardTitle></CardHeader>
            <CardContent><BulletList items={r.top_risks_next_week} color="bg-amber-400" /></CardContent>
          </Card>
        )}
      </div>
      {r.week_outlook && <SummaryBox text={r.week_outlook} color="amber" />}
    </div>
  );
}

function DataCleanupResult({ r }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <SummaryBox text={r.summary} />
        {r.data_quality_score !== undefined && <ScoreBadge score={r.data_quality_score} label="Data Quality" />}
      </div>
      {r.top_cleanup_actions?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-primary">Top Cleanup Actions</CardTitle></CardHeader>
          <CardContent><BulletList items={r.top_cleanup_actions} color="bg-primary" /></CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ResultSection title="Possible Duplicate Clients" items={r.possible_duplicate_clients} color="text-orange-600"
          renderItem={(item, i) => (
            <div key={i} className="py-1.5 border-b last:border-0 text-xs">
              <p className="font-medium">{item.names?.join(' / ')}</p>
              <p className="text-muted-foreground">{item.reason}</p>
              <p className="text-blue-600">→ {item.action}</p>
            </div>
          )}
        />
        <ResultSection title="Incomplete Client Records" items={r.incomplete_client_records} color="text-amber-600"
          renderItem={(item, i) => (
            <div key={i} className="py-1.5 border-b last:border-0 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.name}</span>
                <span className="text-amber-600 font-medium">{item.priority}</span>
              </div>
              <p className="text-muted-foreground">Missing: {item.missing_fields?.join(', ')}</p>
            </div>
          )}
        />
        <ResultSection title="Records Needing Review" items={r.records_needing_review} color="text-purple-600"
          renderItem={(item, i) => (
            <div key={i} className="py-1.5 border-b last:border-0 text-xs">
              <span className="font-medium">{item.name}</span>
              <p className="text-muted-foreground">{item.reason}</p>
            </div>
          )}
        />
        <ResultSection title="Possible Duplicate Rides" items={r.possible_duplicate_rides} color="text-red-600"
          renderItem={(item, i) => (
            <div key={i} className="py-1.5 border-b last:border-0 text-xs">
              <p className="font-medium">{item.detail}</p>
              <p className="text-muted-foreground">{item.reason}</p>
            </div>
          )}
        />
      </div>
    </div>
  );
}

function QueryPanel({ requests, drivers, vehicles, participants, incidents, recurringPlans }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const SAMPLE_QUERIES = [
    'Which drivers are overloaded this week?',
    'Which clients missed the most rides this month?',
    'Which recurring rides consume the most capacity?',
    'What vehicles are underused?',
    'What issues must be fixed before tomorrow?',
    'Which rides are highest risk for delay?',
  ];

  const handleQuery = async (q) => {
    const question = q || query;
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);
    const systemData = {
      requests: requests.slice(0, 150).map(r => ({
        id: r.id, participant: r.participant_name, date: r.request_date, time: r.pickup_time,
        status: r.status, priority: r.priority, driver: r.assigned_driver_name, vehicle: r.assigned_vehicle_name,
        purpose: r.purpose, program_category: r.program_category, funding_source: r.funding_source,
        funding_source_type: r.funding_source_type, actual_cost: r.actual_cost, estimated_cost: r.estimated_cost,
        is_billable: r.is_billable, is_recurring: r.is_recurring,
      })),
      drivers: drivers.map(d => ({
        name: `${d.first_name} ${d.last_name}`, status: d.status, availability: d.availability,
        on_time_rate: d.on_time_rate, license_status: d.license_status,
        ride_count: requests.filter(r => r.assigned_driver_name === `${d.first_name} ${d.last_name}`).length
      })),
      vehicles: vehicles.map(v => ({
        id: v.vehicle_id, name: v.nickname || `${v.make} ${v.model}`,
        status: v.service_status, capacity: v.seat_capacity, wheelchair: v.wheelchair_accessible,
        rides: requests.filter(r => r.assigned_vehicle_id === v.id).length
      })),
      participants: participants.map(p => ({
        name: `${p.first_name} ${p.last_name}`, no_shows: p.no_show_count,
        cancellations: p.cancellation_count, total_rides: p.total_rides_completed,
        reliability: p.reliability_rating, status: p.status, mobility_needs: p.mobility_needs
      })),
      recurringPlans: recurringPlans.filter(p => p.status === 'active').map(p => ({
        participant: p.participant_name, purpose: p.purpose, days: p.weekday_pattern,
        status: p.status, funding: p.funding_source
      })),
      summary: {
        totalRequests: requests.length,
        completedRides: requests.filter(r => r.status === 'completed').length,
        openIncidents: incidents.filter(i => ['open', 'under_review'].includes(i.status)).length,
        unassignedRides: requests.filter(r => ['approved', 'scheduled'].includes(r.status) && !r.assigned_driver_id).length,
        totalCost: requests.filter(r => r.status === 'completed').reduce((s, r) => s + (r.actual_cost || r.estimated_cost || 0), 0),
      }
    };
    const res = await base44.functions.invoke('aiOpsIntelligence', { mode: 'ops_query', data: { systemData, question } });
    setResult(res.data);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <MessageSquare className="w-4.5 h-4.5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-base">AI Operations Query</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Ask structured questions about your live operational data. Not a chatbot — an intelligence layer.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SAMPLE_QUERIES.map(q => (
          <button key={q} onClick={() => { setQuery(q); handleQuery(q); }}
            className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted transition-colors hover:border-primary/40">
            {q}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ask anything about your operations data…"
          className="min-h-[60px] text-sm resize-none"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuery(); } }}
        />
        <Button onClick={() => handleQuery()} disabled={loading || !query.trim()} className="shrink-0 gap-1.5 self-end">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Ask
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 p-6 text-muted-foreground justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Analyzing your data…</span>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-3">
          {result.direct_answer && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <p className="text-xs font-bold uppercase tracking-wide text-primary mb-2">Answer</p>
              <p className="text-sm leading-relaxed">{result.direct_answer}</p>
            </div>
          )}
          {result.supporting_data?.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Supporting Data</CardTitle></CardHeader>
              <CardContent><BulletList items={result.supporting_data} color="bg-blue-400" /></CardContent>
            </Card>
          )}
          {result.action_items?.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-emerald-600">Action Items</CardTitle></CardHeader>
              <CardContent><BulletList items={result.action_items} color="bg-emerald-500" /></CardContent>
            </Card>
          )}
          {result.related_concerns?.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-amber-600">Related Concerns</CardTitle></CardHeader>
              <CardContent><BulletList items={result.related_concerns} color="bg-amber-400" /></CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────

export default function AiIntelligence() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const { data: requests = [] } = useQuery({ queryKey: ['transport-requests'], queryFn: () => base44.entities.TransportRequest.list('-created_date', 1000) });
  const { data: drivers = [] } = useQuery({ queryKey: ['drivers'], queryFn: () => base44.entities.Driver.list('first_name', 200) });
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: () => base44.entities.Vehicle.list('nickname', 100) });
  const { data: participants = [] } = useQuery({ queryKey: ['participants'], queryFn: () => base44.entities.Participant.list('-created_date', 500) });
  const { data: incidents = [] } = useQuery({ queryKey: ['incidents'], queryFn: () => base44.entities.Incident.list('-created_date', 200) });
  const { data: recurringPlans = [] } = useQuery({ queryKey: ['recurring-plans'], queryFn: () => base44.entities.RecurringTransportPlan.list('-created_date', 200) });

  const run = async (mode, payload) => {
    setLoading(l => ({ ...l, [mode]: true }));
    const res = await base44.functions.invoke('aiOpsIntelligence', { mode, data: payload });
    setResults(r => ({ ...r, [mode]: res.data }));
    setLoading(l => ({ ...l, [mode]: false }));
  };

  const openRides = requests.filter(r => !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status)).slice(0, 40);
  const driverWorkloads = useMemo(() => buildDriverWorkloads(requests, drivers), [requests, drivers]);
  const timeBlocks = useMemo(() => buildTimeBlocks(requests), [requests]);
  const activeDrivers = drivers.filter(d => d.status === 'active');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Operations Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Live AI analysis of dispatch, drivers, scheduling, and client data — not generic, tied to your actual records.</p>
        </div>
      </div>

      <Tabs defaultValue="dispatch" className="space-y-5">
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="dispatch" className="gap-1.5 text-xs"><Truck className="w-3.5 h-3.5" />Dispatch</TabsTrigger>
          <TabsTrigger value="load" className="gap-1.5 text-xs"><BarChart3 className="w-3.5 h-3.5" />Load Balance</TabsTrigger>
          <TabsTrigger value="noshow" className="gap-1.5 text-xs"><UserX className="w-3.5 h-3.5" />No-Show Risk</TabsTrigger>
          <TabsTrigger value="drivers" className="gap-1.5 text-xs"><UserCheck className="w-3.5 h-3.5" />Driver Review</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5 text-xs"><Calendar className="w-3.5 h-3.5" />Schedule Quality</TabsTrigger>
          <TabsTrigger value="summary" className="gap-1.5 text-xs"><FileText className="w-3.5 h-3.5" />Ops Summary</TabsTrigger>
          <TabsTrigger value="cleanup" className="gap-1.5 text-xs"><Database className="w-3.5 h-3.5" />Data Cleanup</TabsTrigger>
          <TabsTrigger value="query" className="gap-1.5 text-xs"><MessageSquare className="w-3.5 h-3.5" />AI Query</TabsTrigger>
        </TabsList>

        {/* 1. Dispatch Assistant */}
        <TabsContent value="dispatch">
          <AiModuleShell title="AI Dispatch Assistant" icon={Truck} runLabel="Analyze Open Rides"
            description="Reviews open rides and recommends driver/vehicle assignments, dispatch order, risk flags, and trip groupings."
            onRun={() => run('dispatch_assistant', {
              openRides: openRides.map(r => ({
                id: r.id, participant_name: r.participant_name, date: r.request_date, time: r.pickup_time,
                pickup: r.pickup_location, dropoff: r.dropoff_location, priority: r.priority, status: r.status,
                purpose: r.purpose, mobility_needs: r.special_instructions, return_trip: r.return_trip,
                funding_source: r.funding_source, is_billable: r.is_billable
              })),
              drivers: activeDrivers.map(d => ({
                id: d.id, name: `${d.first_name} ${d.last_name}`, availability: d.availability,
                vehicle: d.assigned_vehicle_name, shift: d.shift_schedule, on_time_rate: d.on_time_rate,
                license_status: d.license_status, service_area: d.service_area
              })),
              vehicles: vehicles.filter(v => v.service_status === 'available' && v.status === 'active').map(v => ({
                id: v.id, name: v.nickname || `${v.make} ${v.model}`, capacity: v.seat_capacity,
                wheelchair: v.wheelchair_accessible, assigned_driver: v.assigned_driver_name
              }))
            })}
            loading={loading.dispatch_assistant} hasResult={!!results.dispatch_assistant}>
            {results.dispatch_assistant && <DispatchResult r={results.dispatch_assistant} />}
          </AiModuleShell>
        </TabsContent>

        {/* 2. Load Balance */}
        <TabsContent value="load">
          <AiModuleShell title="AI Load Balancing" icon={BarChart3} runLabel="Analyze Workload Distribution"
            description="Evaluates ride volume, time blocks, and driver capacity to recommend balanced assignments and flag stress points."
            onRun={() => run('load_balance', {
              driverWorkloads,
              vehicleUtilization: vehicles.map(v => ({ id: v.vehicle_id, name: v.nickname || `${v.make} ${v.model}`, status: v.service_status, rides_assigned: requests.filter(r => r.assigned_vehicle_id === v.id && !['completed', 'cancelled'].includes(r.status)).length })),
              timeBlocks,
            })}
            loading={loading.load_balance} hasResult={!!results.load_balance}>
            {results.load_balance && <LoadBalanceResult r={results.load_balance} />}
          </AiModuleShell>
        </TabsContent>

        {/* 3. No-Show Risk */}
        <TabsContent value="noshow">
          <AiModuleShell title="AI No-Show Risk Flagging" icon={UserX} runLabel="Analyze Client Risk"
            description="Analyzes client ride history to identify high-risk riders, flag patterns, and recommend proactive outreach."
            onRun={() => run('noshow_risk', {
              clientHistory: participants.map(p => ({
                name: `${p.first_name} ${p.last_name}`,
                no_show_count: p.no_show_count || 0, cancellation_count: p.cancellation_count || 0,
                total_rides: p.total_rides_completed || 0, reliability: p.reliability_rating,
                preferred_communication: p.preferred_communication, status: p.status,
                case_manager: p.case_manager, mobility_needs: p.mobility_needs
              }))
            })}
            loading={loading.noshow_risk} hasResult={!!results.noshow_risk}>
            {results.noshow_risk && <NoShowResult r={results.noshow_risk} />}
          </AiModuleShell>
        </TabsContent>

        {/* 4. Driver Performance */}
        <TabsContent value="drivers">
          <AiModuleShell title="AI Driver Performance Review" icon={UserCheck} runLabel="Review Driver Performance"
            description="Analyzes driver stats to surface strong performers, coaching opportunities, on-time issues, and cancellation patterns."
            onRun={() => run('driver_performance', {
              driverStats: drivers.map(d => ({
                driver: `${d.first_name} ${d.last_name}`, status: d.status, availability: d.availability,
                on_time_rate: d.on_time_rate || 100, incident_count: d.incident_count || 0,
                cancellation_count: d.cancellation_count || 0, total_rides: d.total_rides_completed || 0,
                license_status: d.license_status, shift_schedule: d.shift_schedule,
                recent_rides: requests.filter(r => r.assigned_driver_name === `${d.first_name} ${d.last_name}`).slice(-10).map(r => ({ date: r.request_date, status: r.status, time: r.pickup_time }))
              }))
            })}
            loading={loading.driver_performance} hasResult={!!results.driver_performance}>
            {results.driver_performance && <DriverPerfResult r={results.driver_performance} />}
          </AiModuleShell>
        </TabsContent>

        {/* 5. Schedule Quality */}
        <TabsContent value="schedule">
          <AiModuleShell title="AI Schedule Quality Review" icon={Calendar} runLabel="Review Schedule Quality"
            description="Reviews the current ride board for sequencing issues, unrealistic timings, conflicts, and combination opportunities."
            onRun={() => run('schedule_quality', {
              schedule: {
                rides: openRides.map(r => ({ id: r.id, participant: r.participant_name, date: r.request_date, pickup_time: r.pickup_time, appointment_time: r.appointment_time, driver: r.assigned_driver_name, pickup: r.pickup_location, dropoff: r.dropoff_location, return_trip: r.return_trip, return_time: r.return_pickup_time })),
                driver_count: activeDrivers.length,
                time_block_distribution: timeBlocks
              }
            })}
            loading={loading.schedule_quality} hasResult={!!results.schedule_quality}>
            {results.schedule_quality && <ScheduleQualityResult r={results.schedule_quality} />}
          </AiModuleShell>
        </TabsContent>

        {/* 6. Ops Summary */}
        <TabsContent value="summary">
          <AiModuleShell title="AI Operations Summary" icon={FileText} runLabel="Generate Ops Summary"
            description="Generates a daily/weekly executive summary with volume, trends, driver and vehicle stress points, and forward-looking risks."
            onRun={() => run('ops_summary', {
              opsData: {
                total_requests: requests.length,
                completed: requests.filter(r => r.status === 'completed').length,
                missed: requests.filter(r => r.status === 'no_show').length,
                cancelled: requests.filter(r => r.status === 'cancelled').length,
                denied: requests.filter(r => r.status === 'denied').length,
                in_progress: requests.filter(r => ['en_route', 'rider_picked_up', 'in_progress'].includes(r.status)).length,
                open_incidents: incidents.filter(i => ['open', 'under_review'].includes(i.status)).length,
                active_recurring_plans: recurringPlans.filter(p => p.status === 'active').length,
                driver_workloads: driverWorkloads.map(d => ({ driver: d.driver, ride_count: d.ride_count, on_time_rate: d.on_time_rate })),
                time_block_distribution: timeBlocks,
                purpose_distribution: (() => { const pb = {}; requests.forEach(r => { if (r.purpose) pb[r.purpose] = (pb[r.purpose] || 0) + 1; }); return pb; })(),
                high_priority_open: requests.filter(r => r.priority === 'urgent' && !['completed', 'cancelled', 'denied', 'no_show'].includes(r.status)).length
              }
            })}
            loading={loading.ops_summary} hasResult={!!results.ops_summary}>
            {results.ops_summary && <OpsSummaryResult r={results.ops_summary} />}
          </AiModuleShell>
        </TabsContent>

        {/* 7. Data Cleanup */}
        <TabsContent value="cleanup">
          <AiModuleShell title="AI Data Cleanup Support" icon={Database} runLabel="Analyze Data Quality"
            description="Uses AI to identify duplicate clients, incomplete records, duplicate rides, and inconsistencies needing review."
            onRun={() => run('data_cleanup', {
              clientRecords: participants.map(p => ({ id: p.id, name: `${p.first_name} ${p.last_name}`, phone: p.phone, email: p.email, pickup_address: p.pickup_address, case_manager: p.case_manager, no_show_count: p.no_show_count, status: p.status, mobility_needs: p.mobility_needs, notes: p.notes })),
              recentRides: requests.slice(0, 80).map(r => ({ id: r.id, participant: r.participant_name, date: r.request_date, time: r.pickup_time, pickup: r.pickup_location, dropoff: r.dropoff_location, purpose: r.purpose, status: r.status }))
            })}
            loading={loading.data_cleanup} hasResult={!!results.data_cleanup}>
            {results.data_cleanup && <DataCleanupResult r={results.data_cleanup} />}
          </AiModuleShell>
        </TabsContent>

        {/* 8. AI Query */}
        <TabsContent value="query">
          <QueryPanel requests={requests} drivers={drivers} vehicles={vehicles} participants={participants} incidents={incidents} recurringPlans={recurringPlans} />
        </TabsContent>
      </Tabs>
    </div>
  );
}