# Role-Based Access Control (RBAC) Implementation Guide

## Overview

This document describes the implementation of Role-Based Access Control (RBAC) in the Project Management application. The system fetches user roles from the backend and enforces permissions throughout the UI.

## Architecture

### 1. Role Fetching Flow

```
User Login → AuthGuard → Fetch Role from API → Store in localStorage → UI Updates
```

### 2. Role Types

- **super-admin**: Full access to all features and settings
- **admin**: Full access except role management
- **manager**: Read-all + limited create/update on tasks and projects
- **user**: Read-only access (default)

### 3. Permission Model

```typescript
Permissions:
- read:all           // View all resources
- create:projects    // Create new projects
- create:tasks       // Create new tasks
- create:companies   // Create new companies
- create:departments // Create new departments
- create:teams       // Create new teams
- update:*           // Update resources
- delete:*           // Delete resources
- manage:settings    // Access settings
- manage:users       // Manage users
- manage:roles       // Manage roles
```

## Implementation Details

### 1. API Endpoint

**File**: `app/api/roles/route.ts`

```
GET /api/roles?userId=xxx
```

Fetches user role from:
```
https://brmh.in/namespace-roles/:userId/projectmanagement
```

**Response Format**:
```json
{
  "success": true,
  "userId": "e4680438-9091-70bd-625d-e31143790d37",
  "namespace": "projectmanagement",
  "role": "admin",
  "permissions": ["read:all", "create:projects", ...],
  "assignedAt": "2025-10-08T12:00:00.000Z",
  "updatedAt": "2025-10-08T12:00:00.000Z",
  "assignedBy": "admin"
}
```

If no role is found (404), returns default:
```json
{
  "success": true,
  "role": "user",
  "permissions": ["read:all"],
  "isDefault": true
}
```

### 2. RBAC Utilities

**File**: `app/utils/rbac.ts`

Core functions:
- `hasPermission(role, permission)` - Check single permission
- `hasAnyPermission(role, permissions)` - Check if has any permission
- `hasAllPermissions(role, permissions)` - Check if has all permissions
- `isAdmin(role)` - Check if admin/super-admin
- `canCreate(role, resource)` - Check create permission
- `canUpdate(role, resource)` - Check update permission
- `canDelete(role, resource)` - Check delete permission
- `getRoleDisplayName(role)` - Get formatted role name
- `getRoleBadgeColor(role)` - Get role badge styling
- `fetchUserRole(userId)` - Fetch role from API

### 3. AuthGuard Updates

**File**: `app/components/AuthGuard.tsx`

**Changes**:
- Added role fetching after successful authentication
- Fetches from `/api/roles?userId=xxx`
- Stores role and permissions in localStorage
- Falls back to 'user' role if fetch fails

**localStorage Keys**:
```javascript
{
  "userRole": "admin",
  "userPermissions": ["read:all", "create:projects", ...]
}
```

### 4. Role-Based UI Components

**File**: `app/components/RoleBasedUI.tsx`

**Components**:

#### `<RoleGuard>`
Only renders children if user has required permission(s)

```tsx
<RoleGuard permission="create:projects">
  <button>Create Project</button>
</RoleGuard>

<RoleGuard permissions={["update:projects", "delete:projects"]} requireAll>
  <button>Advanced Actions</button>
</RoleGuard>
```

#### `<AdminOnly>`
Only renders for admin/super-admin users

```tsx
<AdminOnly fallback={<ReadOnlyMessage />}>
  <SettingsPanel />
</AdminOnly>
```

#### `<CreateButton>`
Button that only appears if user can create

```tsx
<CreateButton
  resource="projects"
  onClick={handleCreate}
  className="btn-primary"
>
  Create Project
</CreateButton>
```

#### `<UpdateButton>`
Button that only appears if user can update

```tsx
<UpdateButton
  resource="projects"
  onClick={handleEdit}
  className="btn-secondary"
>
  Edit Project
</UpdateButton>
```

#### `<DeleteButton>`
Button that only appears if user can delete

```tsx
<DeleteButton
  resource="projects"
  onClick={handleDelete}
  className="btn-danger"
>
  Delete Project
</DeleteButton>
```

#### `<ReadOnlyBadge>`
Shows a "Read Only" badge for non-admin users

```tsx
<ReadOnlyBadge />
```

#### `usePermissions()` Hook
Hook to check permissions in components

```tsx
const { userRole, isAdmin, canCreate, canUpdate, canDelete } = usePermissions();

if (canCreate('projects')) {
  // Show create button
}
```

### 5. Sidebar Updates

**File**: `app/components/Sidebar.tsx`

**Changes**:
- Added role badge display under user email
- Shows formatted role name with color-coded badge
- Role badge colors:
  - Super Admin: Purple
  - Admin: Red
  - Manager: Blue
  - User: Gray

### 6. Project Page Updates

**File**: `app/project/page.tsx`

**Changes**:
- Wrapped "Create Project" FAB with `<CreateButton>`
- Wrapped "Edit Project" button with `<UpdateButton>`
- Wrapped "Delete Project" buttons with `<DeleteButton>`
- Added `<ReadOnlyBadge>` to page header

**Result**:
- Non-admin users only see view functionality
- Create/Edit/Delete buttons hidden for users without permissions

## Usage Examples

### Protecting Create Actions

```tsx
import { CreateButton } from '../components/RoleBasedUI';

<CreateButton resource="projects" onClick={handleCreateProject} className="btn-primary">
  <Plus /> New Project
</CreateButton>
```

### Protecting Edit Actions

```tsx
import { UpdateButton } from '../components/RoleBasedUI';

<UpdateButton resource="tasks" onClick={() => handleEdit(task)} className="btn-edit">
  <Edit /> Edit
</UpdateButton>
```

### Protecting Delete Actions

```tsx
import { DeleteButton } from '../components/RoleBasedUI';

<DeleteButton resource="companies" onClick={() => handleDelete(company.id)} className="btn-delete">
  <Trash2 /> Delete
</DeleteButton>
```

### Using Permission Hooks

```tsx
import { usePermissions } from '../components/RoleBasedUI';

function MyComponent() {
  const { isAdmin, canCreate, userRole } = usePermissions();
  
  return (
    <div>
      {isAdmin && <AdminPanel />}
      {canCreate('tasks') && <CreateTaskButton />}
      <span>Role: {userRole}</span>
    </div>
  );
}
```

### Conditional Rendering

```tsx
import { RoleGuard, ReadOnlyBadge } from '../components/RoleBasedUI';

<div>
  <ReadOnlyBadge />
  
  <RoleGuard permission="manage:settings">
    <AdvancedSettings />
  </RoleGuard>
</div>
```

## Testing Roles

### Test Different Roles

1. **Admin/Super-Admin**: Should see all buttons and features
2. **Manager**: Should see read + some create/update buttons
3. **User**: Should only see view functionality, no create/edit/delete buttons

### Verify Role Assignment

1. Login as a user
2. Check browser console for `[AuthGuard] Role fetched: <role>`
3. Check localStorage: `localStorage.getItem('userRole')`
4. Check sidebar for role badge
5. Try accessing restricted features

### Backend Role Configuration

To assign roles to users, use the backend endpoint:

```bash
# Example: Assign admin role to user
curl -X POST https://brmh.in/namespace-roles \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "e4680438-9091-70bd-625d-e31143790d37",
    "namespace": "projectmanagement",
    "role": "admin",
    "permissions": ["read:all", "create:projects", ...],
    "assignedBy": "super-admin"
  }'
```

## Migration Guide for Other Pages

To add RBAC to other pages (Tasks, Companies, Departments, Teams):

1. **Import components**:
```tsx
import { CreateButton, UpdateButton, DeleteButton, ReadOnlyBadge } from '../components/RoleBasedUI';
```

2. **Replace create buttons**:
```tsx
// Before
<button onClick={handleCreate}>Create</button>

// After
<CreateButton resource="tasks" onClick={handleCreate}>Create</CreateButton>
```

3. **Replace edit buttons**:
```tsx
// Before
<button onClick={handleEdit}>Edit</button>

// After
<UpdateButton resource="tasks" onClick={handleEdit}>Edit</UpdateButton>
```

4. **Replace delete buttons**:
```tsx
// Before
<button onClick={handleDelete}>Delete</button>

// After
<DeleteButton resource="tasks" onClick={handleDelete}>Delete</DeleteButton>
```

5. **Add read-only badge**:
```tsx
<div className="header">
  <h1>Tasks</h1>
  <ReadOnlyBadge />
</div>
```

## Security Notes

1. **Frontend Only**: This is UI-level protection. Backend APIs should also validate permissions.
2. **localStorage**: Role data is stored in localStorage and can be inspected by users.
3. **Backend Validation**: Always validate permissions on the backend for critical operations.
4. **Token Validation**: The middleware should validate tokens and roles server-side.

## Troubleshooting

### Role Not Loading

**Issue**: User role stays as "user" even though they have a different role.

**Solution**:
1. Check browser console for API errors
2. Verify the backend endpoint is accessible: `https://brmh.in/namespace-roles/:userId/projectmanagement`
3. Check network tab for API response
4. Clear localStorage and login again

### Buttons Still Visible

**Issue**: Create/Edit/Delete buttons are visible even for non-admin users.

**Solution**:
1. Verify you're using the role-based components (`CreateButton`, `UpdateButton`, `DeleteButton`)
2. Check that the `resource` prop matches the permission scheme
3. Verify `userRole` in localStorage is correct
4. Check browser console for permission check logs

### Role Badge Not Showing

**Issue**: Role badge not appearing in sidebar.

**Solution**:
1. Verify `user?.role` exists in the auth context
2. Check that role fetching succeeded (console logs)
3. Clear cache and refresh the page
4. Verify imports of `getRoleDisplayName` and `getRoleBadgeColor`

## Future Enhancements

1. **Dynamic Permissions**: Fetch permissions from backend instead of static mapping
2. **Role Hierarchy**: Implement role inheritance (admin inherits manager permissions)
3. **Resource-Level Permissions**: Per-resource permissions (e.g., can edit own tasks only)
4. **Permission Caching**: Cache permissions for better performance
5. **Audit Logging**: Log all permission checks and access attempts
6. **Role Management UI**: Admin interface to assign/manage roles

## Summary

The RBAC system provides:
- ✅ Role fetching from backend API
- ✅ Permission-based UI rendering
- ✅ Reusable role-based components
- ✅ Role badge display in sidebar
- ✅ Read-only mode for non-admin users
- ✅ Comprehensive utility functions
- ✅ Easy migration path for other pages

All admin and super-admin users have full access, while users and managers have limited access based on their role permissions.

