import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search } from 'lucide-react';
import RideTable from '../components/dispatch/RideTable';
import RequestForm from '../components/requests/RequestForm';
import RequestDetail from '../components/requests/RequestDetail';

export default function Requests() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list'); // list | form | detail
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Check for id in URL params
  const urlParams = new URLSearchParams(window.location.search);
  const urlId = urlParams.get('id');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['transport-requests'],
    queryFn: () => base44.entities.TransportRequest.list('-created_date', 500),
  });

  // If URL has an id, show that request detail
  const urlRequest = urlId ? requests.find(r => r.id === urlId) : null;
  if (urlRequest && view === 'list' && !selectedRequest) {
    setSelectedRequest(urlRequest);
    setView('detail');
  }

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TransportRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-requests'] });
      setView('list');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TransportRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-requests'] });
      setView('list');
      setSelectedRequest(null);
    },
  });

  const filtered = useMemo(() => {
    return requests.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (search && !r.participant_name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [requests, statusFilter, search]);

  const handleRowClick = (ride) => {
    setSelectedRequest(ride);
    setView('detail');
  };

  const handleSave = async (data) => {
    if (selectedRequest) {
      await updateMutation.mutateAsync({ id: selectedRequest.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  if (view === 'form') {
    return (
      <RequestForm
        existingRequest={selectedRequest}
        onSave={handleSave}
        onCancel={() => { setView('list'); setSelectedRequest(null); }}
      />
    );
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
          <h1 className="text-2xl font-bold tracking-tight">Transport Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all ride requests and approvals</p>
        </div>
        <Button onClick={() => { setSelectedRequest(null); setView('form'); }} className="gap-2">
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search participant…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="assigned">Assigned</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <RideTable rides={filtered} onRowClick={handleRowClick} />
      )}
    </div>
  );
}