import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

export default function DispatchMap() {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Austin downtown: 30.2672, -97.7431 with zoom 13
  const mapIframeUrl = 'https://www.openstreetmap.org/export/embed.html?bbox=-97.8431,30.1672,-97.6431,30.3672&layer=mapnik';

  return (
    <div className="w-full">
      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#161B22', border: '1px solid #30363D' }}>
        {/* Dark header with title and time */}
        <div className="p-4 text-white flex items-center justify-between border-b" style={{ borderColor: '#30363D' }}>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-lg">Austin Service Area</h3>
          </div>
          <p className="text-sm text-gray-300">{currentTime}</p>
        </div>

        {/* Map iframe */}
        <iframe
          width="100%"
          height="500"
          frameBorder="0"
          src={mapIframeUrl}
          style={{ border: 0, display: 'block' }}
          title="Mission Ready Transport Service Area"
        />

        {/* Legend */}
        <div className="p-4 border-t" style={{ borderColor: '#30363D', backgroundColor: '#0d1117' }}>
          <p className="text-xs text-gray-400 mb-3 font-semibold">LEGEND</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }}></div>
              <span className="text-xs text-gray-300">Available Drivers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
              <span className="text-xs text-gray-300">Active Rides</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
              <span className="text-xs text-gray-300">Urgent Pickups</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}