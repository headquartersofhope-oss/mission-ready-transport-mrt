import { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, MapPin, Calendar, Clock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import RiderTripCard from '../components/rider/RiderTripCard';
import RiderNotificationCenter from '../components/rider/RiderNotificationCenter';

export default function RiderPortal() {
  const [currentUser, setCurrentUser] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (err) {
        console.error('Failed to get current user:', err);
      }
    };
    loadUser();
  }, []);

  // Find participant by email match
  const { data: participants = [] } = useQuery({
    queryKey: ['participants-for-rider'],
    queryFn: () => base44.entities.Participant.list('-created_date', 500),
    enabled: !!currentUser,
  });

  useEffect(() => {
    if (currentUser && participants.length > 0) {
      const match = participants.find(p => p.email === currentUser.email);
      if (match) {
        setParticipant(match);
      }
    }
  }, [currentUser, participants]);

  // Get all notifications
  const { data: allNotifications = [] } = useQuery({
    queryKey: ['rider-notifications', participant?.id],
    queryFn: () => base44.entities.RiderNotification.list('-created_date', 500),
    enabled: !!participant,
  });

  // Get rides for this rider
  const { data: allRides = [] } = useQuery({
    queryKey: ['rider-rides', participant?.id],
    queryFn: () => base44.entities.TransportRequest.list('-created_date', 500),
    enabled: !!participant,
  });

  // Filter rides and notifications for current rider
  const rides = useMemo(() => {
    if (!participant) return [];
    return allRides.filter(r => r.participant_id === participant.id);
  }, [allRides, participant]);

  const notifications = useMemo(() => {
    if (!participant) return [];
    return allNotifications.filter(n => n.participant_id === participant.id);
  }, [allNotifications, participant]);

  // Categorize rides
  const upcomingRides = useMemo(() => {
    return rides.filter(r => !['completed', 'cancelled', 'no_show', 'denied'].includes(r.status))
      .sort((a, b) => {
        const dateA = new Date(a.request_date);
        const dateB = new Date(b.request_date);
        if (dateA !== dateB) return dateA - dateB;
        return (a.pickup_time || '').localeCompare(b.pickup_time || '');
      });
  }, [rides]);

  const completedRides = useMemo(() => {
    return rides.filter(r => r.status === 'completed')
      .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
  }, [rides]);

  const issueRides = useMemo(() => {
    return rides.filter(r => ['cancelled', 'no_show', 'denied'].includes(r.status));
  }, [rides]);

  // Count unread notifications
  useEffect(() => {
    const unread = notifications.filter(n => n.status !== 'read').length;
    setUnreadCount(unread);
  }, [notifications]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Your Rides</h1>
          <p className="text-sm text-muted-foreground mt-2">View your scheduled transportation</p>
        </div>
        <Card className="border-0 bg-amber-50/50 dark:bg-amber-950/10 shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-200">Rider profile not found</p>
                <p className="text-sm text-amber-800 dark:text-amber-300 mt-2">
                  Your email ({currentUser.email}) doesn't match any client record yet. Please contact support to link your account.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Your Rides</h1>
        <p className="text-sm text-muted-foreground mt-3">Welcome back, <span className="font-semibold text-foreground">{participant.first_name}</span>. See your scheduled trips below.</p>
      </div>

      {/* Notification Center */}
      {notifications.length > 0 && (
        <RiderNotificationCenter notifications={notifications} />
      )}

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto bg-transparent border-b border-border rounded-none p-0 gap-4">
          <TabsTrigger value="upcoming" className="relative rounded-none border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent pb-3">
            Upcoming
            {upcomingRides.length > 0 && (
              <Badge className="ml-2 text-xs">{upcomingRides.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="relative rounded-none border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent pb-3">
            Completed
            {completedRides.length > 0 && (
              <Badge className="ml-2 text-xs">{completedRides.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="issues" className="relative rounded-none border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent pb-3">
            Issues
            {issueRides.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">{issueRides.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Rides */}
        <TabsContent value="upcoming" className="space-y-4 mt-8">
          {upcomingRides.length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">No upcoming rides scheduled</p>
              <p className="text-xs text-muted-foreground mt-1">Your scheduled rides will appear here</p>
            </Card>
          ) : (
            upcomingRides.map(ride => (
              <RiderTripCard key={ride.id} ride={ride} participant={participant} />
            ))
          )}
        </TabsContent>

        {/* Completed Rides */}
        <TabsContent value="completed" className="space-y-4 mt-8">
          {completedRides.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">No completed rides yet</p>
              <p className="text-xs text-muted-foreground mt-1">Your ride history will appear here</p>
            </Card>
          ) : (
            completedRides.map(ride => (
              <RiderTripCard key={ride.id} ride={ride} participant={participant} />
            ))
          )}
        </TabsContent>

        {/* Issues */}
        <TabsContent value="issues" className="space-y-4 mt-8">
          {issueRides.length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">No issues</p>
              <p className="text-xs text-muted-foreground mt-1">All your rides are proceeding normally</p>
            </Card>
          ) : (
            issueRides.map(ride => (
              <RiderTripCard key={ride.id} ride={ride} participant={participant} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Support footer */}
      <div className="mt-12 pt-8 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          Need help? Contact support or call <span className="font-semibold">{participant.emergency_contact_phone || 'the support line'}</span> for assistance.
        </p>
      </div>
    </div>
  );
}