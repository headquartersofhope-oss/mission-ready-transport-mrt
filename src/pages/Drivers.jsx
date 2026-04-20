import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Search, AlertCircle } from 'lucide-react';
import DriverForm from '../components/drivers/DriverForm';
import DriverDetail from '../components/drivers/DriverDetail';
import DriverAvailabilityBadge from '../components/premium/DriverAvailabilityBadge';
import PremiumPageHeader from '../components/premium/PremiumPageHeader';

export default function Drivers() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list('first_name', 200),
  });

  const filteredDrivers = useMemo(() => {
    if (!searchTerm) return drivers;
    const term = searchTerm.toLowerCase();
    return drivers.filter(d => 
      `${d.first_name} ${d.last_name}`.toLowerCase().includes(term) ||
      d.email?.toLowerCase().includes(term)
    );
  }, [drivers, searchTerm]);

  const selectedDriver = drivers.find(d => d.id === selectedId);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (view === 'detail' && selectedDriver) {
    return <DriverDetail driver={selectedDriver} onClose={() => setView('list')} />;
  }

  if (view === 'form') {
    return <DriverForm existingDriver={selectedDriver} onClose={() => { setView('list'); setSelectedId(null); }} />;
  }

  return (
    <div className="space-y-6">
      <PremiumPageHeader 
        title="Driver Management" 
        subtitle={`${filteredDrivers.length} drivers`}
      >
        <div className="flex gap-2">
          <Button onClick={() => setView('form')} className="bg-primary">
            <Plus className="w-4 h-4 mr-2" /> Add Driver
          </Button>
        </div>
      </PremiumPageHeader>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search drivers..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9 bg-input border-border"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDrivers.map(driver => (
          <Card 
            key={driver.id}
            className="p-5 cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20"
            onClick={() => { setSelectedId(driver.id); setView('detail'); }}
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white">{driver.first_name} {driver.last_name}</h3>
              <p className="text-xs text-muted-foreground">{driver.driver_id}</p>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="text-muted-foreground">{driver.email}</div>
              {driver.phone && <div className="text-muted-foreground">{driver.phone}</div>}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  driver.status === 'active' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
                }`}>
                  {driver.status}
                </span>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <DriverAvailabilityBadge availability={driver.availability} />
            </div>

            {driver.license_status === 'expired' && (
              <div className="mt-3 flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
                <AlertCircle className="w-3 h-3" />
                License expired
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredDrivers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No drivers found</p>
        </div>
      )}
    </div>
  );
}