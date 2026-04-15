import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

const purposes = [
  { value: 'employment', label: 'Employment' },
  { value: 'housing', label: 'Housing' },
  { value: 'health', label: 'Health / Medical' },
  { value: 'benefits', label: 'Benefits Access' },
  { value: 'legal', label: 'Legal' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'training', label: 'Training / Education' },
  { value: 'court', label: 'Court' },
  { value: 'other', label: 'Other' },
];

export default function RequestForm({ existingRequest, onSave, onCancel }) {
  const isEdit = !!existingRequest;

  const { data: participants = [] } = useQuery({
    queryKey: ['participants-list'],
    queryFn: () => base44.entities.Participant.filter({ status: 'active' }, '-created_date', 500),
  });

  const [form, setForm] = useState({
    participant_id: '',
    participant_name: '',
    request_date: new Date().toISOString().split('T')[0],
    pickup_time: '',
    pickup_location: '',
    dropoff_location: '',
    return_trip: false,
    return_pickup_time: '',
    purpose: 'employment',
    priority: 'standard',
    special_instructions: '',
    estimated_cost: '',
    funding_source: '',
    ...existingRequest,
  });

  const [saving, setSaving] = useState(false);

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

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = { ...form, estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : undefined };
    await onSave(data);
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">{isEdit ? 'Edit Request' : 'New Transport Request'}</CardTitle>
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
                  {participants.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Request Date</Label>
              <Input type="date" value={form.request_date} onChange={e => update('request_date', e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Pickup Time</Label>
              <Input type="time" value={form.pickup_time} onChange={e => update('pickup_time', e.target.value)} />
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
              <Input value={form.pickup_location} onChange={e => update('pickup_location', e.target.value)} required placeholder="Full address" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Dropoff Location</Label>
              <Input value={form.dropoff_location} onChange={e => update('dropoff_location', e.target.value)} required placeholder="Full address" />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.return_trip} onCheckedChange={v => update('return_trip', v)} />
              <Label>Return Trip Needed</Label>
            </div>

            {form.return_trip && (
              <div className="space-y-2">
                <Label>Return Pickup Time</Label>
                <Input type="time" value={form.return_pickup_time} onChange={e => update('return_pickup_time', e.target.value)} />
              </div>
            )}

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => update('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estimated Cost ($)</Label>
              <Input type="number" step="0.01" value={form.estimated_cost} onChange={e => update('estimated_cost', e.target.value)} placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <Label>Funding Source</Label>
              <Input value={form.funding_source} onChange={e => update('funding_source', e.target.value)} placeholder="e.g. Grant, Program Fund" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Special Instructions</Label>
              <Textarea value={form.special_instructions} onChange={e => update('special_instructions', e.target.value)} placeholder="Any special needs or notes" rows={3} />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Update Request' : 'Submit Request'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}