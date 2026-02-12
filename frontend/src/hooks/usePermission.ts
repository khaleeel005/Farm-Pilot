'use client';

import { useUser } from '@/context/UserContext';
import { hasPermission, isOwner, isStaff, Resource, PermissionAction } from '@/lib/permissions';

/**
 * Hook to check if the current user has a specific permission
 */
export function usePermission(resource: Resource, action: PermissionAction): boolean {
  const { user } = useUser();
  return hasPermission(user?.role, resource, action);
}

/**
 * Hook to check multiple permissions at once
 * Returns an object with boolean values for each permission
 */
export function usePermissions<T extends Record<string, { resource: Resource; action: PermissionAction }>>(
  permissions: T
): Record<keyof T, boolean> {
  const { user } = useUser();
  const result = {} as Record<keyof T, boolean>;
  
  for (const [key, { resource, action }] of Object.entries(permissions)) {
    result[key as keyof T] = hasPermission(user?.role, resource, action);
  }
  
  return result;
}

/**
 * Hook to get permission checks for a specific resource
 * Returns all CRUD permissions for that resource
 */
export function useResourcePermissions(resource: Resource) {
  const { user } = useUser();
  
  return {
    canCreate: hasPermission(user?.role, resource, 'CREATE'),
    canRead: hasPermission(user?.role, resource, 'READ'),
    canUpdate: hasPermission(user?.role, resource, 'UPDATE'),
    canDelete: hasPermission(user?.role, resource, 'DELETE'),
    canExport: hasPermission(user?.role, resource, 'EXPORT'),
  };
}

/**
 * Hook to check if current user is owner
 */
export function useIsOwner(): boolean {
  const { user } = useUser();
  return isOwner(user?.role);
}

/**
 * Hook to check if current user is staff
 */
export function useIsStaff(): boolean {
  const { user } = useUser();
  return isStaff(user?.role);
}
