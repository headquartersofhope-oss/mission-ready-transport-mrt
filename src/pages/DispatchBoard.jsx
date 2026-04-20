import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Settings } from 'lucide-react';
import PremiumPageHeader from '../components/premium/PremiumPageHeader';
import RideCard from '../components/premium/RideCard';
import { useNavigate } from 'react-router-dom';

const statusColumns = [
  { status: 'pending', label: 'Pending', color: 'from-amber-500' },
  { status: 'scheduled', label: 'Scheduled', color: 'from-blue-500' },
  { status: 'driver_assigned', label: 'Assigned', color: 'from-purple-500' },
  { status: 'en_route', label: 'En Route', color: 'from-sky-500' },
  { status: 'completed', label: 'Completed', color: 'from-emerald-500' },
];

export default function DispatchBoard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const { data: requests = [] } = useQuery({
    queryKey: ['transport-requests'],
    queryFn: () => base44.entities.TransportRequest.list('-created_date', 1000),
  });

  const todaysRides = useMemo(() => {
    let rides = requests.filter(r => r.request_date === today);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      rides = rides.filter(r => 
        r.participant_name?.toLowerCase().includes(term) ||
        r.pickup_location?.toLowerCase().includes(term)
      );
    }
    return rides;
  }, [requests, searchTerm]);

  const columns = statusColumns.map(col => ({
    ...col,
    rides: todaysRides.filter(r => r.status === col.status),
  }));

  return (
    <div className="space-y-6">
      <PremiumPageHeader 
        title="Dispatch Board" 
        subtitle="High-contrast ride management"
      >
        <div className="flex gap-2">
          <Input 
            placeholder="Search rides..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-xs bg-input border-border"
          />
          <Button onClick={() => navigate('/requests')} className="bg-primary">
            <Plus className="w-4 h-4 mr-2" /> New Ride
          </Button>
        </div>
      </PremiumPageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 auto-rows-max">
        {columns.map(column => (
          <div key={column.status} className="board-column min-h-96">
            <div className={`bg-gradient-to-r ${column.color} to-transparent p-4 border-b border-border/50`}>
              <h3 className="font-bold text-white">{column.label}</h3>
              <p className="text-sm text-white/70">{column.rides.length} rides</p>
            </div>
            <div className="p-3 space-y-2 overflow-y-auto max-h-96">
              {column.rides.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No rides</p>
              ) : (
                column.rides.map(ride => (
                  <RideCard 
                    key={ride.id} 
                    ride={ride}
                    onClick={() => navigate(`/requests?id=${ride.id}`)}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}