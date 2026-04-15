import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function LocationPermissionPrompt() {
  const [permission, setPermission] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setPermission('unsupported');
      return;
    }

    // Check if permission is already granted
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setPermission(result.state);
        result.addEventListener('change', () => setPermission(result.state));
      });
    }
  }, []);

  const handleRequestPermission = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      () => setPermission('granted'),
      () => setPermission('denied')
    );
  };

  if (permission === 'granted') {
    return (
      <Card className="p-3 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            <strong>Location tracking active.</strong> Your position is being shared with dispatchers.
          </p>
        </div>
      </Card>
    );
  }

  if (permission === 'denied' || permission === 'unsupported') {
    return (
      <Card className="p-3 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                {permission === 'unsupported' 
                  ? 'Location not supported' 
                  : 'Location access denied'}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-300 mt-0.5">
                {permission === 'unsupported'
                  ? 'Your browser does not support geolocation.'
                  : 'Enable location in browser settings to share your position with dispatchers.'}
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Permission not yet determined
  return (
    <Card className="p-3 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Enable Location Tracking
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-0.5">
              Allow this app to share your location so dispatchers can track your position and provide better support.
            </p>
          </div>
        </div>
        <Button 
          onClick={handleRequestPermission}
          size="sm"
          className="shrink-0"
        >
          Enable
        </Button>
      </div>
    </Card>
  );
}