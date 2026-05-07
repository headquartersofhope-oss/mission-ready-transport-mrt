import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, AlertTriangle, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ComplianceDashboard() {
  const [selectedCategory, setSelectedCategory] = useState('hipaa');

  // Fetch compliance trackers
  const { data: complianceTrackers = [] } = useQuery({
    queryKey: ['compliance-trackers'],
    queryFn: () => base44.entities.ComplianceTracker.list()
  });

  // Fetch audit logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => base44.entities.AuditLog.list()
  });

  // Fetch trip classifications
  const { data: tripClassifications = [] } = useQuery({
    queryKey: ['trip-classifications'],
    queryFn: () => base44.entities.TripClassification.list()
  });

  // Calculate compliance summary
  const complianceSummary = useMemo(() => {
    const today = new Date();
    const categories = {
      hipaa: { label: 'HIPAA Compliance', color: 'border-blue-500/30 bg-blue-500/5' },
      irs_501c3: { label: 'IRS 501(c)(3)', color: 'border-green-500/30 bg-green-500/5' },
      texas_law: { label: 'Texas Law', color: 'border-yellow-500/30 bg-yellow-500/5' },
      usdot: { label: 'USDOT Compliance', color: 'border-red-500/30 bg-red-500/5' },
      ada: { label: 'ADA Compliance', color: 'border-purple-500/30 bg-purple-500/5' },
      workers_comp: { label: 'Workers Comp', color: 'border-orange-500/30 bg-orange-500/5' },
      maintenance: { label: 'Maintenance', color: 'border-slate-500/30 bg-slate-500/5' }
    };

    const summary = {};
    for (const [key, category] of Object.entries(categories)) {
      const items = complianceTrackers.filter(c => c.compliance_category === key);
      const compliant = items.filter(c => c.status === 'compliant').length;
      const overdue = items.filter(c => {
        const dueDate = new Date(c.due_date);
        return c.status !== 'compliant' && dueDate < today;
      }).length;
      const pending = items.filter(c => c.status === 'pending').length;

      summary[key] = {
        ...category,
        total: items.length,
        compliant,
        overdue,
        pending,
        rate: items.length > 0 ? Math.round((compliant / items.length) * 100) : 0
      };
    }
    return summary;
  }, [complianceTrackers]);

  // Get overdue items
  const overdueItems = useMemo(() => {
    const today = new Date();
    return complianceTrackers.filter(c => {
      const dueDate = new Date(c.due_date);
      return c.status !== 'compliant' && dueDate < today;
    }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  }, [complianceTrackers]);

  // Get flagged audit logs
  const flaggedLogs = useMemo(() => {
    return auditLogs.filter(log => log.flagged).slice(0, 10);
  }, [auditLogs]);

  // Trip compliance stats
  const tripStats = useMemo(() => {
    const medicalTrips = tripClassifications.filter(t => t.is_medical_appointment).length;
    const consentGranted = tripClassifications.filter(t => t.driver_consent_granted).length;
    const mileageTracked = tripClassifications.filter(t => t.mileage_tracked).length;

    return { medicalTrips, consentGranted, mileageTracked };
  }, [tripClassifications]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Compliance Dashboard</h1>
          <p className="text-muted-foreground mt-1">HIPAA • IRS 501(c)(3) • Texas Law • USDOT</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Critical Alerts */}
      {overdueItems.length > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              {overdueItems.length} Overdue Compliance Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueItems.slice(0, 3).map(item => (
                <div key={item.id} className="p-2 bg-card rounded border border-red-500/30 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.requirement}</p>
                    <p className="text-xs text-red-600">{item.entity_name} • Due {new Date(item.due_date).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="destructive">Overdue</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(complianceSummary).map(([key, category]) => (
          <Card key={key} className={`${category.color} cursor-pointer hover:shadow-lg transition-shadow`} onClick={() => setSelectedCategory(key)}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">{category.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{category.rate}%</p>
                </div>
                {category.rate === 100 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : category.overdue > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-600" />
                )}
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-foreground">{category.compliant}/{category.total}</span>
                {category.overdue > 0 && <span className="text-red-600">({category.overdue} overdue)</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="trips">Trip Compliance</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* By Category Tab */}
        <TabsContent value="categories" className="space-y-4">
          {Object.entries(complianceSummary).map(([key, category]) => {
            const categoryItems = complianceTrackers.filter(c => c.compliance_category === key);
            return (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{category.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-2xl font-bold">{category.total}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="p-2 bg-green-500/10 rounded">
                      <p className="text-2xl font-bold text-green-600">{category.compliant}</p>
                      <p className="text-xs text-green-600">Compliant</p>
                    </div>
                    <div className="p-2 bg-yellow-500/10 rounded">
                      <p className="text-2xl font-bold text-yellow-600">{category.pending}</p>
                      <p className="text-xs text-yellow-600">Pending</p>
                    </div>
                    <div className="p-2 bg-red-500/10 rounded">
                      <p className="text-2xl font-bold text-red-600">{category.overdue}</p>
                      <p className="text-xs text-red-600">Overdue</p>
                    </div>
                  </div>

                  {categoryItems.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-border">
                      {categoryItems.map(item => (
                        <div key={item.id} className="p-2 bg-card rounded border border-border flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium text-foreground">{item.requirement}</p>
                            <p className="text-xs text-muted-foreground">{item.entity_name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">{new Date(item.due_date).toLocaleDateString()}</p>
                            <Badge 
                              variant={item.status === 'compliant' ? 'default' : item.status === 'overdue' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Trip Compliance Tab */}
        <TabsContent value="trips">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trip Compliance & Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-500/10 rounded border border-blue-500/30">
                  <p className="text-2xl font-bold text-blue-600">{tripStats.medicalTrips}</p>
                  <p className="text-sm text-blue-600 mt-2">Medical Appointments</p>
                  <p className="text-xs text-muted-foreground mt-1">PHI Protected Trips</p>
                </div>
                <div className="p-4 bg-green-500/10 rounded border border-green-500/30">
                  <p className="text-2xl font-bold text-green-600">{tripStats.consentGranted}</p>
                  <p className="text-sm text-green-600 mt-2">Consents Granted</p>
                  <p className="text-xs text-muted-foreground mt-1">Pathways Data Sharing</p>
                </div>
                <div className="p-4 bg-purple-500/10 rounded border border-purple-500/30">
                  <p className="text-2xl font-bold text-purple-600">{tripStats.mileageTracked}</p>
                  <p className="text-sm text-purple-600 mt-2">Mileage Tracked</p>
                  <p className="text-xs text-muted-foreground mt-1">IRS Deduction Eligible</p>
                </div>
              </div>

              <div className="p-4 bg-card rounded border border-border">
                <h4 className="font-semibold text-foreground mb-3">Privacy Controls</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Medical destinations masked from drivers (show address only, not appointment type)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Medical trip logs restricted to case managers and admins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Driver access limited to assigned trips only</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>All participant data access logged and audited</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Flagged Access Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {flaggedLogs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No flagged access attempts.</p>
              ) : (
                <div className="space-y-3">
                  {flaggedLogs.map(log => (
                    <div key={log.id} className="p-3 bg-red-500/10 rounded border border-red-500/30">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-foreground text-sm">{log.flag_reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.accessed_by} ({log.user_role}) • {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="destructive">FLAGGED</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{log.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}