import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

// Green pickup icon
const pickupIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iIzE2QTM0QSIvPjxwYXRoIGQ9Ik0xNiAyOEMyMCAzMiAyNCAzNiAyNCA0MkMyNCA0NSAyMSA0OCAxNiA0OEM5IDQ4IDggNDUgOCA0MkM4IDM2IDEyIDMyIDE2IDI4WiIgZmlsbD0iIzE2QTM0QSIvPjwvc3ZnPg==',
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -48],
});

// Red destination icon
const destinationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iI0RDMjYyNiIvPjxwYXRoIGQ9Ik0xNiAyOEMyMCAzMiAyNCAzNiAyNCA0MkMyNCA0NSAyMSA0OCAxNiA0OEM5IDQ4IDggNDUgOCA0MkM4IDM2IDEyIDMyIDE2IDI4WiIgZmlsbD0iI0RDMjYyNiIvPjwvc3ZnPg==',
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -48],
});

export default function RiderMap({ ride }) {
  const [mapCenter, setMapCenter] = useState([30.2672, -97.7431]); // Austin, TX default
  const [route, setRoute] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    // Parse locations for map display
    if (ride?.pickup_location && ride?.dropoff_location) {
      // If we have actual coordinates (from DriverLocation), use them
      // Otherwise, center on Austin area
      const hasCoordinates = ride.pickup_location?.includes(',') && ride.dropoff_location?.includes(',');
      
      if (hasCoordinates) {
        try {
          const pickupCoords = ride.pickup_location.split(',').map(Number);
          const dropoffCoords = ride.dropoff_location.split(',').map(Number);
          setRoute([pickupCoords, dropoffCoords]);
          // Center between the two points
          const centerLat = (pickupCoords[0] + dropoffCoords[0]) / 2;
          const centerLon = (pickupCoords[1] + dropoffCoords[1]) / 2;
          setMapCenter([centerLat, centerLon]);
        } catch {
          // Fall back to Austin center
        }
      }
    }
  }, [ride]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Route Map
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
            {route.length === 2 && (
              <Polyline 
                positions={route} 
                color="#3B82F6" 
                weight={3}
                opacity={0.7}
              />
            )}
            
            {/* Pickup marker (green) */}
            {route.length > 0 && (
              <Marker
                position={route[0]}
                icon={pickupIcon}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-semibold">Pickup Location</p>
                    <p className="text-muted-foreground">{ride?.pickup_location}</p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Destination marker (red) */}
            {route.length === 2 && (
              <Marker
                position={route[1]}
                icon={destinationIcon}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-semibold">Destination</p>
                    <p className="text-muted-foreground">{ride?.dropoff_location}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}