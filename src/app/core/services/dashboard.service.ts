import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DashboardStatistics } from '../models/dashboard.model';
import { ApiPagination } from '../models/audit-log.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = environment.apiUrl;

  private readonly statsSignal = signal<DashboardStatistics | null>(null);
  public readonly statistics = this.statsSignal.asReadonly();

  /**
   * Loads dashboard statistics by fetching count-only pages from files, users, and audit-logs endpoints.
   * Real backend totals are inferred from pagination metadata.
   */
  public loadStatistics(): Observable<DashboardStatistics> {
    const isAdmin = this.authService.isAdmin();

    const files$ = this.http
      .get<{ status: string; data: { files: unknown[]; pagination: ApiPagination } }>(
        `${this.apiUrl}/files`,
        { params: { page: 1, limit: 1 }, withCredentials: true }
      )
      .pipe(
        catchError(() =>
          of({
            status: 'error',
            data: {
              files: [],
              pagination: { total: 0, page: 1, limit: 1, totalPages: 1, hasNext: false, hasPrev: false },
            },
          })
        )
      );

    const users$ = isAdmin
      ? this.http
          .get<{ status: string; data: { users: unknown[]; pagination: ApiPagination } }>(
            `${this.apiUrl}/users`,
            { params: { page: 1, limit: 1 }, withCredentials: true }
          )
          .pipe(
            catchError(() =>
              of({
                status: 'error',
                data: {
                  users: [],
                  pagination: { total: 0, page: 1, limit: 1, totalPages: 1, hasNext: false, hasPrev: false },
                },
              })
            )
          )
      : of({
          status: 'skipped',
          data: {
            users: [],
            pagination: { total: 0, page: 1, limit: 1, totalPages: 1, hasNext: false, hasPrev: false },
          },
        });

    const views$ = isAdmin
      ? this.http
          .get<{ status: string; data: { logs: unknown[]; pagination: ApiPagination } }>(
            `${this.apiUrl}/admin/audit-logs`,
            { params: { action: 'FILE_ACCESSED', result: 'Success', page: 1, limit: 1 }, withCredentials: true }
          )
          .pipe(catchError(() => of(null)))
      : of(null);

    const security$ = isAdmin
      ? this.http
          .get<{ status: string; data: { logs: unknown[]; pagination: ApiPagination } }>(
            `${this.apiUrl}/admin/audit-logs`,
            { params: { result: 'Failed', page: 1, limit: 1 }, withCredentials: true }
          )
          .pipe(catchError(() => of(null)))
      : of(null);

    return forkJoin({ files: files$, users: users$, views: views$, security: security$ }).pipe(
      map(({ files, users, views, security }) => {
        const stats: DashboardStatistics = {
          totalFiles: files.data?.pagination?.total ?? 0,
          totalUsers: users.data?.pagination?.total ?? 0,
          successfulFileViews: views?.data?.pagination?.total ?? 0,
          recentSecurityEvents: security?.data?.pagination?.total ?? 0,
        };
        this.statsSignal.set(stats);
        return stats;
      }),
      catchError((err) => throwError(() => err))
    );
  }
}
