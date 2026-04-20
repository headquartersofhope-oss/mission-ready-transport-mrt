import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Search, AlertCircle, Zap, Users } from 'lucide-react';
import VehicleForm from '../components/vehicles/VehicleForm';
import VehicleDetail from '../components/vehicles/VehicleDetail';
import PremiumPageHeader from '../components/premium/PremiumPageHeader';

const statusColors = {
  available: 'bg-emerald-500/10 text-emerald-300',
  in_use: 'bg-blue-500/10 text-blue-300',
  maintenance: 'bg-amber-500/10 text-amber-300',
  out_of_service: 'bg-red-500/10 text-red-300',
};

export default function Vehicles() {
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list('nickname', 100),
  });

  const filteredVehicles = useMemo(() => {
    if (!searchTerm) return vehicles;
    const term = searchTerm.toLowerCase();
    return vehicles.filter(v => 
      v.nickname?.toLowerCase().includes(term) ||
      v.plate?.toLowerCase().includes(term)
    );
  }, [vehicles, searchTerm]);

  const selectedVehicle = vehicles.find(v => v.id === selectedId);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (view === 'detail' && selectedVehicle) {
    return <VehicleDetail vehicle={selectedVehicle} onClose={() => setView('list')} />;
  }

  if (view === 'form') {
    return <VehicleForm existingVehicle={selectedVehicle} onClose={() => { setView('list'); setSelectedId(null); }} />;
  }

  return (
    <div className="space-y-6">
      <PremiumPageHeader 
        title="Vehicle Fleet" 
        subtitle={`${filteredVehicles.length} vehicles`}
      >
        <div className="flex gap-2">
          <Button onClick={() => setView('form')} className="bg-primary">
            <Plus className="w-4 h-4 mr-2" /> Add Vehicle
          </Button>
        </div>
      </PremiumPageHeader>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search vehicles..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9 bg-input border-border"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map(vehicle => (
          <Card 
            key={vehicle.id}
            className="p-5 cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20"
            onClick={() => { setSelectedId(vehicle.id); setView('detail'); }}
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white">{vehicle.nickname}</h3>
              <p className="text-xs text-muted-foreground">{vehicle.plate}</p>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="text-muted-foreground">{vehicle.year} {vehicle.make} {vehicle.model}</div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{vehicle.seat_capacity} seats</span>
              </div>
              {vehicle.fuel_type && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="w-4 h-4" />
                  <span>{vehicle.fuel_type}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Service:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[vehicle.service_status] || statusColors.available}`}>
                  {vehicle.service_status?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {vehicle.maintenance_due_date && new Date(vehicle.maintenance_due_date) < new Date() && (
              <div className="mt-3 flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-300">
                <AlertCircle className="w-3 h-3" />
                Maintenance overdue
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No vehicles found</p>
        </div>
      )}
    </div>
  );
}