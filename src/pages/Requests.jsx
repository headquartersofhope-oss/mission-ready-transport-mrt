import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter } from 'lucide-react';
import RideTable from '../components/dispatch/RideTable';
import RequestForm from '../components/requests/RequestForm';
import RequestDetail from '../components/requests/RequestDetail';

const STATUS_GROUPS = {
  all: null,
  needs_action: ['requested', 'pending', 'under_review', 'approved'],
  assigned: ['scheduled', 'driver_assigned', 'assigned'],
  active: ['en_route', 'rider_picked_up', 'dropped_off', 'return_pending', 'in_progress'],
  completed: ['completed'],
  issues: ['no_show', 'incident_review', 'denied', 'cancelled'],
};

export default function Requests() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusGroup, setStatusGroup] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('all');
  const [search, setSearch] = useState('');

  const urlParams = new URLSearchParams(window.location.search);
  const urlId = urlParams.get('id');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['transport-requests'],
    queryFn: () => base44.entities.TransportRequest.list('-created_date', 1000),
  });

  const urlRequest = urlId ? requests.find(r => r.id === urlId) : null;
  if (urlRequest && view === 'list' && !selectedRequest) {
    setSelectedRequest(urlRequest);
    setView('detail');
  }

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TransportRequest.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transport-requests'] }); setView('list'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TransportRequest.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transport-requests'] }); setView('list'); setSelectedRequest(null); },
  });

  const uniqueDrivers = [...new Set(requests.filter(r => r.assigned_driver_name).map(r => r.assigned_driver_name))];

  const filtered = useMemo(() => {
    return requests.filter(r => {
      if (statusGroup !== 'all' && STATUS_GROUPS[statusGroup] && !STATUS_GROUPS[statusGroup].includes(r.status)) return false;
      if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;
      if (dateFilter && r.request_date !== dateFilter) return false;
      if (driverFilter !== 'all' && r.assigned_driver_name !== driverFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return r.participant_name?.toLowerCase().includes(q) || r.pickup_location?.toLowerCase().includes(q) || r.dropoff_location?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [requests, statusGroup, priorityFilter, dateFilter, driverFilter, search]);

  const counts = useMemo(() => ({
    all: requests.length,
    needs_action: requests.filter(r => STATUS_GROUPS.needs_action.includes(r.status)).length,
    assigned: requests.filter(r => STATUS_GROUPS.assigned.includes(r.status)).length,
    active: requests.filter(r => STATUS_GROUPS.active.includes(r.status)).length,
    completed: requests.filter(r => r.status === 'completed').length,
    issues: requests.filter(r => STATUS_GROUPS.issues.includes(r.status)).length,
  }), [requests]);

  const handleSave = async (data) => {
    if (selectedRequest) {
      await updateMutation.mutateAsync({ id: selectedRequest.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  if (view === 'form') {
    return <RequestForm existingRequest={selectedRequest} onSave={handleSave} onCancel={() => { setView('list'); setSelectedRequest(null); }} />;
  }

  if (view === 'detail' && selectedRequest) {
    return (
      <RequestDetail
        request={selectedRequest}
        onBack={() => { setView('list'); setSelectedRequest(null); window.history.replaceState({}, '', '/requests'); }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ride Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} of {requests.length} requests shown</p>
        </div>
        <Button onClick={() => { setSelectedRequest(null); setView('form'); }} className="gap-2">
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </div>

      {/* Status Group Tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(counts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setStatusGroup(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize
              ${statusGroup === key 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-card border-border text-muted-foreground hover:border-primary/50'}`}
          >
            {key.replace(/_/g, ' ')} <span className="ml-1 opacity-70">{count}</span>
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search rider or address…" className="pl-9 h-8 w-48 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="h-8 px-2 rounded-md border border-input bg-transparent text-xs" />
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
          </SelectContent>
        </Select>
        <Select value={driverFilter} onValueChange={setDriverFilter}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All Drivers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drivers</SelectItem>
            {uniqueDrivers.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        {(dateFilter || priorityFilter !== 'all' || driverFilter !== 'all' || search) && (
          <button
            onClick={() => { setDateFilter(''); setPriorityFilter('all'); setDriverFilter('all'); setSearch(''); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <RideTable rides={filtered} onRowClick={r => { setSelectedRequest(r); setView('detail'); }} />
      )}
    </div>
  );
}