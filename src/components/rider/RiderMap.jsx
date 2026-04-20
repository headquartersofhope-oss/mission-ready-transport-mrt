import { MapPin } from 'lucide-react';

export default function RiderMap({ ride }) {
  // Austin TX default as fallback
  const mapIframeUrl = 'https://www.openstreetmap.org/export/embed.html?bbox=-97.8431,30.1672,-97.6431,30.3672&layer=mapnik';

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#161B22', border: '1px solid #30363D' }}>
      {ride?.pickup_location && (
        <div className="p-3 text-amber-400 text-sm font-medium" style={{ backgroundColor: '#0d1117', borderBottom: '1px solid #30363D' }}>
          📍 Pickup location: {ride.pickup_location}
        </div>
      )}
      <iframe
        width="100%"
        height="400"
        frameBorder="0"
        src={mapIframeUrl}
        style={{ border: 0, display: 'block' }}
        title="Pickup and Dropoff Locations"
      />
    </div>
  );
}