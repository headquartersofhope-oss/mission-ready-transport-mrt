import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';
import { format } from 'date-fns';

const defaultState = {
  incident_type: 'no_show_rider',
  severity: 'low',
  status: 'open',
  ride_request_id: '',
  participant_name: '',
  driver_name: '',
  vehicle_id: '',
  incident_date: format(new Date(), 'yyyy-MM-dd'),
  reported_by: '',
  description: '',
  resolution_notes: '',
  follow_up_required: false,
  follow_up_date: '',
  escalated_to: ''
};

export default function IncidentForm({ existing, onSave, onCancel }) {
  const [form, setForm] = useState(existing || defaultState);
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{existing ? 'Edit Incident' : 'Log Incident'}</h1>
          <p className="text-sm text-muted-foreground">Record and track operational incidents</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Incident Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Incident Type *</Label>
              <Select value={form.incident_type} onValueChange={v => set('incident_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_show_rider">No-Show (Rider)</SelectItem>
                  <SelectItem value="no_show_driver">No-Show (Driver)</SelectItem>
                  <SelectItem value="safety_incident">Safety Incident</SelectItem>
                  <SelectItem value="vehicle_issue">Vehicle Issue</SelectItem>
                  <SelectItem value="scheduling_error">Scheduling Error</SelectItem>
                  <SelectItem value="rider_behavior">Rider Behavior</SelectItem>
                  <SelectItem value="driver_behavior">Driver Behavior</SelectItem>
                  <SelectItem value="late_pickup">Late Pickup</SelectItem>
                  <SelectItem value="late_dropoff">Late Drop-Off</SelectItem>
                  <SelectItem value="route_error">Route Error</SelectItem>
                  <SelectItem value="communication_failure">Communication Failure</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Severity</Label>
              <Select value={form.severity || 'low'} onValueChange={v => set('severity', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={form.status || 'open'} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Incident Date *</Label>
              <Input type="date" required value={form.incident_date || ''} onChange={e => set('incident_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reported By</Label>
              <Input value={form.reported_by || ''} onChange={e => set('reported_by', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ride Request ID (optional)</Label>
              <Input value={form.ride_request_id || ''} onChange={e => set('ride_request_id', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rider / Participant Name</Label>
              <Input value={form.participant_name || ''} onChange={e => set('participant_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Driver Name</Label>
              <Input value={form.driver_name || ''} onChange={e => set('driver_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Vehicle ID</Label>
              <Input value={form.vehicle_id || ''} onChange={e => set('vehicle_id', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Description & Resolution</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Description *</Label>
              <Textarea required rows={4} placeholder="Describe what happened..." value={form.description || ''} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Resolution Notes</Label>
              <Textarea rows={3} placeholder="How was this resolved?" value={form.resolution_notes || ''} onChange={e => set('resolution_notes', e.target.value)} />
            </div>
            {(form.status === 'escalated') && (
              <div className="space-y-1.5">
                <Label className="text-xs">Escalated To</Label>
                <Input value={form.escalated_to || ''} onChange={e => set('escalated_to', e.target.value)} />
              </div>
            )}
            <div className="flex items-center gap-3">
              <Switch checked={form.follow_up_required || false} onCheckedChange={v => set('follow_up_required', v)} />
              <Label className="text-xs">Follow-up Required</Label>
            </div>
            {form.follow_up_required && (
              <div className="space-y-1.5">
                <Label className="text-xs">Follow-up Date</Label>
                <Input type="date" value={form.follow_up_date || ''} onChange={e => set('follow_up_date', e.target.value)} />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Incident'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}