// Role-based access control configuration
export const ROLES = {
  OWNER: "owner",
  STAFF: "staff",
};

export const PERMISSIONS = {
  // Reports - owner only
  REPORTS: {
    READ: [ROLES.OWNER],
    EXPORT: [ROLES.OWNER],
  },

  // Daily Logs - staff can create/update, only owner can delete
  DAILY_LOGS: {
    CREATE: [ROLES.OWNER, ROLES.STAFF],
    READ: [ROLES.OWNER, ROLES.STAFF],
    UPDATE: [ROLES.OWNER, ROLES.STAFF],
    DELETE: [ROLES.OWNER],
  },

  // Houses - owner only for write operations
  HOUSES: {
    CREATE: [ROLES.OWNER],
    READ: [ROLES.OWNER, ROLES.STAFF],
    UPDATE: [ROLES.OWNER],
    DELETE: [ROLES.OWNER],
  },

  // Sales - owner only for write operations
  SALES: {
    CREATE: [ROLES.OWNER],
    READ: [ROLES.OWNER, ROLES.STAFF],
    UPDATE: [ROLES.OWNER],
    DELETE: [ROLES.OWNER],
  },

  // Customers - owner only for write operations
  CUSTOMERS: {
    CREATE: [ROLES.OWNER],
    READ: [ROLES.OWNER, ROLES.STAFF],
    UPDATE: [ROLES.OWNER],
    DELETE: [ROLES.OWNER],
  },

  // Feed Management - owner only for write operations
  FEED: {
    CREATE: [ROLES.OWNER],
    READ: [ROLES.OWNER, ROLES.STAFF],
    UPDATE: [ROLES.OWNER],
    DELETE: [ROLES.OWNER],
  },

  // Cost Entries - owner only for write operations
  COST_ENTRIES: {
    CREATE: [ROLES.OWNER],
    READ: [ROLES.OWNER, ROLES.STAFF],
    UPDATE: [ROLES.OWNER],
    DELETE: [ROLES.OWNER],
  },

  // Operating Costs
  COSTS: {
    READ: [ROLES.OWNER, ROLES.STAFF],
    WRITE: [ROLES.OWNER],
  },

  // Labor Management
  LABOR: {
    READ: [ROLES.OWNER, ROLES.STAFF],
    WRITE: [ROLES.OWNER, ROLES.STAFF],
  },

  // Laborers
  LABORERS: {
    CREATE: [ROLES.OWNER, ROLES.STAFF],
    READ: [ROLES.OWNER, ROLES.STAFF],
    UPDATE: [ROLES.OWNER, ROLES.STAFF],
    DELETE: [ROLES.OWNER],
  },

  // Work Assignments
  WORK_ASSIGNMENTS: {
    CREATE: [ROLES.OWNER, ROLES.STAFF],
    READ: [ROLES.OWNER, ROLES.STAFF],
    UPDATE: [ROLES.OWNER, ROLES.STAFF],
    DELETE: [ROLES.OWNER],
    ASSIGN: [ROLES.OWNER, ROLES.STAFF],
  },

  // Payroll - owner only
  PAYROLL: {
    CREATE: [ROLES.OWNER],
    READ: [ROLES.OWNER, ROLES.STAFF],
    UPDATE: [ROLES.OWNER],
    DELETE: [ROLES.OWNER],
  },

  // Staff/User Management - owner only
  STAFF: {
    CREATE: [ROLES.OWNER],
    READ: [ROLES.OWNER],
    UPDATE: [ROLES.OWNER],
    DELETE: [ROLES.OWNER],
  },
};

// Helper to check if a role has permission
export const hasPermission = (role, resource, action) => {
  const permission = PERMISSIONS[resource]?.[action];
  return permission ? permission.includes(role) : false;
};

export default {
  ROLES,
  PERMISSIONS,
  hasPermission,
};
