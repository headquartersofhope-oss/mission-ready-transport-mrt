import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ComplianceSetup() {
  const [initializing, setInitializing] = useState(false);

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list()
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list()
  });

  const { data: complianceTrackers = [], refetch: refetchCompliance } = useQuery({
    queryKey: ['compliance-trackers'],
    queryFn: () => base44.entities.ComplianceTracker.list()
  });

  // Initialize compliance requirements
  const initializeCompliance = async () => {
    setInitializing(true);
    try {
      const today = new Date();
      const oneYearAhead = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
      const sixMonthsAhead = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());

      // Driver compliance requirements
      for (const driver of drivers) {
        const requirements = [
          {
            entity_type: 'driver',
            entity_id: driver.id,
            entity_name: `${driver.first_name} ${driver.last_name}`,
            compliance_category: 'texas_law',
            requirement: 'Texas Driver License Validity',
            due_date: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0]
          },
          {
            entity_type: 'driver',
            entity_id: driver.id,
            entity_name: `${driver.first_name} ${driver.last_name}`,
            compliance_category: 'texas_law',
            requirement: 'Annual MVR (Motor Vehicle Record) Check',
            due_date: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0]
          },
          {
            entity_type: 'driver',
            entity_id: driver.id,
            entity_name: `${driver.first_name} ${driver.last_name}`,
            compliance_category: 'texas_law',
            requirement: 'Background Check (Texas DPS)',
            due_date: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0]
          },
          {
            entity_type: 'driver',
            entity_id: driver.id,
            entity_name: `${driver.first_name} ${driver.last_name}`,
            compliance_category: 'usdot',
            requirement: 'DOT Physical Examination (if CDL)',
            due_date: new Date(today.getFullYear() + 2, today.getMonth(), today.getDate()).toISOString().split('T')[0]
          },
          {
            entity_type: 'driver',
            entity_id: driver.id,
            entity_name: `${driver.first_name} ${driver.last_name}`,
            compliance_category: 'hipaa',
            requirement: 'HIPAA Privacy Training',
            due_date: oneYearAhead.toISOString().split('T')[0]
          }
        ];

        for (const req of requirements) {
          await base44.asServiceRole.entities.ComplianceTracker.create(req);
        }
      }

      // Vehicle compliance requirements
      for (const vehicle of vehicles) {
        const requirements = [
          {
            entity_type: 'vehicle',
            entity_id: vehicle.id,
            entity_name: vehicle.nickname || vehicle.plate,
            compliance_category: 'texas_law',
            requirement: 'Texas Vehicle Registration',
            due_date: vehicle.registration_expiry || new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0]
          },
          {
            entity_type: 'vehicle',
            entity_id: vehicle.id,
            entity_name: vehicle.nickname || vehicle.plate,
            compliance_category: 'texas_law',
            requirement: 'Texas Vehicle Inspection Sticker',
            due_date: new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()).toISOString().split('T')[0]
          },
          {
            entity_type: 'vehicle',
            entity_id: vehicle.id,
            entity_name: vehicle.nickname || vehicle.plate,
            compliance_category: 'texas_law',
            requirement: 'Liability Insurance (TX Minimums)',
            due_date: vehicle.insurance_expiry || sixMonthsAhead.toISOString().split('T')[0]
          },
          {
            entity_type: 'vehicle',
            entity_id: vehicle.id,
            entity_name: vehicle.nickname || vehicle.plate,
            compliance_category: 'maintenance',
            requirement: 'Preventive Maintenance (Oil Change)',
            due_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          {
            entity_type: 'vehicle',
            entity_id: vehicle.id,
            entity_name: vehicle.nickname || vehicle.plate,
            compliance_category: 'maintenance',
            requirement: 'Annual Safety Inspection',
            due_date: oneYearAhead.toISOString().split('T')[0]
          }
        ];

        for (const req of requirements) {
          await base44.asServiceRole.entities.ComplianceTracker.create(req);
        }
      }

      // Program-level requirements
      const programRequirements = [
        {
          entity_type: 'program',
          entity_id: 'hoh_program',
          entity_name: 'HOH Transportation Program',
          compliance_category: 'irs_501c3',
          requirement: 'Form 990 Transportation Data Documentation',
          due_date: new Date(today.getFullYear(), 4, 15).toISOString().split('T')[0]
        },
        {
          entity_type: 'program',
          entity_id: 'hoh_program',
          entity_name: 'HOH Transportation Program',
          compliance_category: 'hipaa',
          requirement: 'HIPAA Compliance Audit',
          due_date: oneYearAhead.toISOString().split('T')[0]
        },
        {
          entity_type: 'program',
          entity_id: 'hoh_program',
          entity_name: 'HOH Transportation Program',
          compliance_category: 'texas_law',
          requirement: 'TxDOT Compliance Review',
          due_date: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0]
        }
      ];

      for (const req of programRequirements) {
        await base44.asServiceRole.entities.ComplianceTracker.create(req);
      }

      await refetchCompliance();
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setInitializing(false);
    }
  };

  const complianceByCategory = useMemo(() => {
    const categories = {};
    complianceTrackers.forEach(tracker => {
      if (!categories[tracker.compliance_category]) {
        categories[tracker.compliance_category] = { total: 0, compliant: 0, pending: 0, overdue: 0 };
      }
      categories[tracker.compliance_category].total++;
      if (tracker.status === 'compliant') categories[tracker.compliance_category].compliant++;
      if (tracker.status === 'pending') categories[tracker.compliance_category].pending++;
      if (tracker.status === 'overdue') categories[tracker.compliance_category].overdue++;
    });
    return categories;
  }, [complianceTrackers]);

  const isInitialized = complianceTrackers.length > 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Compliance Initialization</h1>
          <p className="text-muted-foreground mt-1">Set up compliance tracking for drivers, vehicles, and programs</p>
        </div>
      </div>

      {!isInitialized ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Compliance tracking not initialized
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground">
              Click the button below to initialize compliance requirements for all drivers and vehicles in the system.
              This will create tracking records for:
            </p>
            <ul className="text-sm space-y-2 ml-4">
              <li>✓ Driver license, MVR, background checks, and HIPAA training</li>
              <li>✓ Vehicle registration, inspection, insurance, and maintenance</li>
              <li>✓ Program-level IRS 501(c)(3) and HIPAA compliance</li>
            </ul>
            <Button
              onClick={initializeCompliance}
              disabled={initializing}
              className="gap-2"
              size="lg"
            >
              <Zap className="w-4 h-4" />
              {initializing ? 'Initializing...' : 'Initialize Compliance System'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Compliance system initialized
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">
              Tracking {complianceTrackers.length} compliance requirements across {drivers.length} drivers, {vehicles.length} vehicles, and program level.
            </p>
          </CardContent>
        </Card>
      )}

      {isInitialized && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(complianceByCategory).map(([category, stats]) => (
                <Card key={category}>
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground font-semibold mb-2 capitalize">{category.replace('_', ' ')}</p>
                    <p className="text-2xl font-bold mb-3">{Math.round((stats.compliant / stats.total) * 100)}%</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-green-600">Compliant:</span>
                        <span className="font-semibold">{stats.compliant}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-600">Pending:</span>
                        <span className="font-semibold">{stats.pending}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-600">Overdue:</span>
                        <span className="font-semibold">{stats.overdue}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="checklist">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Compliance Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {complianceTrackers.slice(0, 10).map(tracker => (
                  <div key={tracker.id} className="p-3 bg-card rounded border border-border flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">{tracker.requirement}</p>
                      <p className="text-xs text-muted-foreground">{tracker.entity_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">{new Date(tracker.due_date).toLocaleDateString()}</p>
                      <Badge
                        variant={tracker.status === 'compliant' ? 'default' : tracker.status === 'overdue' ? 'destructive' : 'secondary'}
                      >
                        {tracker.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}