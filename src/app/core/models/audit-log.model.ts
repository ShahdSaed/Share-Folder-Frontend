// Action strings returned by the backend
export type ActivityAction = string;

export type AuditResult = 'SUCCESS' | 'FAILED';

/** Backend response shape */
export interface ApiAuditLog {
  id: string;
  userId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  ipAddress: string | null;
  result: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

/** Pagination shape returned by the backend */
export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Frontend display shape (kept backward-compatible with existing UI) */
export interface AuditLog {
  id: string;
  timestamp: string;      // mapped from createdAt
  userEmail: string;      // mapped from user.email
  userName: string;       // mapped from user.name
  action: ActivityAction;
  targetFile?: string;    // mapped from targetId when targetType=FILE
  ipAddress: string;
  result: AuditResult;
  details?: string;       // not in backend response — omitted
}

/** Converts a backend audit log to the frontend AuditLog shape */
export function mapApiAuditLog(log: ApiAuditLog): AuditLog {
  const isSuccess = log.result?.toUpperCase() === 'SUCCESS';
  return {
    id: log.id,
    timestamp: log.createdAt,
    userEmail: log.user?.email ?? '—',
    userName: log.user?.name ?? (log.userId ? 'User' : 'System'),
    action: log.action as ActivityAction,
    targetFile: log.targetType === 'FILE' ? (log.targetId ?? undefined) : undefined,
    ipAddress: log.ipAddress ?? '—',
    result: isSuccess ? 'SUCCESS' : 'FAILED',
  };
}
