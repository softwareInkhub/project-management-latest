/**
 * Role-Based Access Control (RBAC) Utilities
 * Defines roles, permissions, and access control functions
 */

export type UserRole = 'super-admin' | 'admin' | 'manager' | 'user';

export interface Permission {
  // Read permissions
  'read:all'?: boolean;
  'read:own'?: boolean;
  
  // Write permissions
  'create:projects'?: boolean;
  'create:tasks'?: boolean;
  'create:companies'?: boolean;
  'create:departments'?: boolean;
  'create:teams'?: boolean;
  'create:notes'?: boolean;
  
  // Update permissions
  'update:projects'?: boolean;
  'update:tasks'?: boolean;
  'update:companies'?: boolean;
  'update:departments'?: boolean;
  'update:teams'?: boolean;
  'update:notes'?: boolean;
  
  // Delete permissions
  'delete:projects'?: boolean;
  'delete:tasks'?: boolean;
  'delete:companies'?: boolean;
  'delete:departments'?: boolean;
  'delete:teams'?: boolean;
  'delete:notes'?: boolean;
  
  // Special permissions
  'manage:settings'?: boolean;
  'manage:users'?: boolean;
  'manage:roles'?: boolean;
}

/**
 * Role Definitions with their default permissions
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  'super-admin': [
    'read:all',
    'create:projects',
    'create:tasks',
    'create:companies',
    'create:departments',
    'create:teams',
    'create:notes',
    'update:projects',
    'update:tasks',
    'update:companies',
    'update:departments',
    'update:teams',
    'update:notes',
    'delete:projects',
    'delete:tasks',
    'delete:companies',
    'delete:departments',
    'delete:teams',
    'delete:notes',
    'manage:settings',
    'manage:users',
    'manage:roles',
  ],
  'admin': [
    'read:all',
    'create:projects',
    'create:tasks',
    'create:companies',
    'create:departments',
    'create:teams',
    'create:notes',
    'update:projects',
    'update:tasks',
    'update:companies',
    'update:departments',
    'update:teams',
    'update:notes',
    'delete:projects',
    'delete:tasks',
    'delete:companies',
    'delete:departments',
    'delete:teams',
    'delete:notes',
    'manage:settings',
  ],
  'manager': [
    'read:all',
    'create:tasks',
    'create:notes',
    'update:tasks',
    'update:projects',
    'update:notes',
  ],
  'user': [
    'read:all',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole | string, permission: string): boolean {
  const normalizedRole = (role || 'user') as UserRole;
  const permissions = ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS.user;
  return permissions.includes(permission);
}

/**
 * Check if a role has ANY of the specified permissions
 */
export function hasAnyPermission(role: UserRole | string, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has ALL of the specified permissions
 */
export function hasAllPermissions(role: UserRole | string, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Check if a role is admin or super-admin
 */
export function isAdmin(role: UserRole | string): boolean {
  return role === 'admin' || role === 'super-admin';
}

/**
 * Check if user can create resources
 */
export function canCreate(role: UserRole | string, resource: 'projects' | 'tasks' | 'companies' | 'departments' | 'teams' | 'notes'): boolean {
  return hasPermission(role, `create:${resource}`);
}

/**
 * Check if user can update resources
 */
export function canUpdate(role: UserRole | string, resource: 'projects' | 'tasks' | 'companies' | 'departments' | 'teams' | 'notes'): boolean {
  return hasPermission(role, `update:${resource}`);
}

/**
 * Check if user can delete resources
 */
export function canDelete(role: UserRole | string, resource: 'projects' | 'tasks' | 'companies' | 'departments' | 'teams' | 'notes'): boolean {
  return hasPermission(role, `delete:${resource}`);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole | string): string {
  const roleMap: Record<string, string> = {
    'super-admin': 'Super Admin',
    'admin': 'Admin',
    'manager': 'Manager',
    'user': 'User',
  };
  
  return roleMap[role] || 'User';
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: UserRole | string): string {
  const colorMap: Record<string, string> = {
    'super-admin': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'admin': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'manager': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'user': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };
  
  return colorMap[role] || colorMap.user;
}

/**
 * Fetch user role from API
 */
export async function fetchUserRole(userId: string): Promise<{
  role: UserRole;
  permissions: string[];
  isDefault: boolean;
}> {
  try {
    const response = await fetch(`/api/roles?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn('[RBAC] Failed to fetch role, using default');
      return {
        role: 'user',
        permissions: ROLE_PERMISSIONS.user,
        isDefault: true,
      };
    }

    const data = await response.json();
    
    return {
      role: (data.role || 'user') as UserRole,
      permissions: data.permissions || ROLE_PERMISSIONS[data.role as UserRole] || ROLE_PERMISSIONS.user,
      isDefault: data.isDefault || false,
    };
  } catch (error) {
    console.error('[RBAC] Error fetching user role:', error);
    return {
      role: 'user',
      permissions: ROLE_PERMISSIONS.user,
      isDefault: true,
    };
  }
}

