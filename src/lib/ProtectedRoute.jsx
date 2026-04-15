import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { canAccessPage } from '@/lib/permissions';

/**
 * Route guard component — protects pages by role
 * If user doesn't have permission, redirects to home
 */
export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/my-rides" replace />;
  }

  // If a specific role is required, check it
  if (requiredRole && user.role !== requiredRole && !['super_admin', 'admin'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <p className="font-semibold text-destructive">Access Denied</p>
          <p className="text-sm text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return children;
}