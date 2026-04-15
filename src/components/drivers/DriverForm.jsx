import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';

const defaultState = {
  driver_id: '', first_name: '', last_name: '', phone: '', email: '',
  license_number: '', license_expiry: '', license_status: 'valid',
  insurance_status: 'current', insurance_expiry: '',
  availability: 'available', shift_schedule: '',
  assigned_vehicle_name: '', backup_vehicle_eligible: false,
  service_area: '', languages: [], notes: '', status: 'active',
  emergency_contact_name: '', emergency_contact_phone: '',
  hire_date: '', linked_user_email: '',
  total_rides_completed: 0, on_time_rate: 100, incident_count: 0, cancellation_count: 0
};

export default function DriverForm({ existing, onSave, onCancel }) {
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
          <h1 className="text-2xl font-bold">{existing ? 'Edit Driver' : 'Add Driver'}</h1>
          <p className="text-sm text-muted-foreground">Driver profile and assignment details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Basic Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Driver ID</Label>
              <Input placeholder="e.g. DRV-001" value={form.driver_id || ''} onChange={e => set('driver_id', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">First Name *</Label>
              <Input required value={form.first_name || ''} onChange={e => set('first_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Last Name *</Label>
              <Input required value={form.last_name || ''} onChange={e => set('last_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone *</Label>
              <Input required value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Linked User Email</Label>
              <Input placeholder="For driver portal login" value={form.linked_user_email || ''} onChange={e => set('linked_user_email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hire Date</Label>
              <Input type="date" value={form.hire_date || ''} onChange={e => set('hire_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={form.status || 'active'} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Availability</Label>
              <Select value={form.availability || 'available'} onValueChange={v => set('availability', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="on_duty">On Duty</SelectItem>
                  <SelectItem value="off_duty">Off Duty</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">License & Compliance</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">License Number</Label>
              <Input value={form.license_number || ''} onChange={e => set('license_number', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">License Expiry</Label>
              <Input type="date" value={form.license_expiry || ''} onChange={e => set('license_expiry', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">License Status</Label>
              <Select value={form.license_status || 'valid'} onValueChange={v => set('license_status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="valid">Valid</SelectItem>
                  <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Insurance Status</Label>
              <Select value={form.insurance_status || 'current'} onValueChange={v => set('insurance_status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="not_required">Not Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Insurance Expiry</Label>
              <Input type="date" value={form.insurance_expiry || ''} onChange={e => set('insurance_expiry', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Assignment & Schedule</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Assigned Vehicle</Label>
              <Input placeholder="e.g. Van 1 – Blue Ford" value={form.assigned_vehicle_name || ''} onChange={e => set('assigned_vehicle_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Shift Schedule</Label>
              <Input placeholder="e.g. Mon-Fri 6am-4pm" value={form.shift_schedule || ''} onChange={e => set('shift_schedule', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Service Area</Label>
              <Input placeholder="e.g. Metro Area" value={form.service_area || ''} onChange={e => set('service_area', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Performance & History</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Total Rides Completed</Label>
              <Input type="number" min="0" value={form.total_rides_completed || 0} onChange={e => set('total_rides_completed', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">On-Time Rate (%)</Label>
              <Input type="number" min="0" max="100" value={form.on_time_rate || 100} onChange={e => set('on_time_rate', parseInt(e.target.value) || 100)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Incident Count</Label>
              <Input type="number" min="0" value={form.incident_count || 0} onChange={e => set('incident_count', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cancellation Count</Label>
              <Input type="number" min="0" value={form.cancellation_count || 0} onChange={e => set('cancellation_count', parseInt(e.target.value) || 0)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Emergency Contact & Notes</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Emergency Contact Name</Label>
              <Input value={form.emergency_contact_name || ''} onChange={e => set('emergency_contact_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Emergency Contact Phone</Label>
              <Input value={form.emergency_contact_phone || ''} onChange={e => set('emergency_contact_phone', e.target.value)} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea rows={3} value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Driver'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}