import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, MapPin, Package, Truck } from 'lucide-react';

export default function DeliveryRouteCard({ route }) {
  const [expanded, setExpanded] = useState(false);

  const statusColors = {
    planned: 'bg-slate-100 text-slate-700',
    in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  const typeLabels = {
    package_delivery: '📦 Package Delivery',
    medical_delivery: '🏥 Medical Delivery',
    contract_route: '📋 Contract Route'
  };

  return (
    <Card className="border-l-4 border-l-amber-500">
      <CardHeader 
        className="cursor-pointer pb-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Truck className="w-5 h-5 text-amber-600" />
            <div className="flex-1">
              <div className="font-semibold text-sm">{route.driver_name} — {route.vehicle_name}</div>
              <div className="text-xs text-muted-foreground">{typeLabels[route.route_type]}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[route.route_status]}>
              {route.route_status.replace('_', ' ')}
            </Badge>
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="p-2 bg-muted rounded">
              <p className="text-muted-foreground">Stops</p>
              <p className="font-semibold text-lg">{route.stops.length}</p>
            </div>
            <div className="p-2 bg-muted rounded">
              <p className="text-muted-foreground">Est. Duration</p>
              <p className="font-semibold">{route.total_estimated_duration} min</p>
            </div>
            <div className="p-2 bg-muted rounded">
              <p className="text-muted-foreground">Distance</p>
              <p className="font-semibold">{route.total_distance_miles || '—'} mi</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium">Delivery Stops:</p>
            {route.stops.map((stop, idx) => (
              <div key={idx} className="pl-3 border-l-2 border-amber-200 pb-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3 h-3 text-amber-600 mt-1" />
                  <div className="text-xs flex-1">
                    <p className="font-medium">{stop.stop_sequence}. {stop.dropoff_location}</p>
                    <p className="text-muted-foreground text-xs">
                      {stop.package_type} • {stop.scheduled_dropoff_time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {route.notes && (
            <div className="text-xs p-2 bg-muted rounded">
              <p className="font-medium mb-1">Notes:</p>
              <p className="text-muted-foreground">{route.notes}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}