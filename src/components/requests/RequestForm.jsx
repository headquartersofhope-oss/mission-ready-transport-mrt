import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';
import { format } from 'date-fns';

const PURPOSES = [
  { value: 'work_commute', label: 'Work Commute' },
  { value: 'job_interview', label: 'Job Interview' },
  { value: 'first_day_of_work', label: 'First Day of Work' },
  { value: 'medical', label: 'Medical Appointment' },
  { value: 'counseling_treatment', label: 'Counseling / Treatment' },
  { value: 'court_probation', label: 'Court / Probation' },
  { value: 'dmv_id', label: 'DMV / ID Appointment' },
  { value: 'benefits_office', label: 'Benefits Office' },
  { value: 'school_training', label: 'School / Training' },
  { value: 'housing_appointment', label: 'Housing Appointment' },
  { value: 'grocery_essential', label: 'Grocery / Essential Support' },
  { value: 'emergency_support', label: 'Emergency Support' },
  { value: 'recovery', label: 'Recovery Program' },
  { value: 'other', label: 'Other Approved Category' },
];

const defaultState = {
  participant_id: '', participant_name: '',
  request_date: format(new Date(), 'yyyy-MM-dd'),
  pickup_time: '', appointment_time: '',
  pickup_location: '', dropoff_location: '',
  return_trip: false, return_pickup_time: '', return_pickup_location: '',
  trip_type: 'one_way', is_recurring: false, recurring_plan_id: '',
  purpose: '', priority: 'standard', status: 'requested',
  special_instructions: '', linked_program: '',
  estimated_cost: '', funding_source: '',
  participant_contribution: 0, driver_notes: '',
  submitted_by: '', service_zone: '',
  assigned_driver_name: '', assigned_vehicle_name: '', assigned_provider_name: '',
};

export default function RequestForm({ existingRequest, onSave, onCancel }) {
  const [form, setForm] = useState(existingRequest || defaultState);
  const [saving, setSaving] = useState(false);

  const { data: participants = [] } = useQuery({
    queryKey: ['participants'],
    queryFn: () => base44.entities.Participant.list('first_name', 500),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list('first_name', 200),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list('nickname', 100),
  });

  const activeParticipants = useMemo(() => participants.filter(p => p.status === 'active'), [participants]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleParticipantSelect = (participantId) => {
    const p = participants.find(p => p.id === participantId);
    if (p) {
      set('participant_id', participantId);
      set('participant_name', `${p.first_name} ${p.last_name}`);
      if (p.pickup_address) set('pickup_location', p.pickup_address);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const submitData = { ...form };
    if (submitData.estimated_cost === '') delete submitData.estimated_cost;
    await onSave(submitData);
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{existingRequest ? 'Edit Ride Request' : 'New Ride Request'}</h1>
          <p className="text-sm text-muted-foreground">Submit a transportation request for review</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Client & Purpose</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Client *</Label>
              <Select value={form.participant_id} onValueChange={handleParticipantSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client…" />
                </SelectTrigger>
                <SelectContent>
                  {activeParticipants.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name} {p.participant_id ? `(${p.participant_id})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rider Name *</Label>
              <Input required value={form.participant_name || ''} onChange={e => set('participant_name', e.target.value)} placeholder="Or type manually" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Purpose *</Label>
              <Select value={form.purpose || ''} onValueChange={v => set('purpose', v)}>
                <SelectTrigger><SelectValue placeholder="Select purpose…" /></SelectTrigger>
                <SelectContent>
                  {PURPOSES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Priority</Label>
              <Select value={form.priority || 'standard'} onValueChange={v => set('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Linked Program / Pathway</Label>
              <Input value={form.linked_program || ''} onChange={e => set('linked_program', e.target.value)} placeholder="e.g. Re-entry Program" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Submitted By</Label>
              <Input value={form.submitted_by || ''} onChange={e => set('submitted_by', e.target.value)} placeholder="Staff email or name" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Schedule & Routing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Date *</Label>
                <Input type="date" required value={form.request_date || ''} onChange={e => set('request_date', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Pickup Time</Label>
                <Input type="time" value={form.pickup_time || ''} onChange={e => set('pickup_time', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Appointment Time</Label>
                <Input type="time" value={form.appointment_time || ''} onChange={e => set('appointment_time', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Pickup Address *</Label>
                <Input required value={form.pickup_location || ''} onChange={e => set('pickup_location', e.target.value)} placeholder="Full pickup address" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Destination Address *</Label>
                <Input required value={form.dropoff_location || ''} onChange={e => set('dropoff_location', e.target.value)} placeholder="Full destination address" />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Switch checked={form.return_trip || false} onCheckedChange={v => { set('return_trip', v); set('trip_type', v ? 'round_trip' : 'one_way'); }} />
              <Label className="text-xs">Round Trip (Return needed)</Label>
            </div>

            {form.return_trip && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/50">
                <div className="space-y-1.5">
                  <Label className="text-xs">Return Pickup Time</Label>
                  <Input type="time" value={form.return_pickup_time || ''} onChange={e => set('return_pickup_time', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Return Pickup Location</Label>
                  <Input value={form.return_pickup_location || ''} onChange={e => set('return_pickup_location', e.target.value)} placeholder="If different from destination" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Dispatch Assignment (Optional)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Assign Driver</Label>
              <Select value={form.assigned_driver_name || ''} onValueChange={v => set('assigned_driver_name', v)}>
                <SelectTrigger><SelectValue placeholder="Assign later…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Assign later</SelectItem>
                  {drivers.filter(d => d.status === 'active').map(d => (
                    <SelectItem key={d.id} value={`${d.first_name} ${d.last_name}`}>
                      {d.first_name} {d.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Assign Vehicle</Label>
              <Select value={form.assigned_vehicle_name || ''} onValueChange={v => set('assigned_vehicle_name', v)}>
                <SelectTrigger><SelectValue placeholder="Assign later…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Assign later</SelectItem>
                  {vehicles.filter(v => v.status === 'active').map(v => (
                    <SelectItem key={v.id} value={v.nickname || `${v.make} ${v.model}`}>
                      {v.nickname || `${v.year} ${v.make} ${v.model}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Service Zone</Label>
              <Input value={form.service_zone || ''} onChange={e => set('service_zone', e.target.value)} placeholder="e.g. North Zone" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Funding & Cost</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Funding Source</Label>
              <Input value={form.funding_source || ''} onChange={e => set('funding_source', e.target.value)} placeholder="e.g. Employment Support Grant" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Estimated Cost ($)</Label>
              <Input type="number" step="0.01" value={form.estimated_cost || ''} onChange={e => set('estimated_cost', e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Participant Contribution ($)</Label>
              <Input type="number" step="0.01" value={form.participant_contribution || 0} onChange={e => set('participant_contribution', parseFloat(e.target.value) || 0)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Special Instructions & Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Special Instructions (visible to driver)</Label>
              <Textarea rows={3} value={form.special_instructions || ''} onChange={e => set('special_instructions', e.target.value)} placeholder="Mobility needs, pickup notes, anything driver needs to know..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Driver Notes</Label>
              <Textarea rows={2} value={form.driver_notes || ''} onChange={e => set('driver_notes', e.target.value)} placeholder="Internal dispatch notes for driver..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />{saving ? 'Saving…' : (existingRequest ? 'Update Request' : 'Submit Request')}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}