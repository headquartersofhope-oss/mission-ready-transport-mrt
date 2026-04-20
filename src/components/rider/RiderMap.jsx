import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

export default function RiderMap({ ride }) {
  // Austin TX default as fallback
  const mapIframeUrl = 'https://www.openstreetmap.org/export/embed.html?bbox=-97.9,30.0,-97.5,30.5&layer=mapnik';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Route Map
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <iframe
          width="100%"
          height="400"
          frameBorder="0"
          src={mapIframeUrl}
          style={{ border: 0 }}
          title="Pickup and Dropoff Locations"
        />
      </CardContent>
    </Card>
  );
}