import { Injectable, signal } from '@angular/core';
import { AuditLog } from '../models/audit-log.model';
import { MOCK_AUDIT_LOGS } from '../mock-data/audit-logs.mock';

@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  private readonly logsSignal = signal<AuditLog[]>([...MOCK_AUDIT_LOGS]);
  public readonly logs = this.logsSignal.asReadonly();

  public logActivity(entry: {
    userEmail: string;
    userName: string;
    action: AuditLog['action'];
    targetFile?: string;
    ipAddress?: string;
    result: AuditLog['result'];
    details?: string;
  }): AuditLog {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userEmail: entry.userEmail,
      userName: entry.userName,
      action: entry.action,
      targetFile: entry.targetFile,
      ipAddress: entry.ipAddress || '192.168.1.100 (Internal)',
      result: entry.result,
      details: entry.details,
    };

    this.logsSignal.update((current) => [newLog, ...current]);
    return newLog;
  }

  public getLogs(): AuditLog[] {
    return this.logsSignal();
  }
}
