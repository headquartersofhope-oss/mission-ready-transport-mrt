import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

export default function DonorForm({ donor, onSave, onCancel }) {
  const isEdit = !!donor?.id;
  const [form, setForm] = useState(donor || {
    donor_name: '', donor_type: 'individual', contact_name: '',
    contact_email: '', contact_phone: '', address: '',
    total_given_lifetime: 0, total_given_ytd: 0,
    last_gift_amount: '', last_gift_date: '', largest_gift_amount: '',
    giving_frequency: 'one_time',
    designation: 'unrestricted',
    relationship_stage: 'prospect', stewardship_level: 'standard',
    communication_preference: 'email',
    next_ask_date: '', ask_amount: '',
    notes: '', status: 'active',
  });

  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target?.value ?? e }));

  const saveMutation = useMutation({
    mutationFn: (data) => isEdit ? base44.entities.Donor.update(donor.id, data) : base44.entities.Donor.create(data),
    onSuccess: onSave,
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Donor.delete(donor.id),
    onSuccess: onSave,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{isEdit ? 'Edit Donor' : 'Add Donor'}</h1>
            <p className="text-muted-foreground text-sm">Donor stewardship record</p>
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
          <CardHeader><CardTitle className="text-base">Donor Info</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Donor / Organization name *" value={form.donor_name} onChange={f('donor_name')} />
            <Select value={form.donor_type} onValueChange={v => setForm(p => ({...p, donor_type: v}))}>
              <SelectTrigger><SelectValue placeholder="Donor type" /></SelectTrigger>
              <SelectContent>
                {['individual','church','foundation','corporation','government_grant','estate'].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g,' ')}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Primary contact name" value={form.contact_name} onChange={f('contact_name')} />
            <Input placeholder="Email" value={form.contact_email} onChange={f('contact_email')} />
            <Input placeholder="Phone" value={form.contact_phone} onChange={f('contact_phone')} />
            <Input placeholder="Address" value={form.address} onChange={f('address')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Giving History</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Lifetime giving $" value={form.total_given_lifetime} onChange={f('total_given_lifetime')} />
              <Input type="number" placeholder="YTD giving $" value={form.total_given_ytd} onChange={f('total_given_ytd')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Last gift amount $" value={form.last_gift_amount} onChange={f('last_gift_amount')} />
              <Input type="date" placeholder="Last gift date" value={form.last_gift_date} onChange={f('last_gift_date')} />
            </div>
            <Input type="number" placeholder="Largest gift $" value={form.largest_gift_amount} onChange={f('largest_gift_amount')} />
            <Select value={form.giving_frequency} onValueChange={v => setForm(p => ({...p, giving_frequency: v}))}>
              <SelectTrigger><SelectValue placeholder="Giving frequency" /></SelectTrigger>
              <SelectContent>
                {['one_time','monthly','quarterly','annual','event_based'].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g,' ')}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.designation} onValueChange={v => setForm(p => ({...p, designation: v}))}>
              <SelectTrigger><SelectValue placeholder="Designation" /></SelectTrigger>
              <SelectContent>
                {['general_operations','transport_fund','vehicle_fund','driver_training','participant_emergency','unrestricted'].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g,' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Relationship & Stewardship</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Select value={form.relationship_stage} onValueChange={v => setForm(p => ({...p, relationship_stage: v}))}>
                <SelectTrigger><SelectValue placeholder="Relationship stage" /></SelectTrigger>
                <SelectContent>
                  {['prospect','first_time','recurring','major_donor','lapsed','champion'].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g,' ')}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.stewardship_level} onValueChange={v => setForm(p => ({...p, stewardship_level: v}))}>
                <SelectTrigger><SelectValue placeholder="Stewardship" /></SelectTrigger>
                <SelectContent>
                  {['standard','mid_level','major','planned_giving'].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g,' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v}))}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {['active','lapsed','inactive'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.communication_preference} onValueChange={v => setForm(p => ({...p, communication_preference: v}))}>
              <SelectTrigger><SelectValue placeholder="Communication preference" /></SelectTrigger>
              <SelectContent>
                {['email','phone','mail','none'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" placeholder="Next ask date" value={form.next_ask_date} onChange={f('next_ask_date')} />
              <Input type="number" placeholder="Ask amount $" value={form.ask_amount} onChange={f('ask_amount')} />
            </div>
            <Textarea placeholder="Notes..." value={form.notes} onChange={f('notes')} className="h-20" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}