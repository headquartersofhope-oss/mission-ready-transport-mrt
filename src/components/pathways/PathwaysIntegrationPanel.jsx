/**
 * PathwaysIntegrationPanel — Bidirectional Pathways Hub integration dashboard
 * Shows inbound requests from Pathways and lets dispatchers push status updates back.
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, CheckCircle2, Clock, Truck, User, MapPin, Send } from 'lucide-react';

const PATHWAYS_APP_ID = '69cd2e070504b4c1c4e88766';

const eventLabels = {
  confirmed: { label: 'Confirm', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  driver_assigned: { label: 'Driver Assigned', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  en_route: { label: 'En Route', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  completed: { label: 'Complete', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  cancelled: { label: 'Cancel', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export default function PathwaysIntegrationPanel() {
  const [pushingId, setPushingId] = useState(null);
  const [pushEvent, setPushEvent] = useState({});
  const queryClient = useQueryClient();

  // Pathways-originated transport requests
  const { data: allRequests = [], refetch: refetchRequests } = useQuery({
    queryKey: ['pathways-requests'],
    queryFn: () => base44.entities.TransportRequest.list('-created_date', 100),
    refetchInterval: 30000,
  });

  // Recent sync log
  const { data: syncLog = [], refetch: refetchSync } = useQuery({
    queryKey: ['pathways-sync'],
    queryFn: () => base44.entities.PathwaysSync.list('-created_date', 10),
    refetchInterval: 30000,
  });

  const pathwaysRequests = allRequests.filter(r =>
    r.submitted_by?.startsWith('pathways_hub:')
  );

  const pendingRequests = pathwaysRequests.filter(r =>
    !['completed', 'cancelled', 'no_show'].includes(r.status)
  );
  const recentCompleted = pathwaysRequests.filter(r =>
    ['completed', 'cancelled'].includes(r.status)
  ).slice(0, 5);

  const pushStatus = async (requestId, event) => {
    setPushingId(requestId + event);
    try {
      await base44.functions.invoke('pathwaysOutbound', { request_id: requestId, event });
      refetchSync();
      refetchRequests();
    } finally {
      setPushingId(null);
    }
  };

  const refetchAll = () => {
    refetchRequests();
    refetchSync();
    queryClient.invalidateQueries({ queryKey: ['pathways-requests'] });
  };

  const statusColor = (status) => {
    const map = {
      requested: 'bg-yellow-500/10 text-yellow-400',
      approved: 'bg-blue-500/10 text-blue-400',
      scheduled: 'bg-blue-500/10 text-blue-400',
      driver_assigned: 'bg-purple-500/10 text-purple-400',
      en_route: 'bg-amber-500/10 text-amber-400',
      completed: 'bg-emerald-500/10 text-emerald-400',
      cancelled: 'bg-red-500/10 text-red-400',
    };
    return map[status] || 'bg-muted/10 text-muted-foreground';
  };

  const lastSync = syncLog[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Pathways Hub</h3>
            <p className="text-xs text-muted-foreground">App {PATHWAYS_APP_ID.slice(0, 8)}…</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastSync && (
            <span className="text-xs text-muted-foreground">
              Last sync: {new Date(lastSync.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={refetchAll} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{pendingRequests.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Active Requests</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{recentCompleted.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{pathwaysRequests.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total HOH Trips</p>
        </div>
      </div>

      {/* Inbound Requests */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
            Inbound from Pathways
            {pendingRequests.length > 0 && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                {pendingRequests.length} active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active Pathways requests
            </p>
          ) : (
            pendingRequests.map(req => {
              const pathwaysId = req.submitted_by?.replace('pathways_hub:', '');
              return (
                <div key={req.id} className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm text-foreground truncate">{req.participant_name}</span>
                    </div>
                    <Badge className={`text-xs ${statusColor(req.status)}`}>
                      {req.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-blue-400" />
                      <span>{req.pickup_location}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-emerald-400" />
                      <span>{req.dropoff_location}</span>
                    </div>
                    {req.assigned_driver_name && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Truck className="w-3 h-3 shrink-0 text-purple-400" />
                        <span>{req.assigned_driver_name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs text-muted-foreground mr-1">Push to Pathways:</span>
                    {Object.entries(eventLabels).map(([event, cfg]) => (
                      <Button
                        key={event}
                        size="sm"
                        variant="outline"
                        className={`h-6 px-2 text-xs ${cfg.color} border`}
                        disabled={pushingId === req.id + event}
                        onClick={() => pushStatus(req.id, event)}
                      >
                        {pushingId === req.id + event ? (
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-2.5 h-2.5 mr-1" />
                            {cfg.label}
                          </>
                        )}
                      </Button>
                    ))}
                  </div>
                  {pathwaysId && (
                    <p className="text-xs text-muted-foreground/60">Pathways ID: {pathwaysId}</p>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Recent Sync Log */}
      {syncLog.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-blue-400" />
              Recent Sync Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {syncLog.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-start gap-2 text-xs">
                {log.status === 'synced' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-foreground truncate">{log.payload_summary}</p>
                  <p className="text-muted-foreground">{new Date(log.created_date).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}