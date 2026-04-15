/**
 * MRT Role-Based Access Control (RBAC) System
 * Defines permissions for each role and helper utilities
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  OPERATIONS_MANAGER: 'operations_manager',
  DISPATCH_MANAGER: 'dispatch_manager',
  TRANSPORTATION_COORDINATOR: 'transportation_coordinator',
  DRIVER: 'driver',
  RIDER: 'rider',
  READ_ONLY_AUDITOR: 'read_only_auditor',
};

/**
 * Page access control — which roles can view which pages
 */
export const PAGE_ACCESS = {
  // Admin/Dispatch Pages
  '/': ['super_admin', 'admin', 'operations_manager', 'dispatch_manager', 'transportation_coordinator'],
  '/requests': ['super_admin', 'admin', 'operations_manager', 'dispatch_manager', 'transportation_coordinator', 'read_only_auditor'],
  '/dispatch-board': ['super_admin', 'admin', 'dispatch_manager', 'transportation_coordinator'],
  '/drivers': ['super_admin', 'admin', 'operations_manager', 'dispatch_manager'],
  '/vehicles': ['super_admin', 'admin', 'operations_manager', 'dispatch_manager'],
  '/participants': ['super_admin', 'admin', 'operations_manager'],
  '/recurring': ['super_admin', 'admin', 'operations_manager', 'dispatch_manager', 'transportation_coordinator'],
  '/providers': ['super_admin', 'admin', 'operations_manager'],
  '/costs': ['super_admin', 'admin', 'operations_manager', 'read_only_auditor'],
  '/incidents': ['super_admin', 'admin', 'operations_manager', 'dispatch_manager', 'transportation_coordinator', 'read_only_auditor'],
  '/diagnostics': ['super_admin', 'admin'],
  '/reports': ['super_admin', 'admin', 'operations_manager', 'read_only_auditor'],
  '/audit': ['super_admin', 'admin'],
  '/ai-intelligence': ['super_admin', 'admin', 'operations_manager'],
  
  // Driver Pages
  '/driver-portal': ['driver'],
  
  // Rider Pages
  '/my-rides': ['rider'],
};

/**
 * Field visibility control — which roles can see sensitive data
 */
export const FIELD_VISIBILITY = {
  // Financial/Pricing fields
  job_value: ['super_admin', 'admin', 'operations_manager'],
  cost_estimate: ['super_admin', 'admin', 'operations_manager'],
  actual_cost: ['super_admin', 'admin', 'operations_manager'],
  estimated_cost: ['super_admin', 'admin', 'operations_manager'],
  fuel_estimate: ['super_admin', 'admin', 'operations_manager'],
  margin: ['super_admin', 'admin', 'operations_manager'],
  
  // Billing fields
  billing_status: ['super_admin', 'admin', 'operations_manager'],
  invoice_number: ['super_admin', 'admin', 'operations_manager'],
  invoiced_date: ['super_admin', 'admin', 'operations_manager'],
  paid_date: ['super_admin', 'admin', 'operations_manager'],
  billing_notes: ['super_admin', 'admin', 'operations_manager'],
  
  // Contract/Business fields
  contract_reference: ['super_admin', 'admin', 'operations_manager'],
  business_entity: ['super_admin', 'admin', 'operations_manager'],
  rate_per_trip: ['super_admin', 'admin', 'operations_manager'],
  rate_per_mile: ['super_admin', 'admin', 'operations_manager'],
  
  // Internal notes
  admin_notes: ['super_admin', 'admin'],
  
  // Everyone can see operational fields
  status: ['*'],
  request_date: ['*'],
  pickup_location: ['*'],
  dropoff_location: ['*'],
  pickup_time: ['*'],
  appointment_time: ['*'],
  assigned_driver_name: ['*'],
  assigned_vehicle_name: ['*'],
  priority: ['*'],
  special_instructions: ['*'],
};

/**
 * Check if user can access a page
 */
export function canAccessPage(userRole, pagePath) {
  const allowedRoles = PAGE_ACCESS[pagePath];
  if (!allowedRoles) return true; // If page not in list, allow (404 will handle)
  return allowedRoles.includes(userRole);
}

/**
 * Check if user can view a specific field
 */
export function canViewField(userRole, fieldName) {
  const allowedRoles = FIELD_VISIBILITY[fieldName];
  if (!allowedRoles) return true; // If field not restricted, allow
  if (allowedRoles.includes('*')) return true; // If wildcard, allow all
  return allowedRoles.includes(userRole);
}

/**
 * Filter object to remove sensitive fields based on user role
 */
export function filterSensitiveFields(obj, userRole) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const filtered = { ...obj };
  Object.keys(filtered).forEach(key => {
    if (!canViewField(userRole, key)) {
      delete filtered[key];
    }
  });
  return filtered;
}

/**
 * Check if user is a management/admin role
 */
export function isAdminRole(userRole) {
  return ['super_admin', 'admin', 'operations_manager', 'dispatch_manager'].includes(userRole);
}

/**
 * Check if user can manage users
 */
export function canManageUsers(userRole) {
  return ['super_admin', 'admin'].includes(userRole);
}

/**
 * Check if user can manage dispatch/assignments
 */
export function canManageDispatch(userRole) {
  return ['super_admin', 'admin', 'dispatch_manager', 'transportation_coordinator'].includes(userRole);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role) {
  const names = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    operations_manager: 'Operations Manager',
    dispatch_manager: 'Dispatch Manager',
    transportation_coordinator: 'Transportation Coordinator',
    driver: 'Driver',
    rider: 'Rider',
    read_only_auditor: 'Read-Only Auditor',
  };
  return names[role] || role;
}

/**
 * Get role description
 */
export function getRoleDescription(role) {
  const descriptions = {
    super_admin: 'Full access to all systems, settings, and user management',
    admin: 'Broad operational access including dispatch, fleet, and users',
    operations_manager: 'Can manage operations, dispatch, and view financial data',
    dispatch_manager: 'Can manage ride dispatch and driver assignments',
    transportation_coordinator: 'Can coordinate rides and manage day-to-day operations',
    driver: 'Can view only their own assigned rides and operational data',
    rider: 'Can view only their own rides and notifications',
    read_only_auditor: 'Can view reports and audit data only',
  };
  return descriptions[role] || '';
}