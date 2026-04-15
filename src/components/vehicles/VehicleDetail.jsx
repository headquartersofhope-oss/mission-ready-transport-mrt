import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Users, Wrench, AlertTriangle, Truck } from 'lucide-react';

const serviceColors = {
  available: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  in_use: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  maintenance: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  out_of_service: 'bg-red-500/10 text-red-600 border-red-500/20',
};

function InfoRow({ label, value, warn }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-medium ${warn ? 'text-amber-600' : ''}`}>{value}</span>
    </div>
  );
}

export default function VehicleDetail({ vehicle, onEdit, onBack }) {
  const maintenanceSoon = vehicle.maintenance_due_date && new Date(vehicle.maintenance_due_date) < new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}</h1>
            <Badge variant="outline" className={`${serviceColors[vehicle.service_status] || ''} capitalize`}>
              {vehicle.service_status?.replace(/_/g, ' ')}
            </Badge>
            {vehicle.wheelchair_accessible && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">♿ ADA</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{vehicle.vehicle_id || 'No ID'} · Plate: {vehicle.plate}</p>
        </div>
        <Button onClick={onEdit} variant="outline" className="gap-2">
          <Edit className="w-4 h-4" />Edit
        </Button>
      </div>

      {maintenanceSoon && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Maintenance due soon</p>
            <p className="text-xs text-amber-600 dark:text-amber-500">Scheduled for {vehicle.maintenance_due_date}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xl font-bold">{vehicle.seat_capacity || '—'}</p>
              <p className="text-xs text-muted-foreground">Seat Capacity</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xl font-bold">{vehicle.odometer_miles?.toLocaleString() || '0'}</p>
              <p className="text-xs text-muted-foreground">Miles</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Vehicle Details</CardTitle></CardHeader>
          <CardContent>
            <InfoRow label="Make / Model" value={`${vehicle.make} ${vehicle.model}`} />
            <InfoRow label="Year" value={vehicle.year} />
            <InfoRow label="Color" value={vehicle.color} />
            <InfoRow label="Plate" value={vehicle.plate} />
            <InfoRow label="VIN" value={vehicle.vin} />
            <InfoRow label="Fuel Type" value={vehicle.fuel_type} />
            <InfoRow label="Wheelchair Accessible" value={vehicle.wheelchair_accessible ? 'Yes' : 'No'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Maintenance & Compliance</CardTitle></CardHeader>
          <CardContent>
            <InfoRow label="Maintenance Due Date" value={vehicle.maintenance_due_date} warn={maintenanceSoon} />
            <InfoRow label="Maintenance Due Miles" value={vehicle.maintenance_due_miles ? `${vehicle.maintenance_due_miles?.toLocaleString()} mi` : null} />
            <InfoRow label="Last Inspection" value={vehicle.last_inspection_date} />
            <InfoRow label="Next Inspection" value={vehicle.next_inspection_date} />
            <InfoRow label="Insurance Expiry" value={vehicle.insurance_expiry} />
            <InfoRow label="Registration Expiry" value={vehicle.registration_expiry} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Assignment</CardTitle></CardHeader>
          <CardContent>
            <InfoRow label="Assigned Driver" value={vehicle.assigned_driver_name || 'Unassigned'} />
            <InfoRow label="Purchase Date" value={vehicle.purchase_date} />
          </CardContent>
        </Card>
      </div>

      {vehicle.notes && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{vehicle.notes}</p></CardContent>
        </Card>
      )}
    </div>
  );
}