import { MapPin } from 'lucide-react';

export default function DriverRouteMap({ rides, driverName }) {
  // Austin TX route area (expanded for broader coverage)
  const mapIframeUrl = 'https://www.openstreetmap.org/export/embed.html?bbox=-98.1,29.8,-97.4,30.6&layer=mapnik';
  const stopCount = rides?.length || 0;

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#161B22', border: '1px solid #30363D' }}>
      {/* Driver info header */}
      <div className="p-3 text-white font-bold" style={{ backgroundColor: '#0d1117', borderBottom: '1px solid #30363D' }}>
        {driverName && <p>{driverName} • {stopCount} Stop{stopCount !== 1 ? 's' : ''} Today</p>}
      </div>

      <iframe
        width="100%"
        height="400"
        frameBorder="0"
        src={mapIframeUrl}
        style={{ border: 0, display: 'block' }}
        title="Driver Route and Service Area"
      />

      {stopCount > 0 && (
        <div className="p-3 border-t" style={{ borderColor: '#30363D', backgroundColor: '#0d1117' }}>
          <p className="font-semibold text-white mb-2 text-sm">{stopCount} Stops Today</p>
          <div className="space-y-1">
            {rides.slice(0, 5).map((ride, idx) => (
              <div key={idx} className="text-gray-400 text-xs">
                <span className="font-semibold text-gray-300">Stop {idx + 1}:</span> {ride.participant_name}
              </div>
            ))}
            {stopCount > 5 && (
              <p className="text-gray-400 text-xs italic">+{stopCount - 5} more stops</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}