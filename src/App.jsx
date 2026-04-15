import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import Layout from './components/Layout';
import DispatchDashboard from './pages/DispatchDashboard';
import Requests from './pages/Requests';
import Participants from './pages/Participants';
import Providers from './pages/Providers';
import RecurringPlans from './pages/RecurringPlans';
import CostTracking from './pages/CostTracking';
import Reports from './pages/Reports';
import Drivers from './pages/Drivers';
import Vehicles from './pages/Vehicles';
import Incidents from './pages/Incidents';
import DriverPortal from './pages/DriverPortal';
import AuditCenter from './pages/AuditCenter';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-4">Loading HOH Transport…</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DispatchDashboard />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/participants" element={<Participants />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/providers" element={<Providers />} />
        <Route path="/recurring" element={<RecurringPlans />} />
        <Route path="/costs" element={<CostTracking />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/driver-portal" element={<DriverPortal />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/audit" element={<AuditCenter />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App