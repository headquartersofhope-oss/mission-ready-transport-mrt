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

export default function ContractForm({ contract, onSave, onCancel }) {
  const isEdit = !!contract?.id;
  const [form, setForm] = useState(contract || {
    contract_number: '', contract_name: '', client_type: 'employer',
    client_name: '', contract_type: 'workforce_transport',
    start_date: '', end_date: '', auto_renew: false, renewal_notice_days: 30,
    total_contract_value: '', monthly_value: '',
    rate_type: 'per_trip', rate_amount: '',
    payment_terms: 'net_30', billing_contact_email: '',
    service_description: '', scope_of_work: '', service_area: '',
    estimated_trips_monthly: '', status: 'draft',
    signed_date: '', termination_reason: '', document_url: '',
    account_manager: '', notes: '',
  });

  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target?.value ?? e }));

  const saveMutation = useMutation({
    mutationFn: (data) => isEdit ? base44.entities.Contract.update(contract.id, data) : base44.entities.Contract.create(data),
    onSuccess: onSave,
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Contract.delete(contract.id),
    onSuccess: onSave,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{isEdit ? 'Edit Contract' : 'New Contract'}</h1>
            <p className="text-muted-foreground text-sm">Service agreement record</p>
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
          <CardHeader><CardTitle className="text-base">Contract Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Contract name *" value={form.contract_name} onChange={f('contract_name')} />
            <Input placeholder="Contract number" value={form.contract_number} onChange={f('contract_number')} />
            <div className="grid grid-cols-2 gap-2">
              <Select value={form.client_type} onValueChange={v => setForm(p => ({...p, client_type: v}))}>
                <SelectTrigger><SelectValue placeholder="Client type" /></SelectTrigger>
                <SelectContent>
                  {['employer','delivery_company','medical_provider','government','nonprofit','church','other'].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g,' ')}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.contract_type} onValueChange={v => setForm(p => ({...p, contract_type: v}))}>
                <SelectTrigger><SelectValue placeholder="Service type" /></SelectTrigger>
                <SelectContent>
                  {['workforce_transport','package_delivery','medical_delivery','contract_route','mixed_services'].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g,' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Client name *" value={form.client_name} onChange={f('client_name')} />
            <Select value={form.status} onValueChange={v => setForm(p => ({...p, status: v}))}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {['draft','pending_signature','active','expired','terminated','renewed'].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g,' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Dates & Renewal</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Start Date *</label>
                <Input type="date" value={form.start_date} onChange={f('start_date')} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
                <Input type="date" value={form.end_date} onChange={f('end_date')} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Signed Date</label>
              <Input type="date" value={form.signed_date} onChange={f('signed_date')} />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Switch checked={form.auto_renew} onCheckedChange={v => setForm(p => ({...p, auto_renew: v}))} />
              <span className="text-sm">Auto-renew</span>
              {form.auto_renew && (
                <Input type="number" placeholder="Notice days" value={form.renewal_notice_days} onChange={f('renewal_notice_days')} className="w-28" />
              )}
            </div>
            <Input placeholder="Document / file URL" value={form.document_url} onChange={f('document_url')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Financials</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Total contract value $" value={form.total_contract_value} onChange={f('total_contract_value')} />
              <Input type="number" placeholder="Monthly value $" value={form.monthly_value} onChange={f('monthly_value')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={form.rate_type} onValueChange={v => setForm(p => ({...p, rate_type: v}))}>
                <SelectTrigger><SelectValue placeholder="Rate type" /></SelectTrigger>
                <SelectContent>
                  {['per_trip','per_mile','flat_monthly','hourly','custom'].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g,' ')}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Rate amount $" value={form.rate_amount} onChange={f('rate_amount')} />
            </div>
            <Select value={form.payment_terms} onValueChange={v => setForm(p => ({...p, payment_terms: v}))}>
              <SelectTrigger><SelectValue placeholder="Payment terms" /></SelectTrigger>
              <SelectContent>
                {['net_15','net_30','net_60','prepaid','monthly'].map(t => <SelectItem key={t} value={t}>{t.replace('_',' ')}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Billing contact email" value={form.billing_contact_email} onChange={f('billing_contact_email')} />
            <Input type="number" placeholder="Estimated monthly trips" value={form.estimated_trips_monthly} onChange={f('estimated_trips_monthly')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Scope & Notes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Service area / geography" value={form.service_area} onChange={f('service_area')} />
            <Textarea placeholder="Service description..." value={form.service_description} onChange={f('service_description')} className="h-20" />
            <Textarea placeholder="Scope of work details..." value={form.scope_of_work} onChange={f('scope_of_work')} className="h-20" />
            <Input placeholder="Account manager" value={form.account_manager} onChange={f('account_manager')} />
            <Textarea placeholder="Notes..." value={form.notes} onChange={f('notes')} className="h-16" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}