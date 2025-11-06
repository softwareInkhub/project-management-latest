'use client';

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { hasPermission, isAdmin, canCreate, canUpdate, canDelete } from '../utils/rbac';

/**
 * RoleGuard - Only renders children if user has required permission
 */
interface RoleGuardProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}) => {
  const { user } = useAuth();
  const userRole = user?.role || 'user';

  // Check single permission
  if (permission && !hasPermission(userRole, permission)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    if (requireAll) {
      // All permissions required
      const hasAll = permissions.every(p => hasPermission(userRole, p));
      if (!hasAll) return <>{fallback}</>;
    } else {
      // Any permission required
      const hasAny = permissions.some(p => hasPermission(userRole, p));
      if (!hasAny) return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

/**
 * AdminOnly - Only renders for admin/super-admin
 */
interface AdminOnlyProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const AdminOnly: React.FC<AdminOnlyProps> = ({ fallback = null, children }) => {
  const { user } = useAuth();
  const userRole = user?.role || 'user';

  if (!isAdmin(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * CreateButton - Button that's only visible if user can create
 */
interface CreateButtonProps {
  resource: 'projects' | 'tasks' | 'companies' | 'departments' | 'teams';
  onClick: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const CreateButton: React.FC<CreateButtonProps> = ({
  resource,
  onClick,
  className = '',
  children,
  disabled = false,
}) => {
  const { user } = useAuth();
  const userRole = user?.role || 'user';

  if (!canCreate(userRole, resource)) {
    return null;
  }

  return (
    <button onClick={onClick} className={className} disabled={disabled}>
      {children}
    </button>
  );
};

/**
 * UpdateButton - Button that's only visible if user can update
 */
interface UpdateButtonProps {
  resource: 'projects' | 'tasks' | 'companies' | 'departments' | 'teams';
  onClick: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const UpdateButton: React.FC<UpdateButtonProps> = ({
  resource,
  onClick,
  className = '',
  children,
  disabled = false,
}) => {
  const { user } = useAuth();
  const userRole = user?.role || 'user';

  if (!canUpdate(userRole, resource)) {
    return null;
  }

  return (
    <button onClick={onClick} className={className} disabled={disabled}>
      {children}
    </button>
  );
};

/**
 * DeleteButton - Button that's only visible if user can delete
 */
interface DeleteButtonProps {
  resource: 'projects' | 'tasks' | 'companies' | 'departments' | 'teams';
  onClick: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({
  resource,
  onClick,
  className = '',
  children,
  disabled = false,
}) => {
  const { user } = useAuth();
  const userRole = user?.role || 'user';

  if (!canDelete(userRole, resource)) {
    return null;
  }

  return (
    <button onClick={onClick} className={className} disabled={disabled}>
      {children}
    </button>
  );
};

/**
 * ReadOnlyView - Shows a read-only message for non-admin users
 */
export const ReadOnlyBadge: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'user';

  if (isAdmin(userRole)) {
    return null;
  }

  return (
    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
      <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
      </svg>
      Read Only
    </div>
  );
};

/**
 * Hook to check permissions
 */
export const usePermissions = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'user';

  return {
    userRole,
    isAdmin: isAdmin(userRole),
    hasPermission: (permission: string) => hasPermission(userRole, permission),
    canCreate: (resource: 'projects' | 'tasks' | 'companies' | 'departments' | 'teams') => 
      canCreate(userRole, resource),
    canUpdate: (resource: 'projects' | 'tasks' | 'companies' | 'departments' | 'teams') => 
      canUpdate(userRole, resource),
    canDelete: (resource: 'projects' | 'tasks' | 'companies' | 'departments' | 'teams') => 
      canDelete(userRole, resource),
  };
};

