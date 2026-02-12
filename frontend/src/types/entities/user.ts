/**
 * User - Matches backend User model exactly
 */
export interface User {
  id: number;
  username: string;
  role: 'owner' | 'staff';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Auth credentials for login
 */
export interface AuthCredentials {
  username: string;
  password: string;
}

/**
 * Payload for creating/updating users
 */
export interface UserPayload {
  username?: string;
  password?: string;
  role?: 'owner' | 'staff';
  isActive?: boolean;
}
