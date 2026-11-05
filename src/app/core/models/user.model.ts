export type UserRole = 'ADMIN' | 'VIEWER';

// Backend uses `isActive: boolean`; frontend uses `status` for display.
// The adapter in UserService maps between them.
export type AccountStatus = 'ACTIVE' | 'INACTIVE';

/** Shape returned by the backend */
export interface ApiUser {
  id: string;
  name: string;        // backend uses 'name'
  email: string;
  role: UserRole;
  isActive: boolean;   // backend uses 'isActive'
  createdAt: string;
}

/** Shape used by the frontend UI */
export interface User {
  id: string;
  fullName: string;      // mapped from ApiUser.name
  email: string;
  role: UserRole;
  status: AccountStatus; // mapped from ApiUser.isActive
  createdAt: string;
  avatarInitials?: string;
}

/** Logged-in user stored in memory */
export interface AuthSession {
  user: User;
  isAuthenticated: boolean;
  token?: string;
}

/** Converts a backend user object to the frontend User shape */
export function mapApiUser(apiUser: ApiUser): User {
  const initials = apiUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
  return {
    id: apiUser.id,
    fullName: apiUser.name,
    email: apiUser.email,
    role: apiUser.role,
    status: apiUser.isActive ? 'ACTIVE' : 'INACTIVE',
    createdAt: apiUser.createdAt,
    avatarInitials: initials,
  };
}
