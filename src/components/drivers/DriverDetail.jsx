import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Phone, Mail, Truck, Star, AlertTriangle, Clock, Shield } from 'lucide-react';

const availColors = {
  available: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  on_duty: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  off_duty: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  on_leave: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  unavailable: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const licenseColors = {
  valid: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  expiring_soon: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  expired: 'bg-red-500/10 text-red-600 border-red-500/20',
  suspended: 'bg-red-700/10 text-red-700 border-red-700/20',
};

function InfoRow({ label, value, highlight }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-medium text-right max-w-[60%] ${highlight ? 'text-amber-600' : ''}`}>{value}</span>
    </div>
  );
}

export default function DriverDetail({ driver, onEdit, onBack }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{driver.first_name} {driver.last_name}</h1>
            <Badge variant="outline" className={`${availColors[driver.availability] || ''} capitalize`}>
              {driver.availability?.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{driver.driver_id || 'No ID'} · {driver.shift_schedule || 'No schedule set'}</p>
        </div>
        <Button onClick={onEdit} variant="outline" className="gap-2">
          <Edit className="w-4 h-4" />Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">On-Time Rate</span>
          </div>
          <p className="text-2xl font-bold">{driver.on_time_rate || 100}%</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Rides Completed</span>
          </div>
          <p className="text-2xl font-bold">{driver.total_rides_completed || 0}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-muted-foreground">Incidents</span>
          </div>
          <p className="text-2xl font-bold">{driver.incident_count || 0}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {driver.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />{driver.phone}
              </div>
            )}
            {driver.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />{driver.email}
              </div>
            )}
            {driver.emergency_contact_name && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Emergency Contact</p>
                <p className="text-sm font-medium">{driver.emergency_contact_name}</p>
                {driver.emergency_contact_phone && <p className="text-sm text-muted-foreground">{driver.emergency_contact_phone}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">License & Compliance</CardTitle></CardHeader>
          <CardContent>
            <InfoRow label="License #" value={driver.license_number} />
            <InfoRow label="License Expiry" value={driver.license_expiry} />
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-xs text-muted-foreground">License Status</span>
              <Badge variant="outline" className={`text-xs ${licenseColors[driver.license_status] || ''}`}>
                {driver.license_status?.replace(/_/g, ' ')}
              </Badge>
            </div>
            <InfoRow label="Insurance Expiry" value={driver.insurance_expiry} highlight={driver.insurance_status === 'expiring_soon'} />
            <div className="flex justify-between py-1.5">
              <span className="text-xs text-muted-foreground">Insurance Status</span>
              <Badge variant="outline" className={`text-xs ${licenseColors[driver.insurance_status] || ''}`}>
                {driver.insurance_status?.replace(/_/g, ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Assignment & Schedule</CardTitle></CardHeader>
          <CardContent>
            <InfoRow label="Assigned Vehicle" value={driver.assigned_vehicle_name} />
            <InfoRow label="Shift Schedule" value={driver.shift_schedule} />
            <InfoRow label="Service Area" value={driver.service_area} />
            <InfoRow label="Territory / Zones" value={driver.territory_zones} />
            {driver.active_days?.length > 0 && (
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-xs text-muted-foreground">Active Days</span>
                <div className="flex gap-1 flex-wrap justify-end max-w-[60%]">
                  {driver.active_days.map(d => (
                    <span key={d} className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium capitalize">{d.slice(0,3)}</span>
                  ))}
                </div>
              </div>
            )}
            <InfoRow label="Backup Role" value={driver.backup_driver_role?.replace(/_/g, ' ')} />
            <InfoRow label="Portal Login Email" value={driver.linked_user_email} />
            <InfoRow label="Hire Date" value={driver.hire_date} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Performance Summary</CardTitle></CardHeader>
          <CardContent>
            <InfoRow label="Total Rides" value={driver.total_rides_completed || 0} />
            <InfoRow label="On-Time Rate" value={`${driver.on_time_rate || 100}%`} />
            <InfoRow label="Incidents" value={driver.incident_count || 0} />
            <InfoRow label="Cancellations" value={driver.cancellation_count || 0} />
          </CardContent>
        </Card>
      </div>

      {driver.notes && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{driver.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}