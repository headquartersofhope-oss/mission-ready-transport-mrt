import { MapPin, Clock } from 'lucide-react';

export default function RiderPortalHeader({ firstName, email, unreadCount }) {
  return (
    <div className="space-y-5 pb-3">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Your Rides</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground ml-13">Welcome back, {firstName}. View your scheduled trips below.</p>
      </div>
    </div>
  );
}