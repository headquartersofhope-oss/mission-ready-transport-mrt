import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';

const serviceCategories = ['employment', 'housing', 'health', 'benefits', 'legal', 'recovery', 'training', 'other'];

export default function ParticipantForm({ existing, onSave, onCancel }) {
  const [form, setForm] = useState({
    participant_id: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    pickup_address: '',
    pickup_notes: '',
    transportation_restrictions: '',
    approved_service_categories: [],
    emergency_contact_name: '',
    emergency_contact_phone: '',
    case_manager: '',
    linked_house: '',
    linked_employer: '',
    status: 'active',
    notes: '',
    ...existing,
  });
  const [saving, setSaving] = useState(false);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleCategory = (cat) => {
    setForm(prev => ({
      ...prev,
      approved_service_categories: prev.approved_service_categories?.includes(cat)
        ? prev.approved_service_categories.filter(c => c !== cat)
        : [...(prev.approved_service_categories || []), cat],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">{existing ? 'Edit Participant' : 'Add Participant'}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}><X className="w-4 h-4" /></Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input value={form.first_name} onChange={e => update('first_name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input value={form.last_name} onChange={e => update('last_name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Participant ID</Label>
              <Input value={form.participant_id} onChange={e => update('participant_id', e.target.value)} placeholder="External ID" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => update('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => update('phone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Pickup Address</Label>
              <Input value={form.pickup_address} onChange={e => update('pickup_address', e.target.value)} placeholder="Default pickup address" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Pickup Notes</Label>
              <Textarea value={form.pickup_notes} onChange={e => update('pickup_notes', e.target.value)} rows={2} placeholder="Special pickup instructions" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Transportation Restrictions</Label>
              <Textarea value={form.transportation_restrictions} onChange={e => update('transportation_restrictions', e.target.value)} rows={2} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Approved Service Categories</Label>
              <div className="flex flex-wrap gap-3 mt-1">
                {serviceCategories.map(cat => (
                  <label key={cat} className="flex items-center gap-2 text-sm capitalize">
                    <Checkbox checked={form.approved_service_categories?.includes(cat)} onCheckedChange={() => toggleCategory(cat)} />
                    {cat}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Emergency Contact Name</Label>
              <Input value={form.emergency_contact_name} onChange={e => update('emergency_contact_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Emergency Contact Phone</Label>
              <Input value={form.emergency_contact_phone} onChange={e => update('emergency_contact_phone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Case Manager</Label>
              <Input value={form.case_manager} onChange={e => update('case_manager', e.target.value)} placeholder="Name or email" />
            </div>
            <div className="space-y-2">
              <Label>Linked House</Label>
              <Input value={form.linked_house} onChange={e => update('linked_house', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Linked Employer</Label>
              <Input value={form.linked_employer} onChange={e => update('linked_employer', e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : existing ? 'Update' : 'Add Participant'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}