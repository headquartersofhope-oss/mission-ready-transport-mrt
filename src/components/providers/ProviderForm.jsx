import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

const providerTypes = [
  { value: 'bus_pass_vendor', label: 'Bus Pass Vendor' },
  { value: 'volunteer_driver', label: 'Volunteer Driver' },
  { value: 'rideshare_voucher', label: 'Rideshare Voucher' },
  { value: 'staff_driver', label: 'Staff Driver' },
  { value: 'partner_org', label: 'Partner Organization' },
  { value: 'reimbursement', label: 'Reimbursement' },
];

const costMethods = [
  { value: 'per_ride', label: 'Per Ride' },
  { value: 'per_mile', label: 'Per Mile' },
  { value: 'flat_rate', label: 'Flat Rate' },
  { value: 'monthly_pass', label: 'Monthly Pass' },
  { value: 'voucher', label: 'Voucher' },
  { value: 'volunteer_no_cost', label: 'Volunteer (No Cost)' },
  { value: 'reimbursement', label: 'Reimbursement' },
];

export default function ProviderForm({ existing, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    provider_type: 'staff_driver',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    service_area: '',
    cost_method: 'per_ride',
    base_cost: '',
    availability: '',
    restrictions: '',
    status: 'active',
    notes: '',
    ...existing,
  });
  const [saving, setSaving] = useState(false);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = { ...form, base_cost: form.base_cost ? Number(form.base_cost) : undefined };
    await onSave(data);
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">{existing ? 'Edit Provider' : 'Add Provider'}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}><X className="w-4 h-4" /></Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Provider Name *</Label>
              <Input value={form.name} onChange={e => update('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Provider Type *</Label>
              <Select value={form.provider_type} onValueChange={v => update('provider_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {providerTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contact Name</Label>
              <Input value={form.contact_name} onChange={e => update('contact_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <Input value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input type="email" value={form.contact_email} onChange={e => update('contact_email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => update('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Service Area</Label>
              <Input value={form.service_area} onChange={e => update('service_area', e.target.value)} placeholder="e.g. Metro area, County" />
            </div>
            <div className="space-y-2">
              <Label>Cost Method</Label>
              <Select value={form.cost_method} onValueChange={v => update('cost_method', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {costMethods.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Base Cost ($)</Label>
              <Input type="number" step="0.01" value={form.base_cost} onChange={e => update('base_cost', e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Availability</Label>
              <Input value={form.availability} onChange={e => update('availability', e.target.value)} placeholder="e.g. Mon-Fri 6am-8pm" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Restrictions</Label>
              <Textarea value={form.restrictions} onChange={e => update('restrictions', e.target.value)} rows={2} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : existing ? 'Update' : 'Add Provider'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}