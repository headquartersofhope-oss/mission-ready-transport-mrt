import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

// Create numbered marker for stops
const createNumberedIcon = (number, isCurrentLocation = false) => {
  const bg = isCurrentLocation ? '#3B82F6' : '#6B7280';
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(
      `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${bg}" stroke="white" stroke-width="2"/>
        <text x="50%" y="50%" font-size="20" font-weight="bold" text-anchor="middle" dy="0.3em" fill="white">${number}</text>
      </svg>`
    )}`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

export default function DriverRouteMap({ rides, driverLocation }) {
  const [mapCenter, setMapCenter] = useState([30.2672, -97.7431]); // Austin, TX default
  const [routePoints, setRoutePoints] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    if (driverLocation?.latitude && driverLocation?.longitude) {
      setMapCenter([driverLocation.latitude, driverLocation.longitude]);
    }
    
    // Build route from active rides (en_route, scheduled, assigned)
    const activeRides = rides.filter(r => 
      ['scheduled', 'driver_assigned', 'approved', 'en_route', 'rider_picked_up'].includes(r.status)
    ).sort((a, b) => (a.pickup_time || '').localeCompare(b.pickup_time || ''));

    const points = [];
    let stopNum = 1;

    activeRides.forEach(ride => {
      // Pickup
      points.push({
        type: 'pickup',
        position: [30.2672 + Math.random() * 0.05, -97.7431 + Math.random() * 0.05], // Placeholder coords
        label: `Stop ${stopNum}: ${ride.participant_name} (Pickup)`,
        number: stopNum,
      });
      stopNum++;

      // Dropoff
      points.push({
        type: 'dropoff',
        position: [30.2672 + Math.random() * 0.05, -97.7431 + Math.random() * 0.05], // Placeholder coords
        label: `Stop ${stopNum}: ${ride.participant_name} (Dropoff)`,
        number: stopNum,
      });
      stopNum++;
    });

    setRoutePoints(points);
  }, [rides, driverLocation]);

  const routeCoordinates = routePoints.map(p => p.position);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Today's Route
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-64 w-full overflow-hidden">
          <MapContainer 
            center={mapCenter} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap contributors, &copy; CARTO'
              maxZoom={20}
            />
            
            {/* Route line */}
            {routeCoordinates.length > 1 && (
              <Polyline 
                positions={routeCoordinates} 
                color="#3B82F6" 
                weight={3}
                opacity={0.7}
                dashArray="5, 5"
              />
            )}
            
            {/* Current driver location */}
            {driverLocation?.latitude && driverLocation?.longitude && (
              <CircleMarker
                center={[driverLocation.latitude, driverLocation.longitude]}
                radius={6}
                color="#3B82F6"
                fillColor="#3B82F6"
                fillOpacity={1}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-semibold">Your Current Location</p>
                    <p className="text-muted-foreground text-xs">
                      {driverLocation.latitude?.toFixed(4)}, {driverLocation.longitude?.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            )}
            
            {/* Stop markers */}
            {routePoints.map((point, idx) => (
              <Marker
                key={idx}
                position={point.position}
                icon={createNumberedIcon(point.number)}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-semibold">{point.label}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        
        {/* Legend */}
        <div className="p-3 bg-muted/30 border-t border-border text-xs space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#3B82F6]" />
            <span>Your Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#6B7280]" />
            <span>Route Stops ({routePoints.length})</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}