import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { AuditLog, ApiAuditLog, mapApiAuditLog, ApiPagination } from '../models/audit-log.model';
import { environment } from '../../../environments/environment';

interface AuditLogListResponse {
  status: string;
  data: {
    logs: ApiAuditLog[];
    pagination: ApiPagination;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly logsSignal = signal<AuditLog[]>([]);
  public readonly logs = this.logsSignal.asReadonly();

  public loadLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    result?: string;
    userId?: string;
    targetType?: string;
    fromDate?: string;
    toDate?: string;
  }): Observable<{ logs: AuditLog[]; pagination: ApiPagination }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    if (params?.action) httpParams = httpParams.set('action', params.action);
    if (params?.result) httpParams = httpParams.set('result', params.result);
    if (params?.userId) httpParams = httpParams.set('userId', params.userId);
    if (params?.targetType) httpParams = httpParams.set('targetType', params.targetType);
    if (params?.fromDate) httpParams = httpParams.set('fromDate', params.fromDate);
    if (params?.toDate) httpParams = httpParams.set('toDate', params.toDate);

    return this.http
      .get<AuditLogListResponse>(`${this.apiUrl}/admin/audit-logs`, {
        params: httpParams,
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          const mapped = res.data.logs.map(mapApiAuditLog);
          this.logsSignal.set(mapped);
        }),
        map((res) => ({
          logs: res.data.logs.map(mapApiAuditLog),
          pagination: res.data.pagination,
        })),
        catchError((err) => throwError(() => err))
      );
  }

  public getLogs(): AuditLog[] {
    return this.logsSignal();
  }
}
