import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Edit, Save } from 'lucide-react';

const severityColors = {
  low: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  high: 'bg-red-500/10 text-red-600 border-red-500/20',
  critical: 'bg-red-700/10 text-red-700 border-red-700/20',
};

const statusColors = {
  open: 'bg-red-500/10 text-red-600 border-red-500/20',
  under_review: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  escalated: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  closed: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

export default function IncidentDetail({ incident, onEdit, onBack, onSave }) {
  const [quickStatus, setQuickStatus] = useState(incident.status);
  const [resolutionNotes, setResolutionNotes] = useState(incident.resolution_notes || '');
  const [saving, setSaving] = useState(false);

  const handleQuickResolve = async () => {
    setSaving(true);
    await onSave({ ...incident, status: quickStatus, resolution_notes: resolutionNotes });
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold capitalize">{incident.incident_type?.replace(/_/g, ' ')}</h1>
            <Badge variant="outline" className={`${severityColors[incident.severity] || ''} capitalize`}>{incident.severity}</Badge>
            <Badge variant="outline" className={`${statusColors[incident.status] || ''} capitalize`}>{incident.status?.replace(/_/g, ' ')}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{incident.incident_date} · Reported by: {incident.reported_by || 'Unknown'}</p>
        </div>
        <Button onClick={onEdit} variant="outline" className="gap-2">
          <Edit className="w-4 h-4" />Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Incident Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {incident.participant_name && <p><span className="text-muted-foreground">Rider:</span> {incident.participant_name}</p>}
            {incident.driver_name && <p><span className="text-muted-foreground">Driver:</span> {incident.driver_name}</p>}
            {incident.vehicle_id && <p><span className="text-muted-foreground">Vehicle:</span> {incident.vehicle_id}</p>}
            {incident.ride_request_id && <p><span className="text-muted-foreground">Ride ID:</span> {incident.ride_request_id}</p>}
            {incident.follow_up_required && (
              <p className="text-amber-600 font-medium">⚠️ Follow-up required{incident.follow_up_date ? ` by ${incident.follow_up_date}` : ''}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Quick Update</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={quickStatus} onValueChange={setQuickStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Resolution notes..."
              value={resolutionNotes}
              onChange={e => setResolutionNotes(e.target.value)}
              rows={2}
              className="text-sm"
            />
            <Button size="sm" onClick={handleQuickResolve} disabled={saving} className="gap-2">
              <Save className="w-3.5 h-3.5" />{saving ? 'Saving…' : 'Update Status'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Description</CardTitle></CardHeader>
        <CardContent><p className="text-sm">{incident.description}</p></CardContent>
      </Card>

      {incident.resolution_notes && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Resolution Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{incident.resolution_notes}</p></CardContent>
        </Card>
      )}
    </div>
  );
}