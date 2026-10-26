import { User } from '../models/user.model';

export const MOCK_ADMIN_USER: User = {
  id: 'usr-001',
  fullName: 'Alex Morris',
  email: 'alex.morris@company.com',
  role: 'ADMIN',
  status: 'ACTIVE',
  createdAt: '2025-01-15T09:00:00Z',
  lastLoginAt: '2026-10-26T08:30:00Z',
  avatarInitials: 'AM',
};

export const MOCK_VIEWER_USER: User = {
  id: 'usr-002',
  fullName: 'Sarah Chen',
  email: 'sarah.chen@company.com',
  role: 'VIEWER',
  status: 'ACTIVE',
  createdAt: '2025-02-10T10:15:00Z',
  lastLoginAt: '2026-10-25T16:45:00Z',
  avatarInitials: 'SC',
};

export const MOCK_USERS: User[] = [
  MOCK_ADMIN_USER,
  MOCK_VIEWER_USER,
  {
    id: 'usr-003',
    fullName: 'Marcus Vance',
    email: 'marcus.vance@company.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2025-03-01T11:20:00Z',
    lastLoginAt: '2026-10-24T14:10:00Z',
    avatarInitials: 'MV',
  },
  {
    id: 'usr-004',
    fullName: 'Elena Rostova',
    email: 'elena.rostova@company.com',
    role: 'VIEWER',
    status: 'ACTIVE',
    createdAt: '2025-04-18T13:45:00Z',
    lastLoginAt: '2026-10-22T09:30:00Z',
    avatarInitials: 'ER',
  },
  {
    id: 'usr-005',
    fullName: 'David Kim',
    email: 'david.kim@company.com',
    role: 'VIEWER',
    status: 'INACTIVE',
    createdAt: '2025-05-12T08:00:00Z',
    lastLoginAt: '2026-08-14T11:00:00Z',
    avatarInitials: 'DK',
  },
  {
    id: 'usr-006',
    fullName: 'Rachel Adams',
    email: 'rachel.adams@company.com',
    role: 'VIEWER',
    status: 'ACTIVE',
    createdAt: '2025-06-25T15:30:00Z',
    lastLoginAt: '2026-10-26T07:15:00Z',
    avatarInitials: 'RA',
  },
  {
    id: 'usr-007',
    fullName: 'James Wilson',
    email: 'james.wilson@company.com',
    role: 'VIEWER',
    status: 'ACTIVE',
    createdAt: '2025-08-04T09:40:00Z',
    lastLoginAt: '2026-10-20T12:00:00Z',
    avatarInitials: 'JW',
  },
];
