import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, Search, Calendar, Clock, MapPin, User, Trash2, 
  Edit, ChevronRight, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import RequestForm from '../components/requests/RequestForm';
import RequestDetail from '../components/requests/RequestDetail';
import PremiumPageHeader from '../components/premium/PremiumPageHeader';

const statusColors = {
  requested: { bg: 'bg-slate-500/10', text: 'text-slate-300', border: 'border-slate-500/30' },
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/30' },
  approved: { bg: 'bg-sky-500/10', text: 'text-sky-300', border: 'border-sky-500/30' },
  scheduled: { bg: 'bg-blue-500/10', text: 'text-blue-300', border: 'border-blue-500/30' },
  driver_assigned: { bg: 'bg-purple-500/10', text: 'text-purple-300', border: 'border-purple-500/30' },
  en_route: { bg: 'bg-sky-500/10', text: 'text-sky-300', border: 'border-sky-500/30' },
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  cancelled: { bg: 'bg-red-500/10', text: 'text-red-300', border: 'border-red-500/30' },
};

export default function Requests() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['transport-requests'],
    queryFn: () => base44.entities.TransportRequest.list('-created_date', 1000),
  });

  const deleteRequest = useMutation({
    mutationFn: id => base44.entities.TransportRequest.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transport-requests'] }),
  });

  const filteredRequests = useMemo(() => {
    let result = requests;
    if (statusFilter !== 'all') result = result.filter(r => r.status === statusFilter);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.participant_name?.toLowerCase().includes(term) ||
        r.pickup_location?.toLowerCase().includes(term) ||
        r.dropoff_location?.toLowerCase().includes(term)
      );
    }
    return result;
  }, [requests, searchTerm, statusFilter]);

  const selectedRequest = requests.find(r => r.id === selectedId);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (view === 'detail' && selectedRequest) {
    return <RequestDetail request={selectedRequest} onClose={() => setView('list')} />;
  }

  if (view === 'form') {
    return <RequestForm existingRequest={selectedRequest} onClose={() => { setView('list'); setSelectedId(null); }} />;
  }

  return (
    <div className="space-y-6">
      <PremiumPageHeader 
        title="Ride Requests" 
        subtitle={`${filteredRequests.length} total`}
      >
        <div className="flex gap-2">
          <Button onClick={() => setView('form')} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> New Request
          </Button>
        </div>
      </PremiumPageHeader>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, location..."
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
          <option value="all">All Statuses</option>
          {Object.keys(statusColors).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="grid gap-3">
        {filteredRequests.map(request => {
          const colors = statusColors[request.status] || statusColors.pending;
          return (
            <div 
              key={request.id}
              className="board-card cursor-pointer group border-l-4 transition-all"
              style={{ borderLeftColor: request.priority === 'urgent' ? '#F87171' : request.priority === 'high' ? '#FBBF24' : '#60A5FA' }}
              onClick={() => { setSelectedId(request.id); setView('detail'); }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white">{request.participant_name}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                      {request.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-primary/60" />
                      <span>{request.pickup_location} → {request.dropoff_location}</span>
                    </div>
                    {request.pickup_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-amber-400/60" />
                        <span>{request.pickup_time}</span>
                      </div>
                    )}
                    {request.assigned_driver_name && (
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-purple-400/60" />
                        <span>{request.assigned_driver_name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={e => { e.stopPropagation(); setSelectedId(request.id); setView('form'); }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={e => { e.stopPropagation(); deleteRequest.mutate(request.id); }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRequests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No requests found</p>
        </div>
      )}
    </div>
  );
}