// Frontend permission configuration that mirrors backend RBAC
// This should be kept in sync with backend/src/config/roles.js

export type UserRole = 'owner' | 'staff';

export type PermissionAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT';

export type Resource =
  | 'HOUSES'
  | 'DAILY_LOGS'
  | 'SALES'
  | 'CUSTOMERS'
  | 'FEED'
  | 'COST_ENTRIES'
  | 'COSTS'
  | 'LABORERS'
  | 'WORK_ASSIGNMENTS'
  | 'PAYROLL'
  | 'STAFF'
  | 'REPORTS';

// Permission matrix - mirrors backend configuration
// Each resource action maps to an array of roles that can perform it
const PERMISSIONS: Record<Resource, Partial<Record<PermissionAction, UserRole[]>>> = {
  HOUSES: {
    CREATE: ['owner'],
    READ: ['owner', 'staff'],
    UPDATE: ['owner'],
    DELETE: ['owner'],
  },
  DAILY_LOGS: {
    CREATE: ['owner', 'staff'],
    READ: ['owner', 'staff'],
    UPDATE: ['owner', 'staff'],
    DELETE: ['owner'],
  },
  SALES: {
    CREATE: ['owner'],
    READ: ['owner', 'staff'],
    UPDATE: ['owner'],
    DELETE: ['owner'],
  },
  CUSTOMERS: {
    CREATE: ['owner'],
    READ: ['owner', 'staff'],
    UPDATE: ['owner'],
    DELETE: ['owner'],
  },
  FEED: {
    CREATE: ['owner'],
    READ: ['owner', 'staff'],
    UPDATE: ['owner'],
    DELETE: ['owner'],
  },
  COST_ENTRIES: {
    CREATE: ['owner'],
    READ: ['owner', 'staff'],
    UPDATE: ['owner'],
    DELETE: ['owner'],
  },
  COSTS: {
    CREATE: ['owner'],
    READ: ['owner', 'staff'],
  },
  LABORERS: {
    CREATE: ['owner', 'staff'],
    READ: ['owner', 'staff'],
    UPDATE: ['owner', 'staff'],
    DELETE: ['owner'],
  },
  WORK_ASSIGNMENTS: {
    CREATE: ['owner', 'staff'],
    READ: ['owner', 'staff'],
    UPDATE: ['owner', 'staff'],
    DELETE: ['owner'],
  },
  PAYROLL: {
    CREATE: ['owner'],
    READ: ['owner', 'staff'],
    UPDATE: ['owner'],
    DELETE: ['owner'],
  },
  STAFF: {
    CREATE: ['owner'],
    READ: ['owner'],
    UPDATE: ['owner'],
    DELETE: ['owner'],
  },
  REPORTS: {
    READ: ['owner'],
    EXPORT: ['owner'],
  },
};

/**
 * Check if a user role has permission to perform an action on a resource
 */
export function hasPermission(
  role: UserRole | string | undefined | null,
  resource: Resource,
  action: PermissionAction
): boolean {
  if (!role) return false;
  
  const normalizedRole = role.toLowerCase() as UserRole;
  const resourcePermissions = PERMISSIONS[resource];
  
  if (!resourcePermissions) return false;
  
  const allowedRoles = resourcePermissions[action];
  if (!allowedRoles) return false;
  
  return allowedRoles.includes(normalizedRole);
}

/**
 * Check if user is an owner
 */
export function isOwner(role: string | undefined | null): boolean {
  if (!role) return false;
  return role.toLowerCase() === 'owner';
}

/**
 * Check if user is staff
 */
export function isStaff(role: string | undefined | null): boolean {
  if (!role) return false;
  return role.toLowerCase() === 'staff';
}

/**
 * Get all permissions for a given role
 */
export function getRolePermissions(role: UserRole): Record<Resource, PermissionAction[]> {
  const result = {} as Record<Resource, PermissionAction[]>;
  
  for (const [resource, actions] of Object.entries(PERMISSIONS)) {
    const allowedActions: PermissionAction[] = [];
    for (const [action, roles] of Object.entries(actions)) {
      if (roles?.includes(role)) {
        allowedActions.push(action as PermissionAction);
      }
    }
    result[resource as Resource] = allowedActions;
  }
  
  return result;
}
