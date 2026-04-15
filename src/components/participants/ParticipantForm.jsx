import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, X } from 'lucide-react';

const SERVICE_CATEGORIES = [
  'work_commute', 'job_interview', 'employment', 'medical', 'counseling_treatment',
  'court_probation', 'dmv_id', 'benefits_office', 'school_training',
  'housing_appointment', 'grocery_essential', 'emergency_support', 'recovery', 'other'
];

const defaultState = {
  participant_id: '', first_name: '', last_name: '', preferred_name: '',
  phone: '', email: '', preferred_communication: 'text',
  pickup_address: '', pickup_notes: '',
  transportation_restrictions: '', mobility_needs: '',
  approved_service_categories: [],
  emergency_contact_name: '', emergency_contact_phone: '',
  case_manager: '', linked_house: '', linked_employer: '',
  eligibility_notes: '',
  no_show_count: 0, cancellation_count: 0, total_rides_completed: 0,
  reliability_rating: 'good', status: 'active', notes: ''
};

export default function ParticipantForm({ existing, onSave, onCancel }) {
  const [form, setForm] = useState(existing || defaultState);
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleCategory = (cat) => {
    const current = form.approved_service_categories || [];
    set('approved_service_categories', current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat]);
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
          <h1 className="text-2xl font-bold">{existing ? 'Edit Client' : 'Add Client'}</h1>
          <p className="text-sm text-muted-foreground">Client profile and transportation details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Personal Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Client ID</Label>
              <Input placeholder="e.g. P-1001" value={form.participant_id || ''} onChange={e => set('participant_id', e.target.value)} />
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
              <Label className="text-xs">Preferred Name</Label>
              <Input value={form.preferred_name || ''} onChange={e => set('preferred_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone</Label>
              <Input value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Preferred Communication</Label>
              <Select value={form.preferred_communication || 'text'} onValueChange={v => set('preferred_communication', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Message</SelectItem>
                  <SelectItem value="phone_call">Phone Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="staff_contact">Staff Contact</SelectItem>
                </SelectContent>
              </Select>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Transportation Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Default Pickup Address</Label>
                <Input value={form.pickup_address || ''} onChange={e => set('pickup_address', e.target.value)} placeholder="Home or regular pickup address" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Pickup Notes</Label>
                <Input value={form.pickup_notes || ''} onChange={e => set('pickup_notes', e.target.value)} placeholder="e.g. Ring buzzer #3B" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Mobility Needs</Label>
                <Input value={form.mobility_needs || ''} onChange={e => set('mobility_needs', e.target.value)} placeholder="e.g. Wheelchair, walker, no stairs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Transportation Restrictions</Label>
                <Input value={form.transportation_restrictions || ''} onChange={e => set('transportation_restrictions', e.target.value)} placeholder="e.g. No Lyft, ADA only" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Approved Service Categories</Label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map(cat => {
                  const active = (form.approved_service_categories || []).includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all capitalize
                        ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50'}`}
                    >
                      {cat.replace(/_/g, ' ')}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Program & Case Management</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Case Manager</Label>
              <Input value={form.case_manager || ''} onChange={e => set('case_manager', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Linked House / Program</Label>
              <Input value={form.linked_house || ''} onChange={e => set('linked_house', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Linked Employer</Label>
              <Input value={form.linked_employer || ''} onChange={e => set('linked_employer', e.target.value)} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs">Eligibility Notes</Label>
              <Textarea rows={2} value={form.eligibility_notes || ''} onChange={e => set('eligibility_notes', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Emergency Contact</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Emergency Contact Name</Label>
              <Input value={form.emergency_contact_name || ''} onChange={e => set('emergency_contact_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Emergency Contact Phone</Label>
              <Input value={form.emergency_contact_phone || ''} onChange={e => set('emergency_contact_phone', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Reliability & History</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">No-Show Count</Label>
              <Input type="number" min="0" value={form.no_show_count || 0} onChange={e => set('no_show_count', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cancellation Count</Label>
              <Input type="number" min="0" value={form.cancellation_count || 0} onChange={e => set('cancellation_count', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Total Rides Completed</Label>
              <Input type="number" min="0" value={form.total_rides_completed || 0} onChange={e => set('total_rides_completed', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reliability Rating</Label>
              <Select value={form.reliability_rating || 'good'} onValueChange={v => set('reliability_rating', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="probation">Probation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea rows={3} value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes about this client..." />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />{saving ? 'Saving…' : (existing ? 'Save Changes' : 'Add Client')}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}