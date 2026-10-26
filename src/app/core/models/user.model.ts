export type UserRole = 'ADMIN' | 'VIEWER';
export type AccountStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  lastLoginAt?: string;
  avatarInitials?: string;
}

export interface AuthSession {
  user: User;
  isAuthenticated: boolean;
  token?: string;
}
