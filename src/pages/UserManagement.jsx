import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/AuthContext';
import { canManageUsers } from '@/lib/permissions';
import { getRoleDisplayName, getRoleDescription, ROLES } from '@/lib/permissions';
import { Search, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function UserManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Hooks MUST be called before any conditional returns
  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ email, role }) => base44.auth.updateMe({ role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-users'] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, is_active }) => base44.entities.User.update(userId, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-users'] }),
  });

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      const matchesSearch = u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           u.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [allUsers, searchQuery, roleFilter]);

  // Check permission AFTER all hooks
  if (!user || !canManageUsers(user.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
          <p className="font-semibold">Access Denied</p>
          <p className="text-sm text-muted-foreground">Only Super Admin and Admin can manage users.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isSuperAdmin = user?.role === 'super_admin';
  const diamondboxIsSuperAdmin = allUsers.find(u => u.email === 'diamondboyig@gmail.com')?.role === 'super_admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage roles and permissions for all app users</p>
      </div>

      {!diamondboxIsSuperAdmin && isSuperAdmin && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-200">Action Required</p>
              <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                diamondboyig@gmail.com should be set as Super Admin. Find their account below and update the role.
              </p>
            </div>
          </div>
        </div>
      )}

      {diamondboxIsSuperAdmin && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-emerald-900 dark:text-emerald-200">Super Admin Active</p>
              <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-1">
                diamondboyig@gmail.com is configured as Super Admin with full system access.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 h-9 rounded-lg border border-input bg-background text-sm"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.values(ROLES).map(role => (
              <SelectItem key={role} value={role}>{getRoleDisplayName(role)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium text-sm truncate">{u.full_name || u.email}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <Select
                      value={u.role || 'rider'}
                      onValueChange={(newRole) => updateRoleMutation.mutate({ email: u.email, role: newRole })}
                      disabled={!isSuperAdmin || updateRoleMutation.isPending}
                    >
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ROLES).map(role => (
                          <SelectItem key={role} value={role}>{getRoleDisplayName(role)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Badge variant={u.is_active !== false ? 'default' : 'secondary'}>
                      {u.is_active !== false ? 'Active' : 'Inactive'}
                    </Badge>

                    {u.email === 'diamondboyig@gmail.com' && (
                      <Shield className="w-4 h-4 text-amber-500 shrink-0" title="Primary Admin Account" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Role Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(ROLES).map(role => (
              <div key={role} className="p-3 rounded-lg border border-border bg-muted/20">
                <p className="font-medium text-sm">{getRoleDisplayName(role)}</p>
                <p className="text-xs text-muted-foreground mt-1">{getRoleDescription(role)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}