import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, Edit, CheckCircle2, XCircle, Truck, User, 
  MapPin, Clock, DollarSign, MessageSquare, AlertTriangle, Car
} from 'lucide-react';

const statusColors = {
  requested:       'bg-slate-500/10 text-slate-600 border-slate-500/20',
  pending:         'bg-amber-500/10 text-amber-600 border-amber-500/20',
  under_review:    'bg-amber-500/10 text-amber-600 border-amber-500/20',
  approved:        'bg-blue-500/10 text-blue-600 border-blue-500/20',
  denied:          'bg-red-500/10 text-red-600 border-red-500/20',
  scheduled:       'bg-blue-500/10 text-blue-600 border-blue-500/20',
  driver_assigned: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  en_route:        'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  rider_picked_up: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  dropped_off:     'bg-teal-500/10 text-teal-600 border-teal-500/20',
  return_pending:  'bg-amber-500/10 text-amber-600 border-amber-500/20',
  completed:       'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled:       'bg-slate-500/10 text-slate-600 border-slate-500/20',
  no_show:         'bg-red-500/10 text-red-600 border-red-500/20',
  incident_review: 'bg-red-700/10 text-red-700 border-red-700/20',
};

export default function RequestDetail({ request, onBack }) {
  const queryClient = useQueryClient();
  const [denialReason, setDenialReason] = useState(request.denial_reason || '');
  const [postNotes, setPostNotes] = useState(request.post_ride_notes || '');
  const [driverNotes, setDriverNotes] = useState(request.driver_notes || '');
  const [actualCost, setActualCost] = useState(request.actual_cost || '');
  const [fuelCost, setFuelCost] = useState(request.fuel_estimate || '');
  const [reimbursement, setReimbursement] = useState(request.reimbursement_amount || '');
  const [selectedDriver, setSelectedDriver] = useState(request.assigned_driver_name || '');
  const [selectedVehicle, setSelectedVehicle] = useState(request.assigned_vehicle_name || '');

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list('first_name', 200),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list('nickname', 100),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.TransportRequest.update(request.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transport-requests'] }),
  });

  const updateStatus = async (newStatus, extraData = {}) => {
    const now = new Date().toISOString();
    const update = { status: newStatus, ...extraData };
    if (newStatus === 'completed') update.completed_at = now;
    if (newStatus === 'rider_picked_up') update.picked_up_at = now;
    if (newStatus === 'dropped_off') update.dropped_off_at = now;
    await updateMutation.mutateAsync(update);
    onBack();
  };

  const handleAssignDriver = async () => {
    const driver = drivers.find(d => `${d.first_name} ${d.last_name}` === selectedDriver);
    await updateMutation.mutateAsync({
      status: 'driver_assigned',
      assigned_driver_name: selectedDriver,
      assigned_driver_id: driver?.id || '',
      assigned_vehicle_name: selectedVehicle,
    });
    queryClient.invalidateQueries({ queryKey: ['transport-requests'] });
  };

  const handleSaveNotes = async () => {
    const update = { driver_notes: driverNotes, post_ride_notes: postNotes };
    if (actualCost !== '') update.actual_cost = parseFloat(actualCost) || 0;
    if (fuelCost !== '') update.fuel_estimate = parseFloat(fuelCost) || 0;
    if (reimbursement !== '') update.reimbursement_amount = parseFloat(reimbursement) || 0;
    await updateMutation.mutateAsync(update);
    queryClient.invalidateQueries({ queryKey: ['transport-requests'] });
  };

  const activeDrivers = drivers.filter(d => d.status === 'active');
  const activeVehicles = vehicles.filter(v => v.service_status === 'available' || v.service_status === 'in_use');

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{request.participant_name}</h1>
            <Badge variant="outline" className={`capitalize ${statusColors[request.status] || ''}`}>
              {request.status?.replace(/_/g, ' ')}
            </Badge>
            {request.priority !== 'standard' && (
              <Badge variant="outline" className={request.priority === 'urgent' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}>
                {request.priority === 'urgent' && <AlertTriangle className="w-3 h-3 mr-1" />}
                {request.priority} priority
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{request.request_date} · {request.purpose?.replace(/_/g, ' ')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: ride details */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Trip Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />Pickup Time</p>
                  <p className="text-sm font-medium">{request.pickup_time || '—'}</p>
                </div>
                {request.appointment_time && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Appointment Time</p>
                    <p className="text-sm font-medium">{request.appointment_time}</p>
                  </div>
                )}
              </div>
              <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pickup</p>
                    <p className="text-sm font-medium">{request.pickup_location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Destination</p>
                    <p className="text-sm font-medium">{request.dropoff_location}</p>
                  </div>
                </div>
                {request.return_trip && (
                  <div className="flex items-start gap-2 pt-1 border-t border-border/50">
                    <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Return Pickup @ {request.return_pickup_time || 'TBD'}</p>
                      <p className="text-sm font-medium">{request.return_pickup_location || request.dropoff_location}</p>
                    </div>
                  </div>
                )}
              </div>
              {request.special_instructions && (
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Special Instructions</p>
                  <p className="text-sm mt-1">{request.special_instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dispatch Assignment Panel */}
          {!['completed', 'cancelled', 'denied', 'no_show'].includes(request.status) && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Truck className="w-4 h-4" />Dispatch Assignment</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Assign Driver</Label>
                    <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select driver…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>Unassigned</SelectItem>
                        {activeDrivers.map(d => (
                          <SelectItem key={d.id} value={`${d.first_name} ${d.last_name}`}>
                            {d.first_name} {d.last_name} — {d.availability?.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Assign Vehicle</Label>
                    <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>Unassigned</SelectItem>
                        {activeVehicles.map(v => (
                          <SelectItem key={v.id} value={v.nickname || `${v.make} ${v.model}`}>
                            {v.nickname || `${v.year} ${v.make} ${v.model}`} — {v.service_status?.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button size="sm" onClick={handleAssignDriver} className="gap-2">
                  <Truck className="w-3.5 h-3.5" />Confirm Assignment
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Notes & Cost */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4" />Notes & Cost</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Driver Notes (visible to driver)</Label>
                <Textarea rows={2} value={driverNotes} onChange={e => setDriverNotes(e.target.value)} placeholder="Route notes, special instructions for driver..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Post-Ride Notes</Label>
                <Textarea rows={2} value={postNotes} onChange={e => setPostNotes(e.target.value)} placeholder="Notes after ride completion..." />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Actual Cost ($)</Label>
                  <Input type="number" step="0.01" value={actualCost} onChange={e => setActualCost(e.target.value)} placeholder={request.estimated_cost ? `Est: $${request.estimated_cost}` : '0.00'} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Fuel Cost ($)</Label>
                  <Input type="number" step="0.01" value={fuelCost} onChange={e => setFuelCost(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Reimbursement ($)</Label>
                  <Input type="number" step="0.01" value={reimbursement} onChange={e => setReimbursement(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={handleSaveNotes}>Save Notes & Costs</Button>
            </CardContent>
          </Card>
        </div>

        {/* Right column: actions */}
        <div className="space-y-5">
          {/* Current Info */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Current Assignment</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground text-xs">Driver:</span>
                <span className="font-medium text-xs">{request.assigned_driver_name || 'Unassigned'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground text-xs">Vehicle:</span>
                <span className="font-medium text-xs">{request.assigned_vehicle_name || 'Unassigned'}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground text-xs">Est. Cost:</span>
                <span className="font-medium text-xs">{request.estimated_cost ? `$${request.estimated_cost}` : '—'}</span>
              </div>
              {request.actual_cost ? (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span className="text-muted-foreground text-xs">Actual:</span>
                  <span className="font-medium text-xs text-emerald-600">${request.actual_cost}</span>
                </div>
              ) : null}
              {request.funding_source && (
                <div className="pt-2 border-t border-border/50 space-y-1">
                  <p className="text-xs text-muted-foreground">Funding: <span className="font-medium text-foreground">{request.funding_source}</span></p>
                  {request.funding_source_type && <p className="text-xs text-muted-foreground capitalize">{request.funding_source_type.replace(/_/g, ' ')}</p>}
                  {request.is_billable === false && <p className="text-xs text-amber-600 font-medium">Non-billable</p>}
                </div>
              )}
              {request.submitted_by && (
                <p className="text-xs text-muted-foreground">Submitted by: {request.submitted_by}</p>
              )}
            </CardContent>
          </Card>

          {/* Status Actions */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Status Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {['requested', 'pending', 'under_review'].includes(request.status) && (
                <>
                  <Button size="sm" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus('approved')}>
                    <CheckCircle2 className="w-3.5 h-3.5" />Approve Ride
                  </Button>
                  <div className="space-y-1.5">
                    <Textarea rows={2} value={denialReason} onChange={e => setDenialReason(e.target.value)} placeholder="Reason for denial (required)" className="text-xs" />
                    <Button size="sm" variant="destructive" className="w-full gap-2" disabled={!denialReason.trim()} onClick={() => updateStatus('denied', { denial_reason: denialReason })}>
                      <XCircle className="w-3.5 h-3.5" />Deny Ride
                    </Button>
                  </div>
                </>
              )}

              {request.status === 'approved' && (
                <Button size="sm" className="w-full" onClick={() => updateStatus('scheduled')}>
                  Mark as Scheduled
                </Button>
              )}

              {['driver_assigned', 'scheduled'].includes(request.status) && (
                <Button size="sm" className="w-full" onClick={() => updateStatus('en_route')}>
                  Driver En Route
                </Button>
              )}

              {request.status === 'en_route' && (
                <>
                  <Button size="sm" className="w-full" onClick={() => updateStatus('rider_picked_up')}>
                    Rider Picked Up
                  </Button>
                  <Button size="sm" variant="destructive" className="w-full" onClick={() => updateStatus('no_show')}>
                    No-Show
                  </Button>
                </>
              )}

              {request.status === 'rider_picked_up' && (
                <Button size="sm" className="w-full" onClick={() => updateStatus(request.return_trip ? 'return_pending' : 'dropped_off')}>
                  {request.return_trip ? 'Dropped Off (Return Pending)' : 'Drop-Off Complete'}
                </Button>
              )}

              {['dropped_off', 'return_pending'].includes(request.status) && (
                <Button size="sm" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus('completed', { actual_cost: actualCost ? parseFloat(actualCost) : undefined, post_ride_notes: postNotes })}>
                  <CheckCircle2 className="w-3.5 h-3.5" />Mark Complete
                </Button>
              )}

              {!['completed', 'cancelled', 'denied', 'no_show'].includes(request.status) && (
                <>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => updateStatus('incident_review')}>
                    Flag for Incident Review
                  </Button>
                  <Button size="sm" variant="outline" className="w-full text-destructive hover:text-destructive" onClick={() => updateStatus('cancelled')}>
                    Cancel Ride
                  </Button>
                </>
              )}

              {['completed', 'cancelled', 'denied', 'no_show'].includes(request.status) && (
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground capitalize">Ride {request.status?.replace(/_/g, ' ')}</p>
                  {request.completed_at && (
                    <p className="text-xs text-muted-foreground mt-1">Completed: {new Date(request.completed_at).toLocaleString()}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}