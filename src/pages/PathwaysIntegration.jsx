import PathwaysIntegrationPanel from '@/components/pathways/PathwaysIntegrationPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link2, Info } from 'lucide-react';

const PATHWAYS_APP_ID = '69cd2e070504b4c1c4e88766';

export default function PathwaysIntegration() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pathways Hub Integration</h1>
          <p className="text-muted-foreground mt-1">Bidirectional transport coordination with the REJ Pathways Hub</p>
        </div>
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1.5">
          <Link2 className="w-3.5 h-3.5" />
          Connected — App {PATHWAYS_APP_ID.slice(0, 8)}…
        </Badge>
      </div>

      {/* How it works */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            How the integration works
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-blue-400">① Pathways Sends Request</p>
            <p className="text-xs text-muted-foreground">
              When an HOH resident needs transport, Pathways posts to the <code className="text-blue-300">pathwaysInbound</code> function with resident details, pickup address, and appointment time.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-blue-400">② MRT Dispatches</p>
            <p className="text-xs text-muted-foreground">
              A TransportRequest is created automatically. Dispatchers assign a driver and vehicle from the active fleet as normal.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-blue-400">③ Status Pushed Back</p>
            <p className="text-xs text-muted-foreground">
              At each stage (confirmed → driver assigned → en route → completed), dispatchers click "Push to Pathways" to send the update back via <code className="text-blue-300">pathwaysOutbound</code>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-amber-400">Configuration for the Pathways Hub Team</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">Inbound Webhook URL (give this to Pathways):</p>
            <code className="block text-xs bg-card border border-border rounded px-3 py-2 text-blue-300">
              https://api.base44.com/api/apps/[MRT_APP_ID]/functions/pathwaysInbound
            </code>
            <p className="text-xs text-muted-foreground">Pathways must POST with <code>secret: "mrt-pathways-2026"</code> (or set PATHWAYS_SHARED_SECRET env var).</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">Outbound Webhook URL (MRT will POST to Pathways):</p>
            <p className="text-xs text-muted-foreground">
              Set the <code className="text-amber-300">PATHWAYS_WEBHOOK_URL</code> secret to Pathways Hub's inbound webhook URL so MRT can push status updates automatically.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">Shared Secret:</p>
            <p className="text-xs text-muted-foreground">
              Set <code className="text-amber-300">PATHWAYS_SHARED_SECRET</code> in MRT app secrets to match what Pathways uses. Default: <code>mrt-pathways-2026</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Live Panel */}
      <PathwaysIntegrationPanel />
    </div>
  );
}