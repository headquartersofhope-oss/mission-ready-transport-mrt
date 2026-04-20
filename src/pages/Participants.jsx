import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Search, AlertCircle, Phone, Mail } from 'lucide-react';
import ParticipantForm from '../components/participants/ParticipantForm';
import PremiumPageHeader from '../components/premium/PremiumPageHeader';

const reliabilityColors = {
  excellent: 'bg-emerald-500/10 text-emerald-300',
  good: 'bg-sky-500/10 text-sky-300',
  fair: 'bg-amber-500/10 text-amber-300',
  poor: 'bg-red-500/10 text-red-300',
  probation: 'bg-red-500/10 text-red-300',
};

export default function Participants() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ['participants'],
    queryFn: () => base44.entities.Participant.list('last_name', 500),
  });

  const filteredParticipants = useMemo(() => {
    if (!searchTerm) return participants;
    const term = searchTerm.toLowerCase();
    return participants.filter(p => 
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.phone?.includes(term)
    );
  }, [participants, searchTerm]);

  const selectedParticipant = participants.find(p => p.id === selectedId);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (view === 'form') {
    return <ParticipantForm existing={selectedParticipant} onClose={() => { setView('list'); setSelectedId(null); queryClient.invalidateQueries({ queryKey: ['participants'] }); }} />;
  }

  return (
    <div className="space-y-6">
      <PremiumPageHeader 
        title="Client Registry" 
        subtitle={`${filteredParticipants.length} clients`}
      >
        <div className="flex gap-2">
          <Button onClick={() => { setSelectedId(null); setView('form'); }} className="bg-primary">
            <Plus className="w-4 h-4 mr-2" /> Add Client
          </Button>
        </div>
      </PremiumPageHeader>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search clients..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9 bg-input border-border"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParticipants.map(participant => (
          <Card 
            key={participant.id}
            className="p-5 cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20"
            onClick={() => { setSelectedId(participant.id); setView('form'); }}
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white">{participant.first_name} {participant.last_name}</h3>
              {participant.preferred_name && <p className="text-xs text-muted-foreground">"{participant.preferred_name}"</p>}
            </div>

            <div className="space-y-2 mb-4 text-sm">
              {participant.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{participant.email}</span>
                </div>
              )}
              {participant.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{participant.phone}</span>
                </div>
              )}
              {participant.mobility_needs && (
                <div className="text-xs text-amber-300 bg-amber-500/10 px-2 py-1 rounded w-fit">
                  {participant.mobility_needs}
                </div>
              )}
            </div>

            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Reliability:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${reliabilityColors[participant.reliability_rating]}`}>
                  {participant.reliability_rating}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {participant.total_rides_completed || 0} rides completed
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredParticipants.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No clients found</p>
        </div>
      )}
    </div>
  );
}