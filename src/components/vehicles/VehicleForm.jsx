import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';

const defaultState = {
  vehicle_id: '', nickname: '', make: '', model: '', year: new Date().getFullYear(),
  plate: '', vin: '', color: '', seat_capacity: 7, wheelchair_accessible: false,
  fuel_type: 'gasoline', service_status: 'available', status: 'active',
  assigned_driver_name: '', odometer_miles: 0,
  maintenance_due_date: '', maintenance_due_miles: '',
  last_inspection_date: '', next_inspection_date: '',
  insurance_expiry: '', registration_expiry: '', notes: ''
};

export default function VehicleForm({ existing, onSave, onCancel }) {
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
          <h1 className="text-2xl font-bold">{existing ? 'Edit Vehicle' : 'Add Vehicle'}</h1>
          <p className="text-sm text-muted-foreground">Fleet vehicle record</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Vehicle Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Vehicle ID</Label>
              <Input placeholder="e.g. VAN-001" value={form.vehicle_id || ''} onChange={e => set('vehicle_id', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nickname</Label>
              <Input placeholder="e.g. Blue Van" value={form.nickname || ''} onChange={e => set('nickname', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Year</Label>
              <Input type="number" value={form.year || ''} onChange={e => set('year', parseInt(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Make *</Label>
              <Input required value={form.make || ''} onChange={e => set('make', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Model *</Label>
              <Input required value={form.model || ''} onChange={e => set('model', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Color</Label>
              <Input value={form.color || ''} onChange={e => set('color', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">License Plate *</Label>
              <Input required value={form.plate || ''} onChange={e => set('plate', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">VIN</Label>
              <Input value={form.vin || ''} onChange={e => set('vin', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fuel Type</Label>
              <Select value={form.fuel_type || 'gasoline'} onValueChange={v => set('fuel_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasoline">Gasoline</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Seat Capacity</Label>
              <Input type="number" min="1" value={form.seat_capacity || 7} onChange={e => set('seat_capacity', parseInt(e.target.value))} />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <Switch checked={form.wheelchair_accessible || false} onCheckedChange={v => set('wheelchair_accessible', v)} />
              <Label className="text-xs">Wheelchair Accessible (ADA)</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Status & Assignment</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Service Status</Label>
              <Select value={form.service_status || 'available'} onValueChange={v => set('service_status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in_use">In Use</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="out_of_service">Out of Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Active Status</Label>
              <Select value={form.status || 'active'} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Assigned Driver</Label>
              <Input placeholder="Driver name" value={form.assigned_driver_name || ''} onChange={e => set('assigned_driver_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Odometer (miles)</Label>
              <Input type="number" min="0" value={form.odometer_miles || 0} onChange={e => set('odometer_miles', parseInt(e.target.value) || 0)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Maintenance & Compliance</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Maintenance Due Date</Label>
              <Input type="date" value={form.maintenance_due_date || ''} onChange={e => set('maintenance_due_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Maintenance Due Miles</Label>
              <Input type="number" value={form.maintenance_due_miles || ''} onChange={e => set('maintenance_due_miles', parseInt(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Last Inspection</Label>
              <Input type="date" value={form.last_inspection_date || ''} onChange={e => set('last_inspection_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Next Inspection Due</Label>
              <Input type="date" value={form.next_inspection_date || ''} onChange={e => set('next_inspection_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Insurance Expiry</Label>
              <Input type="date" value={form.insurance_expiry || ''} onChange={e => set('insurance_expiry', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Registration Expiry</Label>
              <Input type="date" value={form.registration_expiry || ''} onChange={e => set('registration_expiry', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea rows={3} value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Vehicle'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}