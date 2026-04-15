import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, AlertTriangle, Activity, Loader2, Zap, Clock, MapPin, MessageSquare, Navigation } from 'lucide-react';

function StatusBadge({ status }) {
  const variants = {
    operational: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2, label: 'Operational' },
    degraded: { bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertTriangle, label: 'Degraded' },
    at_risk: { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertCircle, label: 'At Risk' },
    not_configured: { bg: 'bg-slate-100', text: 'text-slate-700', icon: AlertCircle, label: 'Not Configured' },
  };
  const v = variants[status] || variants.operational;
  const Icon = v.icon;
  return (
    <Badge className={`${v.bg} ${v.text} gap-1`}>
      <Icon className="w-3 h-3" /> {v.label}
    </Badge>
  );
}

function DiagnosticCard({ title, icon: Icon, status, issues, warnings }) {
  return (
    <Card className={`${status === 'at_risk' ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : status === 'degraded' ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/20' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            <CardTitle className="text-sm">{title}</CardTitle>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {issues.length > 0 && (
          <div className="space-y-1">
            <p className="font-semibold text-red-700 dark:text-red-400 text-xs uppercase">Issues</p>
            {issues.map((issue, idx) => (
              <div key={idx} className="flex items-start gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span className="text-xs">{issue}</span>
              </div>
            ))}
          </div>
        )}
        {warnings.length > 0 && (
          <div className="space-y-1">
            <p className="font-semibold text-amber-700 dark:text-amber-400 text-xs uppercase">Warnings</p>
            {warnings.map((warning, idx) => (
              <div key={idx} className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span className="text-xs">{warning}</span>
              </div>
            ))}
          </div>
        )}
        {issues.length === 0 && warnings.length === 0 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> All systems nominal
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function OperationsDiagnostic() {
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);
  const [error, setError] = useState(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('transportationDiagnostics', {});
      setDiagnostics(res.data);
    } catch (err) {
      setError(err.message || 'Diagnostics failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" /> Operations Diagnostic Center
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">System health check and readiness assessment for live dispatch operations</p>
      </div>

      {!diagnostics ? (
        <Card className="p-8 text-center">
          <Button onClick={runDiagnostics} disabled={loading} size="lg" className="gap-2">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Running Diagnostics...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" /> Run Full Transportation Diagnostic
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-3">Analyzes dispatch readiness, assignment quality, route planning, notifications, GPS tracking, and rider communication systems.</p>
        </Card>
      ) : (
        <>
          {/* Overall Status */}
          <Card className={`${diagnostics.overall_status === 'at_risk' ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Overall System Status</CardTitle>
                <StatusBadge status={diagnostics.overall_status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-muted/40 rounded-lg text-center">
                  <p className="text-2xl font-bold">{diagnostics.data_coverage.total_requests}</p>
                  <p className="text-xs text-muted-foreground">Requests</p>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg text-center">
                  <p className="text-2xl font-bold">{diagnostics.data_coverage.total_drivers}</p>
                  <p className="text-xs text-muted-foreground">Drivers</p>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg text-center">
                  <p className="text-2xl font-bold">{diagnostics.data_coverage.total_vehicles}</p>
                  <p className="text-xs text-muted-foreground">Vehicles</p>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg text-center">
                  <p className="text-2xl font-bold">{diagnostics.data_coverage.total_participants}</p>
                  <p className="text-xs text-muted-foreground">Riders</p>
                </div>
              </div>
              <p className="text-sm">
                {diagnostics.ready_for_live_dispatch ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> ✓ Ready for live dispatch operations
                  </span>
                ) : (
                  <span className="text-orange-600 dark:text-orange-400 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Resolve issues before live dispatch
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Diagnostic Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DiagnosticCard
              title="Dispatch Health"
              icon={Zap}
              status={diagnostics.dispatch_health.status}
              issues={diagnostics.dispatch_health.issues}
              warnings={diagnostics.dispatch_health.warnings}
            />
            <DiagnosticCard
              title="Assignment Quality"
              icon={Clock}
              status={diagnostics.assignment_quality.status}
              issues={diagnostics.assignment_quality.issues}
              warnings={diagnostics.assignment_quality.warnings}
            />
            <DiagnosticCard
              title="Route Planning"
              icon={MapPin}
              status={diagnostics.route_health.status}
              issues={diagnostics.route_health.issues}
              warnings={diagnostics.route_health.warnings}
            />
            <DiagnosticCard
              title="Notifications"
              icon={MessageSquare}
              status={diagnostics.notification_readiness.status}
              issues={diagnostics.notification_readiness.issues}
              warnings={diagnostics.notification_readiness.warnings}
            />
            <DiagnosticCard
              title="GPS/Location Tracking"
              icon={Navigation}
              status={diagnostics.gps_tracking_readiness.status}
              issues={diagnostics.gps_tracking_readiness.issues}
              warnings={diagnostics.gps_tracking_readiness.warnings}
            />
            <DiagnosticCard
              title="Rider Communication"
              icon={MessageSquare}
              status={diagnostics.rider_communication_readiness.status}
              issues={diagnostics.rider_communication_readiness.issues}
              warnings={diagnostics.rider_communication_readiness.warnings}
            />
          </div>

          {/* Recommendations */}
          {diagnostics.recommendations.length > 0 && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="text-sm">Recommended Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {diagnostics.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <span className="text-blue-700 dark:text-blue-300">{rec}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Button onClick={runDiagnostics} disabled={loading} variant="outline" className="gap-2">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Re-running...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" /> Re-run Diagnostics
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}