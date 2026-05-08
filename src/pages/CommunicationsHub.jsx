import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Plus, Search, Phone, Mail, Users, CheckCircle, X } from 'lucide-react';

const CHANNEL_ICONS = {
  phone_call: Phone,
  text_sms: MessageSquare,
  email: Mail,
  in_person: Users,
  mail: Mail,
  app_notification: MessageSquare,
};

const OUTCOME_COLORS = {
  connected: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  no_answer: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  left_voicemail: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  follow_up_needed: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  email_sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  replied: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  meeting_scheduled: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

function LogForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    contact_type: 'participant', contact_name: '', channel: 'phone_call',
    subject: '', summary: '', outcome: 'connected',
    communication_date: new Date().toISOString(),
    follow_up_date: '', follow_up_note: '',
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CommunicationLog.create(data),
    onSuccess: onSave,
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Log Communication</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}><X className="w-4 h-4" /></Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Contact Type</label>
              <Select value={form.contact_type} onValueChange={v => setForm(f => ({...f, contact_type: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['participant','employer','donor','volunteer','driver','partner','other'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Channel</label>
              <Select value={form.channel} onValueChange={v => setForm(f => ({...f, channel: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['phone_call','text_sms','email','in_person','mail','app_notification'].map(c => (
                    <SelectItem key={c} value={c}>{c.replace('_',' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Input placeholder="Contact name *" value={form.contact_name} onChange={e => setForm(f => ({...f, contact_name: e.target.value}))} />
          <Input placeholder="Subject" value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} />
          <Textarea placeholder="Summary of communication..." value={form.summary} onChange={e => setForm(f => ({...f, summary: e.target.value}))} className="h-24" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Outcome</label>
              <Select value={form.outcome} onValueChange={v => setForm(f => ({...f, outcome: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['no_answer','left_voicemail','connected','email_sent','replied','meeting_scheduled','resolved','follow_up_needed'].map(o => (
                    <SelectItem key={o} value={o}>{o.replace(/_/g,' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Follow-up Date</label>
              <Input type="date" value={form.follow_up_date} onChange={e => setForm(f => ({...f, follow_up_date: e.target.value}))} />
            </div>
          </div>
          {form.follow_up_date && (
            <Input placeholder="Follow-up note..." value={form.follow_up_note} onChange={e => setForm(f => ({...f, follow_up_note: e.target.value}))} />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.contact_name || createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Log Communication'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CommunicationsHub() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['communication_logs'],
    queryFn: () => base44.entities.CommunicationLog.list('-communication_date', 300),
  });

  const filtered = logs.filter(l => {
    const matchSearch = !search || l.contact_name?.toLowerCase().includes(search.toLowerCase()) || l.subject?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || l.contact_type === filterType;
    return matchSearch && matchType;
  });

  const followUps = logs.filter(l => l.follow_up_date && new Date(l.follow_up_date) >= new Date() && l.outcome === 'follow_up_needed');

  return (
    <div className="space-y-6 p-6">
      {showForm && <LogForm onSave={() => { setShowForm(false); qc.invalidateQueries(['communication_logs']); }} onCancel={() => setShowForm(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Communications Hub</h1>
          <p className="text-muted-foreground mt-1">All contact history across participants, employers, donors & partners</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Log Communication
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Logged', value: logs.length, icon: MessageSquare, color: 'text-blue-400' },
          { label: 'This Week', value: logs.filter(l => new Date(l.communication_date) > new Date(Date.now() - 7*864e5)).length, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Follow-ups Due', value: followUps.length, icon: Phone, color: 'text-amber-400' },
          { label: 'Unique Contacts', value: new Set(logs.map(l => l.contact_name)).size, icon: Users, color: 'text-purple-400' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {followUps.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-amber-400 mb-2">⚡ Pending Follow-ups ({followUps.length})</p>
            <div className="space-y-1">
              {followUps.slice(0, 5).map(l => (
                <p key={l.id} className="text-xs text-muted-foreground">{l.contact_name} — {l.follow_up_note || l.subject} <span className="text-amber-400">({l.follow_up_date})</span></p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or subject..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {['participant','employer','donor','volunteer','driver','partner'].map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {isLoading && <p className="text-muted-foreground text-sm">Loading...</p>}
        {filtered.map(l => {
          const Icon = CHANNEL_ICONS[l.channel] || MessageSquare;
          return (
            <Card key={l.id} className="hover:border-border transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{l.contact_name}</p>
                        <span className="text-xs text-muted-foreground capitalize">{l.contact_type}</span>
                      </div>
                      {l.subject && <p className="text-xs text-muted-foreground">{l.subject}</p>}
                      {l.summary && <p className="text-xs text-foreground/70 mt-1 line-clamp-2">{l.summary}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge className={OUTCOME_COLORS[l.outcome] || OUTCOME_COLORS.connected} >{l.outcome?.replace(/_/g,' ')}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(l.communication_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No communications logged yet.</div>
        )}
      </div>
    </div>
  );
}