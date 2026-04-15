import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell, CheckCircle2, Truck, AlertTriangle, X, Clock, MapPin, User, MessageSquare
} from 'lucide-react';

const notificationConfig = {
  ride_approved: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20', label: 'Approved' },
  driver_assigned: { icon: User, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20', label: 'Driver Assigned' },
  pickup_confirmed: { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20', label: 'Confirmed' },
  en_route: { icon: Truck, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/20', label: 'En Route' },
  arriving_soon: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', label: 'Arriving Soon' },
  arrived: { icon: MapPin, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20', label: 'Arrived' },
  delayed: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', label: 'Delayed' },
  completed: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20', label: 'Completed' },
  no_show: { icon: X, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20', label: 'No-Show' },
  cancelled: { icon: X, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20', label: 'Cancelled' },
  reminder: { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20', label: 'Reminder' },
};

export default function RiderNotificationCenter({ notifications = [] }) {
  const [dismissed, setDismissed] = useState(new Set());
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RiderNotification.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rider-notifications'] }),
  });

  const handleDismiss = (id) => {
    setDismissed(prev => new Set([...prev, id]));
    updateMutation.mutate({ id, data: { status: 'read' } });
  };

  const unread = notifications.filter(n => !dismissed.has(n.id) && n.status !== 'read');
  
  if (unread.length === 0) return null;

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            Notifications ({unread.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {unread.map(notif => {
          const config = notificationConfig[notif.notification_type] || notificationConfig.reminder;
          const Icon = config.icon;
          return (
            <div key={notif.id} className={`flex items-start gap-3 p-3 rounded-lg ${config.bg} border border-blue-200/50`}>
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{config.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{notif.message_body || 'Your ride has been updated'}</p>
                {notif.driver_name && (
                  <p className="text-xs text-foreground mt-1">
                    <span className="font-medium">Driver:</span> {notif.driver_name}
                  </p>
                )}
                {notif.estimated_arrival && (
                  <p className="text-xs text-foreground">
                    <span className="font-medium">ETA:</span> {notif.estimated_arrival}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDismiss(notif.id)}
                className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}