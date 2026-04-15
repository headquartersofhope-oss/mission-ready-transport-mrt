import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';

const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const purposes = [
  { value: 'employment', label: 'Employment / Work Commute' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'court', label: 'Court' },
  { value: 'training', label: 'Training / Education' },
  { value: 'appointments', label: 'Recurring Appointments' },
  { value: 'other', label: 'Other' },
];

export default function RecurringPlanForm({ existing, onSave, onCancel }) {
  const { data: participants = [] } = useQuery({
    queryKey: ['participants-list'],
    queryFn: () => base44.entities.Participant.filter({ status: 'active' }, '-created_date', 500),
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['providers-active'],
    queryFn: () => base44.entities.TransportProvider.filter({ status: 'active' }, 'name', 200),
  });

  const [form, setForm] = useState({
    participant_id: '',
    participant_name: '',
    purpose: 'employment',
    pickup_location: '',
    dropoff_location: '',
    pickup_time: '',
    return_trip: false,
    return_pickup_time: '',
    weekday_pattern: [],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    review_cycle: 'monthly',
    approval_status: 'pending',
    funding_source: '',
    estimated_cost_per_ride: '',
    assigned_provider_id: '',
    assigned_provider_name: '',
    status: 'active',
    notes: '',
    ...existing,
  });
  const [saving, setSaving] = useState(false);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleDay = (day) => {
    setForm(prev => ({
      ...prev,
      weekday_pattern: prev.weekday_pattern?.includes(day)
        ? prev.weekday_pattern.filter(d => d !== day)
        : [...(prev.weekday_pattern || []), day],
    }));
  };

  const handleParticipantChange = (id) => {
    const p = participants.find(p => p.id === id);
    if (p) {
      setForm(prev => ({
        ...prev,
        participant_id: id,
        participant_name: `${p.first_name} ${p.last_name}`,
        pickup_location: prev.pickup_location || p.pickup_address || '',
      }));
    }
  };

  const handleProviderChange = (id) => {
    const p = providers.find(p => p.id === id);
    if (p) setForm(prev => ({ ...prev, assigned_provider_id: id, assigned_provider_name: p.name }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = { ...form, estimated_cost_per_ride: form.estimated_cost_per_ride ? Number(form.estimated_cost_per_ride) : undefined };
    await onSave(data);
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">{existing ? 'Edit Recurring Plan' : 'New Recurring Plan'}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}><X className="w-4 h-4" /></Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Participant</Label>
              <Select value={form.participant_id} onValueChange={handleParticipantChange}>
                <SelectTrigger><SelectValue placeholder="Select participant" /></SelectTrigger>
                <SelectContent>
                  {participants.map(p => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Purpose</Label>
              <Select value={form.purpose} onValueChange={v => update('purpose', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {purposes.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Pickup Location</Label>
              <Input value={form.pickup_location} onChange={e => update('pickup_location', e.target.value)} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Dropoff Location</Label>
              <Input value={form.dropoff_location} onChange={e => update('dropoff_location', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Pickup Time</Label>
              <Input type="time" value={form.pickup_time} onChange={e => update('pickup_time', e.target.value)} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={form.return_trip} onCheckedChange={v => update('return_trip', v)} />
              <Label>Return Trip</Label>
              {form.return_trip && (
                <Input type="time" value={form.return_pickup_time} onChange={e => update('return_pickup_time', e.target.value)} className="w-32 ml-2" />
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Weekday Pattern</Label>
              <div className="flex flex-wrap gap-3 mt-1">
                {weekdays.map(day => (
                  <label key={day} className="flex items-center gap-2 text-sm capitalize">
                    <Checkbox checked={form.weekday_pattern?.includes(day)} onCheckedChange={() => toggleDay(day)} />
                    {day.slice(0, 3)}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={e => update('end_date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Review Cycle</Label>
              <Select value={form.review_cycle} onValueChange={v => update('review_cycle', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Biweekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Approval Status</Label>
              <Select value={form.approval_status} onValueChange={v => update('approval_status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assigned Provider</Label>
              <Select value={form.assigned_provider_id} onValueChange={handleProviderChange}>
                <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>
                  {providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Funding Source</Label>
              <Input value={form.funding_source} onChange={e => update('funding_source', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Est. Cost Per Ride ($)</Label>
              <Input type="number" step="0.01" value={form.estimated_cost_per_ride} onChange={e => update('estimated_cost_per_ride', e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : existing ? 'Update Plan' : 'Create Plan'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}