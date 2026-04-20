import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

export default function DispatchMap() {
  return (
    <div className="w-full">
      <Card className="w-full border-0 shadow-md rounded-lg overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-primary/5 to-transparent">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Service Area Map
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <iframe
            width="100%"
            height="500"
            frameBorder="0"
            src="https://www.openstreetmap.org/export/embed.html?bbox=-97.9,30.0,-97.5,30.5&layer=mapnik"
            style={{ border: 0 }}
            title="Mission Ready Transport Service Area"
          />
        </CardContent>
      </Card>
    </div>
  );
}