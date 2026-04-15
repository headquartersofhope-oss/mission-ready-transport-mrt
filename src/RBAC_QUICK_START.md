# MRT RBAC System — Quick Start Guide

## TL;DR

✅ **Super Admin:** diamondboyig@gmail.com (full system access)  
✅ **8 Roles:** super_admin, admin, operations_manager, dispatch_manager, transportation_coordinator, driver, rider, read_only_auditor  
✅ **Menu Filtering:** Users see only pages they can access  
✅ **Field Hiding:** Drivers/riders don't see pricing/billing  
✅ **Own Work Only:** Drivers see only their rides, riders see only their trips  

---

## What Changed

### Before
- 5 legacy roles, no enforcement
- Anyone could access admin pages (no route guards)
- Drivers could see billing/pricing data
- No user management interface

### After
- 8 standardized roles with clear permissions
- Page-level access control (menu + route guards)
- Sensitive fields hidden by role
- User management console at `/user-management`

---

## Files Changed

| File | Change |
|------|--------|
| `entities/User.json` | New role enum + fields |
| `lib/permissions.js` | **NEW** — Central RBAC config |
| `lib/ProtectedRoute.jsx` | **NEW** — Route guard component |
| `lib/AuthContext.jsx` | Added role defaulting |
| `App.jsx` | Added `/user-management` route |
| `components/Layout.jsx` | Added role-based menu filtering |
| `pages/UserManagement.jsx` | **NEW** — User management console |
| `functions/ensureSuperAdmin.js` | **NEW** — Super admin setup function |

---

## Testing Checklist

### 1. Super Admin
- [ ] diamondboyig@gmail.com logs in
- [ ] Go to `/user-management`
- [ ] Confirm role = "super_admin"
- [ ] Click any page in sidebar — should work

### 2. Menu Visibility
- [ ] As super_admin: See all menu items
- [ ] As driver: See ONLY driver portal sidebar (or error)
- [ ] As coordinator: Missing items (like `/diagnostics`, `/user-management`)

### 3. Page Access
- [ ] Super admin can view `/user-management`
- [ ] Driver cannot view `/dispatch-board` (redirects)
- [ ] Rider cannot view `/requests` (redirects)

### 4. Data Hiding
- [ ] Open ride in `/requests` as admin → See `job_value`, `cost_estimate`
- [ ] Open same ride as driver → These fields should be GONE
- [ ] Open ride as rider → Only see rider-relevant fields

### 5. Own Work Only
- [ ] Driver portal shows only MY rides
- [ ] Rider portal shows only MY trips
- [ ] Admin `/requests` shows ALL rides

---

## Role Matrix (Quick Ref)

| Role | Dispatch | Drivers | Vehicles | Costs | Users | Rider Portal | Driver Portal |
|------|----------|---------|----------|-------|-------|--------------|---------------|
| super_admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ops_manager | ✓ | ✓ | ✓ | ✓ | - | ✓ | - |
| dispatch_mgr | ✓ | ✓ | ✓ | - | - | - | - |
| coordinator | ✓ | - | - | - | - | - | - |
| driver | - | - | - | - | - | - | ✓ |
| rider | - | - | - | - | - | ✓ | - |
| auditor | - | - | - | ✓ | - | - | - |

---

## Sensitive Fields (Hidden from Drivers/Riders)

```
❌ HIDDEN from drivers, riders, coordinators:
- job_value
- cost_estimate
- actual_cost
- estimated_cost
- fuel_estimate
- margin
- billing_status
- invoice_number
- invoiced_date
- paid_date
- contract_reference
- business_entity
- rate_per_trip
- rate_per_mile

✅ VISIBLE to drivers:
- status, pickup_location, dropoff_location
- pickup_time, appointment_time
- assigned_driver_name, assigned_vehicle_name
- priority, special_instructions, driver_notes
```

---

## User Management Console (`/user-management`)

**Access:** Super Admin only

**Features:**
- View all users
- Change any user's role
- Activate/deactivate accounts
- Search by email or name
- See role descriptions

**Example:**
```
1. Log in as diamondboyig@gmail.com
2. Go to /user-management
3. Find user "john@example.com"
4. Click role dropdown, select "dispatch_manager"
5. John now has dispatch manager access
```

---

## Key Rules

### Page Access
```
if (user.role not in PAGE_ACCESS[pagePath]) {
  redirect to home
}
```

### Field Visibility
```
if (field in FIELD_VISIBILITY[fieldName]) {
  if (user.role not in allowed_roles) {
    hide field from response
  }
}
```

### Driver/Rider Data
```
if (user.role === 'driver') {
  rides = rides.filter(r => r.assigned_driver_id === userDriverId)
}
if (user.role === 'rider') {
  rides = rides.filter(r => r.participant_id === userParticipantId)
}
```

---

## Troubleshooting

### "User not found" when promoting to super_admin
→ User must log in first before being promoted. Ensure diamondboyig@gmail.com has logged in at least once.

### Menu items missing
→ Check user's role in `/user-management`. Role may be restricted from that page.

### Can see pricing as driver
→ Field filtering may not be applied. Check `filterSensitiveFields()` is being called in your API responses.

### Driver seeing other drivers' rides
→ Check `DriverPortal.jsx` filtering logic. Should filter by `assigned_driver_id === currentDriverId`.

---

## Admin Setup Script (if needed)

Call this function to ensure diamondboyig@gmail.com is super_admin:

```javascript
// In backend:
const res = await base44.functions.invoke('ensureSuperAdmin', {});
// Check response for success/error
```

Or manually via `/user-management`:
1. Log in as super_admin
2. Find diamondboyig@gmail.com
3. Verify role = "super_admin"
4. If not, click dropdown and select "super_admin"

---

## Full Documentation

See `RBAC_PERMISSIONS_REPORT.md` for:
- Complete audit of previous system
- Detailed role descriptions
- Field visibility matrix
- Implementation details
- Full verification checklist

---

**Status:** ✅ Ready for testing  
**Super Admin:** diamondboyig@gmail.com  
**Next Step:** Run verification checklist above