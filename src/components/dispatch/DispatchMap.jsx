import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, MapPin } from 'lucide-react';

export default function DispatchMap() {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState([]);

  const loadDriverLocations = async () => {
    setLoading(true);
    try {
      const locations = await base44.entities.DriverLocation.list('-last_update', 100);
      setDrivers(locations);
    } catch (err) {
      console.error('Failed to load driver locations:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Card className="w-full border-0 shadow-md rounded-lg overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-primary/5 to-transparent">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Live Driver Tracking Map
            </CardTitle>
          </div>
          <Button 
            onClick={loadDriverLocations} 
            disabled={loading} 
            size="sm" 
            variant="outline"
            className="gap-1"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {drivers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/30">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No active driver locations yet.</p>
              <p className="text-xs mt-1">Drivers must share location from their device.</p>
            </div>
          ) : (
           <div className="flex flex-col lg:flex-row w-full gap-0">
             {/* Map container - OpenStreetMap iframe (Austin TX service area) */}
             <div className="flex-1 w-full">
               <iframe
                 width="100%"
                 height="500"
                 frameBorder="0"
                 src="https://www.openstreetmap.org/export/embed.html?bbox=-97.9,30.0,-97.5,30.5&layer=mapnik"
                 style={{ border: 0 }}
                 title="Mission Ready Transport Service Area"
               />
             </div>
              
              {/* Driver list sidebar */}
              <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border bg-muted/30 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-border bg-background/50">
                  <p className="text-xs font-semibold text-muted-foreground">Active Drivers ({drivers.length})</p>
                </div>
                <div className="flex-1 overflow-y-auto max-h-96 lg:max-h-none">
                  <div className="space-y-1 p-2">
                    {drivers.map((driver) => {
                      const lastUpdateTime = new Date(driver.last_update);
                      const minutesAgo = Math.floor((Date.now() - lastUpdateTime) / 60000);
                      return (
                        <div key={driver.id} className="flex items-center justify-between text-xs p-2.5 bg-background rounded border border-border/50 hover:border-border transition-colors">
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{driver.driver_name || 'Driver'}</p>
                            <p className="text-muted-foreground text-xs">
                              {driver.latitude?.toFixed(4)}, {driver.longitude?.toFixed(4)}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ml-2 ${
                            driver.current_status === 'en_route_to_pickup' ? 'bg-blue-100 text-blue-700' :
                            driver.current_status === 'at_pickup' ? 'bg-amber-100 text-amber-700' :
                            driver.current_status === 'en_route_to_dropoff' ? 'bg-purple-100 text-purple-700' :
                            driver.current_status === 'at_dropoff' ? 'bg-green-100 text-green-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {minutesAgo < 1 ? 'Now' : `${minutesAgo}m`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}