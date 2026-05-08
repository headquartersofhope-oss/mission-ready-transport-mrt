import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

export default function VolunteerForm({ volunteer, onSave, onCancel }) {
  const isEdit = !!volunteer?.id;
  const [form, setForm] = useState(volunteer || {
    first_name: '', last_name: '', email: '', phone: '', address: '',
    volunteer_type: 'driver', license_number: '', license_expiry: '',
    vehicle_make: '', vehicle_model: '', vehicle_year: '', vehicle_plate: '',
    vehicle_insurance_expiry: '', background_check_date: '',
    background_check_status: 'pending', availability_days: [],
    availability_notes: '', service_area: '',
    total_hours_volunteered: 0, total_trips_completed: 0,
    referred_by: '', church_affiliation: '',
    status: 'pending_clearance', onboarding_complete: false, notes: '',
  });

  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target?.value ?? e }));

  const toggleDay = (day) => setForm(p => ({
    ...p,
    availability_days: p.availability_days?.includes(day)
      ? p.availability_days.filter(d => d !== day)
      : [...(p.availability_days || []), day],
  }));

  const saveMutation = useMutation({
    mutationFn: (data) => isEdit ? base44.entities.Volunteer.update(volunteer.id, data) : base44.entities.Volunteer.create(data),
    onSuccess: onSave,
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Volunteer.delete(volunteer.id),
    onSuccess: onSave,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{isEdit ? 'Edit Volunteer' : 'Add Volunteer'}</h1>
            <p className="text-muted-foreground text-sm">Volunteer driver / support record</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEdit && <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate()}><Trash2 className="w-4 h-4" /></Button>}
          <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
            <Save className="w-4 h-4" />{saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Personal Info</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="First name *" value={form.first_name} onChange={f('first_name')} />
              <Input placeholder="Last name *" value={form.last_name} onChange={f('last_name')} />
            </div>
            <Input placeholder="Phone *" value={form.phone} onChange={f('phone')} />
            <Input placeholder="Email" value={form.email} onChange={f('email')} />
            <Input placeholder="Address" value={form.address} onChange={f('address')} />
            <Input placeholder="Church affiliation" value={form.church_affiliation} onChange={f('church_affiliation')} />
            <Input placeholder="Referred by" value={form.referred_by} onChange={f('referred_by')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Status & Clearance</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={form.volunteer_type} onValueChange={v => setForm(p => ({...p, volunteer_type: v}))}>
              <SelectTrigger><SelectValue placeholder="Volunteer type" /></SelectTrigger>
              <SelectContent>
                {['driver','admin_support','event_helper','mechanic','fundraiser','other'].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g,' ')}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v}))}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {['active','inactive','pending_clearance','suspended'].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g,' ')}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.background_check_status} onValueChange={v => setForm(p => ({...p, background_check_status: v}))}>
                <SelectTrigger><SelectValue placeholder="BG check" /></SelectTrigger>
                <SelectContent>
                  {['pending','clear','flagged','not_required'].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g,' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Input type="date" placeholder="BG check date" value={form.background_check_date} onChange={f('background_check_date')} />
            <div className="flex items-center gap-3">
              <Switch checked={form.onboarding_complete} onCheckedChange={v => setForm(p => ({...p, onboarding_complete: v}))} />
              <span className="text-sm">Onboarding complete</span>
            </div>
            <Input placeholder="Service area" value={form.service_area} onChange={f('service_area')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Vehicle & License (if driver)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="License number" value={form.license_number} onChange={f('license_number')} />
              <Input type="date" placeholder="License expiry" value={form.license_expiry} onChange={f('license_expiry')} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Make" value={form.vehicle_make} onChange={f('vehicle_make')} />
              <Input placeholder="Model" value={form.vehicle_model} onChange={f('vehicle_model')} />
              <Input type="number" placeholder="Year" value={form.vehicle_year} onChange={f('vehicle_year')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Plate" value={form.vehicle_plate} onChange={f('vehicle_plate')} />
              <Input type="date" placeholder="Insurance expiry" value={form.vehicle_insurance_expiry} onChange={f('vehicle_insurance_expiry')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Availability & Stats</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Available days</p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(d => (
                  <button key={d} onClick={() => toggleDay(d)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${form.availability_days?.includes(d) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}>
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            <Input placeholder="Availability notes" value={form.availability_notes} onChange={f('availability_notes')} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Total hours" value={form.total_hours_volunteered} onChange={f('total_hours_volunteered')} />
              <Input type="number" placeholder="Total trips" value={form.total_trips_completed} onChange={f('total_trips_completed')} />
            </div>
            <Textarea placeholder="Notes..." value={form.notes} onChange={f('notes')} className="h-20" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}