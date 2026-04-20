import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, AlertTriangle, AlertCircle } from 'lucide-react';
import IncidentForm from '../components/incidents/IncidentForm';
import IncidentDetail from '../components/incidents/IncidentDetail';
import PremiumPageHeader from '../components/premium/PremiumPageHeader';

const severityColors = {
  low: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  medium: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  high: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  critical: 'bg-red-500/10 text-red-300 border-red-500/30',
};

export default function Incidents() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-created_date', 500),
  });

  const filteredIncidents = useMemo(() => {
    let result = incidents;
    if (statusFilter !== 'all') result = result.filter(i => i.status === statusFilter);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(i => 
        i.participant_name?.toLowerCase().includes(term) ||
        i.driver_name?.toLowerCase().includes(term) ||
        i.description?.toLowerCase().includes(term)
      );
    }
    return result;
  }, [incidents, searchTerm, statusFilter]);

  const selectedIncident = incidents.find(i => i.id === selectedId);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (view === 'detail' && selectedIncident) {
    return <IncidentDetail incident={selectedIncident} onClose={() => setView('list')} />;
  }

  if (view === 'form') {
    return <IncidentForm existingIncident={selectedIncident} onClose={() => { setView('list'); setSelectedId(null); queryClient.invalidateQueries({ queryKey: ['incidents'] }); }} />;
  }

  return (
    <div className="space-y-6">
      <PremiumPageHeader 
        title="Incidents" 
        subtitle={`${filteredIncidents.length} total`}
      >
        <div className="flex gap-2">
          <Button onClick={() => { setSelectedId(null); setView('form'); }} className="bg-primary">
            <Plus className="w-4 h-4 mr-2" /> Report Incident
          </Button>
        </div>
      </PremiumPageHeader>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-input border-border"
            />
          </div>
        </div>
        <select 
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border bg-input text-foreground text-sm"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="escalated">Escalated</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="grid gap-3">
        {filteredIncidents.map(incident => (
          <Card 
            key={incident.id}
            className={`cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 border-l-4 ${severityColors[incident.severity]}`}
            onClick={() => { setSelectedId(incident.id); setView('detail'); }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <h3 className="font-semibold text-white">{incident.incident_type?.replace(/_/g, ' ')}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded border ${severityColors[incident.severity]}`}>
                      {incident.severity}
                    </span>
                  </div>
                  {incident.participant_name && (
                    <p className="text-sm text-muted-foreground mb-1">{incident.participant_name}</p>
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-2">{incident.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{incident.incident_date}</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full block mt-2 ${
                    incident.status === 'open' ? 'bg-red-500/10 text-red-300' :
                    incident.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-300' :
                    'bg-amber-500/10 text-amber-300'
                  }`}>
                    {incident.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredIncidents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No incidents found</p>
        </div>
      )}
    </div>
  );
}