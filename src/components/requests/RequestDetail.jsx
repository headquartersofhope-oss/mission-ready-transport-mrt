import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, XCircle, Truck, FileText, ArrowLeft, 
  Clock, MapPin, DollarSign, User, AlertTriangle 
} from 'lucide-react';

const statusStyles = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  approved: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  denied: 'bg-red-500/10 text-red-600 border-red-500/20',
  assigned: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  in_progress: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  no_show: 'bg-red-500/10 text-red-600 border-red-500/20',
  cancelled: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

export default function RequestDetail({ request, onBack }) {
  const queryClient = useQueryClient();
  const [denialReason, setDenialReason] = useState('');
  const [postNotes, setPostNotes] = useState(request.post_ride_notes || '');
  const [actualCost, setActualCost] = useState(request.actual_cost || '');
  const [selectedProvider, setSelectedProvider] = useState(request.assigned_provider_id || '');

  const { data: providers = [] } = useQuery({
    queryKey: ['providers-active'],
    queryFn: () => base44.entities.TransportProvider.filter({ status: 'active' }, 'name', 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TransportRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-requests'] });
      onBack();
    },
  });

  const handleStatusChange = (newStatus, extra = {}) => {
    updateMutation.mutate({ id: request.id, data: { status: newStatus, ...extra } });
  };

  const handleAssign = () => {
    const provider = providers.find(p => p.id === selectedProvider);
    if (!provider) return;
    handleStatusChange('assigned', { 
      assigned_provider_id: provider.id, 
      assigned_provider_name: provider.name 
    });
  };

  const handleComplete = () => {
    handleStatusChange('completed', {
      post_ride_notes: postNotes,
      actual_cost: actualCost ? Number(actualCost) : undefined,
      completed_at: new Date().toISOString(),
    });
  };

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Requests
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{request.participant_name}</CardTitle>
              <Badge variant="outline" className={statusStyles[request.status]}>{request.status?.replace(/_/g, ' ')}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow icon={Clock} label="Date & Time" value={`${request.request_date} at ${request.pickup_time || 'TBD'}`} />
            <InfoRow icon={MapPin} label="Pickup" value={request.pickup_location} />
            <InfoRow icon={MapPin} label="Dropoff" value={request.dropoff_location} />
            {request.return_trip && <InfoRow icon={Clock} label="Return Pickup" value={request.return_pickup_time || 'TBD'} />}
            <InfoRow icon={FileText} label="Purpose" value={request.purpose?.replace(/_/g, ' ')} />
            <InfoRow icon={AlertTriangle} label="Priority" value={request.priority} />
            <InfoRow icon={User} label="Submitted By" value={request.submitted_by} />
            <InfoRow icon={Truck} label="Provider" value={request.assigned_provider_name} />
            <InfoRow icon={DollarSign} label="Estimated Cost" value={request.estimated_cost ? `$${request.estimated_cost}` : undefined} />
            <InfoRow icon={DollarSign} label="Actual Cost" value={request.actual_cost ? `$${request.actual_cost}` : undefined} />
            {request.special_instructions && <InfoRow icon={FileText} label="Special Instructions" value={request.special_instructions} />}
            {request.denial_reason && <InfoRow icon={XCircle} label="Denial Reason" value={request.denial_reason} />}
            {request.post_ride_notes && <InfoRow icon={FileText} label="Post-Ride Notes" value={request.post_ride_notes} />}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {request.status === 'pending' && (
              <>
                <Button className="w-full gap-2" onClick={() => handleStatusChange('approved')}>
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </Button>
                <div className="space-y-2">
                  <Textarea placeholder="Denial reason…" value={denialReason} onChange={e => setDenialReason(e.target.value)} rows={2} />
                  <Button variant="destructive" className="w-full gap-2" onClick={() => handleStatusChange('denied', { denial_reason: denialReason })} disabled={!denialReason}>
                    <XCircle className="w-4 h-4" /> Deny
                  </Button>
                </div>
              </>
            )}

            {request.status === 'approved' && (
              <div className="space-y-3">
                <Label className="text-sm">Assign Provider</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                  <SelectContent>
                    {providers.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.provider_type?.replace(/_/g, ' ')})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="w-full gap-2" onClick={handleAssign} disabled={!selectedProvider}>
                  <Truck className="w-4 h-4" /> Assign & Dispatch
                </Button>
              </div>
            )}

            {(request.status === 'assigned' || request.status === 'in_progress') && (
              <div className="space-y-3">
                <Button className="w-full" variant="outline" onClick={() => handleStatusChange('in_progress')} disabled={request.status === 'in_progress'}>
                  Mark In Progress
                </Button>
                <Separator />
                <Label className="text-sm">Complete Ride</Label>
                <div className="space-y-2">
                  <Input type="number" step="0.01" placeholder="Actual cost" value={actualCost} onChange={e => setActualCost(e.target.value)} />
                  <Textarea placeholder="Post-ride notes…" value={postNotes} onChange={e => setPostNotes(e.target.value)} rows={3} />
                </div>
                <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleComplete}>
                  <CheckCircle2 className="w-4 h-4" /> Complete Ride
                </Button>
                <Button variant="destructive" className="w-full gap-2" onClick={() => handleStatusChange('no_show')}>
                  <XCircle className="w-4 h-4" /> Mark No-Show
                </Button>
              </div>
            )}

            {!['pending', 'approved', 'assigned', 'in_progress'].includes(request.status) && (
              <p className="text-sm text-muted-foreground text-center py-4">No actions available for this status.</p>
            )}

            <Separator />
            <Button variant="outline" className="w-full" onClick={() => handleStatusChange('cancelled')}>Cancel Request</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}