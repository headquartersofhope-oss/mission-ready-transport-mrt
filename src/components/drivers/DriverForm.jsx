import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Truck } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const defaultState = {
  driver_id: '', first_name: '', last_name: '', phone: '', email: '',
  linked_user_email: '',
  license_number: '', license_expiry: '', license_status: 'valid',
  insurance_status: 'current', insurance_expiry: '',
  availability: 'available', shift_schedule: '',
  active_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  assigned_vehicle_id: '', assigned_vehicle_name: '',
  backup_vehicle_eligible: false,
  backup_driver_role: 'none',
  service_area: '', territory_zones: '',
  languages: [], notes: '', admin_notes: '', status: 'active',
  emergency_contact_name: '', emergency_contact_phone: '',
  hire_date: '',
  total_rides_completed: 0, on_time_rate: 100, incident_count: 0, cancellation_count: 0
};

export default function DriverForm({ existing, onSave, onCancel }) {
  const [form, setForm] = useState(existing || defaultState);
  const [saving, setSaving] = useState(false);

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list('nickname', 100),
  });

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleDay = (day) => {
    const days = form.active_days || [];
    set('active_days', days.includes(day) ? days.filter(d => d !== day) : [...days, day]);
  };

  const handleVehicleSelect = (vehicleId) => {
    const v = vehicles.find(v => v.id === vehicleId);
    set('assigned_vehicle_id', vehicleId);
    set('assigned_vehicle_name', v ? (v.nickname || `${v.make} ${v.model}`) : '');
  };

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
          <p className="text-sm text-muted-foreground">Driver profile, dispatch configuration, and login setup</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Identity */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Identity & Login</CardTitle></CardHeader>
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
              <Label className="text-xs">Portal Login (Linked User Email)</Label>
              <Input placeholder="Links this driver to a login account" value={form.linked_user_email || ''} onChange={e => set('linked_user_email', e.target.value)} />
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
              <Label className="text-xs">Current Availability</Label>
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

        {/* Schedule & Territory */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Schedule, Territory & Vehicle</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Shift Schedule</Label>
                <Input placeholder="e.g. Mon-Fri 6am-4pm" value={form.shift_schedule || ''} onChange={e => set('shift_schedule', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Service Area</Label>
                <Input placeholder="e.g. Metro Area, Southside" value={form.service_area || ''} onChange={e => set('service_area', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Territory / Zones</Label>
                <Input placeholder="e.g. Downtown, Eastside, Zone 3" value={form.territory_zones || ''} onChange={e => set('territory_zones', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Assigned Vehicle</Label>
                <Select value={form.assigned_vehicle_id || ''} onValueChange={handleVehicleSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>No vehicle assigned</SelectItem>
                    {vehicles.filter(v => v.status === 'active').map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        <span className="flex items-center gap-2">
                          <Truck className="w-3.5 h-3.5" />
                          {v.nickname || `${v.make} ${v.model}`} — {v.plate}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Days */}
            <div className="space-y-2">
              <Label className="text-xs">Active Days</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <button key={day} type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors capitalize
                      ${(form.active_days || []).includes(day)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-transparent border-input text-muted-foreground hover:bg-muted'}`}>
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Backup Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Backup Driver Role</Label>
                <Select value={form.backup_driver_role || 'none'} onValueChange={v => set('backup_driver_role', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not a backup</SelectItem>
                    <SelectItem value="primary_backup">Primary Backup</SelectItem>
                    <SelectItem value="secondary_backup">Secondary Backup</SelectItem>
                    <SelectItem value="on_call">On-Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 mt-5">
                <Checkbox id="backup_vehicle" checked={!!form.backup_vehicle_eligible}
                  onCheckedChange={v => set('backup_vehicle_eligible', v)} />
                <Label htmlFor="backup_vehicle" className="text-sm cursor-pointer">Eligible for backup vehicle assignment</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* License */}
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

        {/* Performance */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Performance Metrics</CardTitle></CardHeader>
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

        {/* Emergency + Notes */}
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
            <div className="space-y-1.5">
              <Label className="text-xs">Driver Notes (visible to driver)</Label>
              <Textarea rows={2} value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Admin Notes (internal only)</Label>
              <Textarea rows={2} placeholder="Internal admin notes — not shown to driver" value={form.admin_notes || ''} onChange={e => set('admin_notes', e.target.value)} />
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