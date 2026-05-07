import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Link as LinkIcon, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PathwaysEcosystem() {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Fetch latest sync record
  const { data: syncData, refetch: refetchSync } = useQuery({
    queryKey: ['pathways-sync'],
    queryFn: async () => {
      const syncs = await base44.entities.PathwaysSync.list();
      return syncs[0] || null;
    }
  });

  // Fetch participant requests
  const { data: transportRequests = [] } = useQuery({
    queryKey: ['transport-requests'],
    queryFn: () => base44.entities.TransportRequest.list()
  });

  // Fetch trip classifications for HOH vs Commercial split
  const { data: tripClassifications = [] } = useQuery({
    queryKey: ['trip-classifications'],
    queryFn: () => base44.entities.TripClassification.list()
  });

  const metrics = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthRequests = transportRequests.filter(r => {
      const reqDate = new Date(r.request_date);
      return reqDate >= monthStart && reqDate <= monthEnd;
    });

    const hoh = tripClassifications.filter(t => t.trip_type === 'HOH_Program').length;
    const commercial = tripClassifications.filter(t => t.trip_type === 'Commercial').length;

    const pending = monthRequests.filter(r => r.status === 'requested' || r.status === 'pending').length;
    const scheduled = monthRequests.filter(r => r.status === 'scheduled' || r.status === 'driver_assigned').length;
    const completed = monthRequests.filter(r => r.status === 'completed').length;

    return { hoh, commercial, pending, scheduled, completed, total: monthRequests.length };
  }, [transportRequests, tripClassifications]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await base44.functions.invoke('syncTransportToPathways', {});
      if (response.data.success) {
        setLastSyncTime(new Date());
        refetchSync();
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const getTimeSinceSync = () => {
    if (!syncData?.synced_at) return 'Never';
    const syncDate = new Date(syncData.synced_at);
    const diffMinutes = Math.floor((Date.now() - syncDate) / 60000);
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Ecosystem Connections */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-blue-500" />
            Pathways Ecosystem Connections
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-card rounded border border-border flex items-center justify-between">
              <span className="text-sm font-medium">Pathways Hub</span>
              <Badge variant="default" className="bg-green-600">Connected</Badge>
            </div>
            <div className="p-3 bg-card rounded border border-border flex items-center justify-between">
              <span className="text-sm font-medium">Governance OS</span>
              <Badge variant="secondary">Ready</Badge>
            </div>
            <div className="p-3 bg-card rounded border border-border flex items-center justify-between">
              <span className="text-sm font-medium">Command Center</span>
              <Badge variant="secondary">Available</Badge>
            </div>
            <div className="p-3 bg-card rounded border border-border flex items-center justify-between">
              <span className="text-sm font-medium">Housing Module</span>
              <Badge variant="secondary">Available</Badge>
            </div>
          </div>

          {/* Sync Control */}
          <div className="p-3 bg-muted/50 rounded border border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-foreground">Last Sync</p>
                <p className="text-xs text-muted-foreground">{getTimeSinceSync()}</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Participant Requests Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Participant Transport Requests (This Month)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3 mb-4">
            <div className="text-center p-3 bg-muted/50 rounded">
              <p className="text-2xl font-bold text-foreground">{metrics.total}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Requests</p>
            </div>
            <div className="text-center p-3 bg-yellow-500/10 rounded">
              <p className="text-2xl font-bold text-yellow-600">{metrics.pending}</p>
              <p className="text-xs text-yellow-600 mt-1">Pending</p>
            </div>
            <div className="text-center p-3 bg-blue-500/10 rounded">
              <p className="text-2xl font-bold text-blue-600">{metrics.scheduled}</p>
              <p className="text-xs text-blue-600 mt-1">Scheduled</p>
            </div>
            <div className="text-center p-3 bg-green-500/10 rounded">
              <p className="text-2xl font-bold text-green-600">{metrics.completed}</p>
              <p className="text-xs text-green-600 mt-1">Completed</p>
            </div>
            <div className="text-center p-3 bg-purple-500/10 rounded">
              <p className="text-2xl font-bold text-purple-600">{Math.round((metrics.completed / metrics.total) * 100) || 0}%</p>
              <p className="text-xs text-purple-600 mt-1">Fulfillment</p>
            </div>
          </div>

          {/* HOH vs Commercial Split */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            <div className="p-3 bg-green-500/10 rounded border border-green-500/30">
              <p className="text-xs text-green-600 font-semibold mb-1">HOH Program Trips</p>
              <p className="text-2xl font-bold text-green-600">{metrics.hoh}</p>
              <p className="text-xs text-green-600 mt-1">Charitable (501c3)</p>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded border border-yellow-500/30">
              <p className="text-xs text-yellow-600 font-semibold mb-1">Commercial Trips</p>
              <p className="text-2xl font-bold text-yellow-600">{metrics.commercial}</p>
              <p className="text-xs text-yellow-600 mt-1">For-Profit (RE Jones)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Metrics Preview */}
      {syncData?.metrics && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Pathways Sync Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Driver Compliance</p>
                <p className="text-lg font-bold text-primary">{syncData.metrics.driver_compliance_rate}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fulfillment Rate</p>
                <p className="text-lg font-bold text-primary">{syncData.metrics.fulfillment_rate}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">HOH Miles</p>
                <p className="text-lg font-bold text-green-600">{syncData.metrics.hoh_miles}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Open Incidents</p>
                <p className={`text-lg font-bold ${syncData.metrics.open_incidents > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {syncData.metrics.open_incidents}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}