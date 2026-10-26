export type ActivityAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'FILE_LIST_VIEWED'
  | 'FILE_ACCESS_ATTEMPT'
  | 'FILE_PASSWORD_FAILED'
  | 'FILE_VIEWED'
  | 'FILE_UPLOAD'
  | 'FILE_UPDATED'
  | 'FILE_DELETED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_STATUS_CHANGED';

export type AuditResult = 'SUCCESS' | 'FAILED';

export interface AuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  userName: string;
  action: ActivityAction;
  targetFile?: string;
  ipAddress: string;
  result: AuditResult;
  details?: string;
}
