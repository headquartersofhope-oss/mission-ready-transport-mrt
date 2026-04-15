import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Truck, Link2, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';

// Panel to assign preferred drivers to a client (participant) or recurring plan
export default function DriverAssignmentPanel({ participant, recurringPlan, onClose }) {
  const queryClient = useQueryClient();
  const [preferredDriver, setPreferredDriver] = useState(participant?.preferred_driver_id || recurringPlan?.assigned_provider_id || '');
  const [returnDriver, setReturnDriver] = useState(participant?.return_driver_id || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: drivers = [] } = useQuery({ queryKey: ['drivers'], queryFn: () => base44.entities.Driver.list('first_name', 200) });

  const updateParticipant = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Participant.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['participants'] }); },
  });

  const updatePlan = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RecurringTransportPlan.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['recurring-plans'] }); },
  });

  const handleSave = async () => {
    setSaving(true);
    const driver = drivers.find(d => d.id === preferredDriver);
    const driverName = driver ? `${driver.first_name} ${driver.last_name}` : '';
    const returnDrv = drivers.find(d => d.id === returnDriver);
    const returnName = returnDrv ? `${returnDrv.first_name} ${returnDrv.last_name}` : '';

    if (participant) {
      await updateParticipant.mutateAsync({ id: participant.id, data: {
        preferred_driver_id: preferredDriver || null,
        preferred_driver_name: driverName,
        return_driver_id: returnDriver || null,
        return_driver_name: returnName,
      }});
    }
    if (recurringPlan) {
      await updatePlan.mutateAsync({ id: recurringPlan.id, data: {
        preferred_driver_id: preferredDriver || null,
        preferred_driver_name: driverName,
      }});
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const activeDrivers = drivers.filter(d => d.status === 'active');

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          Driver Assignment
          {participant && <span className="font-normal text-muted-foreground">for {participant.first_name} {participant.last_name}</span>}
          {recurringPlan && <span className="font-normal text-muted-foreground">for recurring plan</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Preferred Driver (Outbound)
          </label>
          <Select value={preferredDriver} onValueChange={setPreferredDriver}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="No preference — any available driver" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>No preference</SelectItem>
              {activeDrivers.map(d => (
                <SelectItem key={d.id} value={d.id}>
                  <div className="flex items-center gap-2">
                    <span>{d.first_name} {d.last_name}</span>
                    <span className="text-xs text-muted-foreground">{d.service_area || ''}</span>
                    <Badge variant="outline" className="text-xs capitalize ml-auto">{d.availability?.replace(/_/g, ' ')}</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {preferredDriver && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              This driver will be shown as the preferred assignment when creating rides for this client.
            </p>
          )}
        </div>

        {participant && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Return Trip Driver (Override)
            </label>
            <Select value={returnDriver} onValueChange={setReturnDriver}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Same as outbound driver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Same as outbound driver</SelectItem>
                {activeDrivers.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.first_name} {d.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {returnDriver && returnDriver !== preferredDriver && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Return trip will use a different driver than outbound.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saved ? <><CheckCircle2 className="w-3.5 h-3.5" />Saved!</> : saving ? 'Saving…' : 'Save Assignments'}
          </Button>
          {onClose && <Button size="sm" variant="outline" onClick={onClose}>Close</Button>}
        </div>
      </CardContent>
    </Card>
  );
}