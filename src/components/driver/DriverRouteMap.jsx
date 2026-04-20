import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

export default function DriverRouteMap({ rides }) {
  // Austin TX route area (expanded for broader coverage)
  const mapIframeUrl = 'https://www.openstreetmap.org/export/embed.html?bbox=-98.1,29.8,-97.4,30.6&layer=mapnik';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Today's Route
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <iframe
          width="100%"
          height="400"
          frameBorder="0"
          src={mapIframeUrl}
          style={{ border: 0 }}
          title="Driver Route and Service Area"
        />
        {rides?.length > 0 && (
          <div className="p-3 bg-muted/30 border-t border-border text-xs">
            <p className="font-semibold text-foreground mb-2">{rides.length} Stops Today</p>
            <div className="space-y-1">
              {rides.slice(0, 5).map((ride, idx) => (
                <div key={idx} className="text-muted-foreground text-xs">
                  <span className="font-semibold">Stop {idx + 1}:</span> {ride.participant_name}
                </div>
              ))}
              {rides.length > 5 && (
                <p className="text-muted-foreground text-xs italic">+{rides.length - 5} more stops</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}