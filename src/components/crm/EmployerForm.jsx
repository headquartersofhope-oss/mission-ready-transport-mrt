import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

export default function EmployerForm({ employer, onSave, onCancel }) {
  const isEdit = !!employer?.id;
  const [form, setForm] = useState(employer || {
    company_name: '', industry: 'other', contact_name: '', contact_title: '',
    contact_phone: '', contact_email: '', address: '', website: '',
    employee_count: '', mrt_enrolled_employees: 0,
    partnership_type: 'prospect', contract_value_monthly: '',
    contract_start_date: '', contract_end_date: '',
    billing_rate: '', payment_terms: 'net_30',
    preferred_pickup_times: '', work_shift_schedule: '',
    status: 'prospect', lead_source: 'other',
    next_followup_date: '', notes: '', account_manager: '',
  });

  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target?.value ?? e }));

  const saveMutation = useMutation({
    mutationFn: (data) => isEdit ? base44.entities.Employer.update(employer.id, data) : base44.entities.Employer.create(data),
    onSuccess: onSave,
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Employer.delete(employer.id),
    onSuccess: onSave,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{isEdit ? 'Edit Employer' : 'Add Employer Partner'}</h1>
            <p className="text-muted-foreground text-sm">Employer CRM record</p>
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
          <CardHeader><CardTitle className="text-base">Company Info</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Company name *" value={form.company_name} onChange={f('company_name')} />
            <Select value={form.industry} onValueChange={v => setForm(p => ({...p, industry: v}))}>
              <SelectTrigger><SelectValue placeholder="Industry" /></SelectTrigger>
              <SelectContent>
                {['healthcare','retail','warehouse','food_service','construction','hospitality','manufacturing','education','government','nonprofit','other'].map(i => (
                  <SelectItem key={i} value={i}>{i.replace('_',' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Website" value={form.website} onChange={f('website')} />
            <Input placeholder="Address" value={form.address} onChange={f('address')} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Total employees" value={form.employee_count} onChange={f('employee_count')} />
              <Input type="number" placeholder="MRT enrolled" value={form.mrt_enrolled_employees} onChange={f('mrt_enrolled_employees')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Primary Contact</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Contact name" value={form.contact_name} onChange={f('contact_name')} />
            <Input placeholder="Title / Role" value={form.contact_title} onChange={f('contact_title')} />
            <Input placeholder="Phone" value={form.contact_phone} onChange={f('contact_phone')} />
            <Input placeholder="Email" value={form.contact_email} onChange={f('contact_email')} />
            <Input placeholder="Account manager (MRT staff)" value={form.account_manager} onChange={f('account_manager')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Partnership & Contract</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v}))}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {['prospect','active','paused','churned'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.partnership_type} onValueChange={v => setForm(p => ({...p, partnership_type: v}))}>
                <SelectTrigger><SelectValue placeholder="Partnership type" /></SelectTrigger>
                <SelectContent>
                  {['workforce_transport','delivery_contract','both','prospect'].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g,' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Monthly contract value $" value={form.contract_value_monthly} onChange={f('contract_value_monthly')} />
              <Input type="number" placeholder="Billing rate per trip $" value={form.billing_rate} onChange={f('billing_rate')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" placeholder="Contract start" value={form.contract_start_date} onChange={f('contract_start_date')} />
              <Input type="date" placeholder="Contract end" value={form.contract_end_date} onChange={f('contract_end_date')} />
            </div>
            <Select value={form.payment_terms} onValueChange={v => setForm(p => ({...p, payment_terms: v}))}>
              <SelectTrigger><SelectValue placeholder="Payment terms" /></SelectTrigger>
              <SelectContent>
                {['net_15','net_30','net_60','prepaid'].map(s => <SelectItem key={s} value={s}>{s.replace('_',' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Schedule & Notes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={form.lead_source} onValueChange={v => setForm(p => ({...p, lead_source: v}))}>
              <SelectTrigger><SelectValue placeholder="Lead source" /></SelectTrigger>
              <SelectContent>
                {['referral','cold_outreach','pathways_hub','church_partner','online','other'].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g,' ')}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Preferred pickup times (e.g. 6am-8am)" value={form.preferred_pickup_times} onChange={f('preferred_pickup_times')} />
            <Input placeholder="Work shift schedule" value={form.work_shift_schedule} onChange={f('work_shift_schedule')} />
            <Input type="date" placeholder="Next follow-up date" value={form.next_followup_date} onChange={f('next_followup_date')} />
            <Textarea placeholder="Notes..." value={form.notes} onChange={f('notes')} className="h-24" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}