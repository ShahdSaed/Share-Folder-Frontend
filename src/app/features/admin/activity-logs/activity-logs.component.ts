import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuditLog, ActivityAction, AuditResult } from '../../../core/models/audit-log.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    StatusBadgeComponent,
    PaginationComponent,
    EmptyStateComponent,
    AppButtonComponent,
    IconComponent,
  ],
  template: `
    <div class="activity-logs-page">
      <!-- Header -->
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Activity Logs</h1>
          <p class="text-secondary">Monitor user actions, file access attempts, and security events.</p>
        </div>
      </div>

      <!-- Filters Toolbar -->
      <div class="cfh-surface toolbar">
        <div class="toolbar-filters">
          <div class="search-input-wrap">
            <app-icon name="search" [size]="16" class="search-icon"></app-icon>
            <input
              type="search"
              class="form-control search-input"
              placeholder="Search by user or file..."
              [(ngModel)]="searchQuery"
              (ngModelChange)="currentPage = 1"
            />
          </div>

          <select class="form-control filter-select" [(ngModel)]="actionFilter" (ngModelChange)="currentPage = 1">
            <option value="">All Actions</option>
            @for (action of actionTypes; track action) {
              <option [value]="action">{{ action }}</option>
            }
          </select>

          <select class="form-control filter-select" [(ngModel)]="resultFilter" (ngModelChange)="currentPage = 1">
            <option value="">All Results</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
          </select>

          @if (hasActiveFilters()) {
            <app-button variant="ghost" size="sm" (btnClick)="clearFilters()">
              <app-icon name="x" [size]="14"></app-icon>
              Clear Filters
            </app-button>
          }
        </div>

        <span class="log-count">{{ filteredLogs().length }} records</span>
      </div>

      <!-- Logs Table -->
      @if (pagedLogs().length > 0) {
        <div class="cfh-table-container">
          <table class="cfh-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Target File</th>
                <th>IP Address</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              @for (log of pagedLogs(); track log.id) {
                <tr [class.row-failed]="log.result === 'FAILED'">
                  <td class="timestamp-cell">
                    <span class="ts-date">{{ log.timestamp | date:'MMM d, yyyy' }}</span>
                    <span class="ts-time">{{ log.timestamp | date:'HH:mm:ss' }}</span>
                  </td>
                  <td class="user-cell">
                    <span class="user-name">{{ log.userName }}</span>
                    <span class="user-email">{{ log.userEmail }}</span>
                  </td>
                  <td>
                    <span [class]="'action-badge action-' + getActionCategory(log.action)">
                      {{ log.action }}
                    </span>
                  </td>
                  <td class="target-cell">{{ log.targetFile || '—' }}</td>
                  <td class="ip-cell"><code>{{ log.ipAddress }}</code></td>
                  <td>
                    <app-status-badge
                      [variant]="log.result === 'SUCCESS' ? 'success' : 'error'"
                      size="sm"
                    >
                      {{ log.result }}
                    </app-status-badge>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <app-pagination
            [currentPage]="currentPage"
            [totalItems]="filteredLogs().length"
            [pageSize]="pageSize"
            (pageChange)="currentPage = $event"
          ></app-pagination>
        </div>
      } @else {
        <app-empty-state
          icon="activity"
          title="No logs found"
          [description]="hasActiveFilters() ? 'No records match your current filter criteria.' : 'Activity logs will appear here as users interact with the system.'"
          [actionLabel]="hasActiveFilters() ? 'Clear Filters' : undefined"
          (actionClicked)="clearFilters()"
        ></app-empty-state>
      }
    </div>
  `,
  styles: [
    `
      .activity-logs-page {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .page-header-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }

      .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 16px;
        border-radius: var(--cfh-radius-lg);
        flex-wrap: wrap;
      }

      .toolbar-filters {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .search-input-wrap {
        position: relative;
        .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--cfh-text-muted); pointer-events: none; }
        .search-input { padding-left: 34px; min-width: 240px; height: 36px; }
      }

      .filter-select { height: 36px; min-width: 160px; }

      .log-count {
        font-size: var(--cfh-font-size-secondary);
        color: var(--cfh-text-secondary);
        font-weight: 500;
        white-space: nowrap;
      }

      .timestamp-cell {
        white-space: nowrap;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .ts-date {
        font-size: 13px;
        font-weight: 500;
        color: var(--cfh-text-main);
      }

      .ts-time {
        font-size: 11px;
        font-family: monospace;
        color: var(--cfh-text-secondary);
      }

      .user-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
        white-space: nowrap;
      }

      .user-name {
        font-size: 13px;
        font-weight: 500;
      }

      .user-email {
        font-size: 11px;
        color: var(--cfh-text-secondary);
      }

      .action-badge {
        display: inline-block;
        font-size: 11px;
        font-weight: 600;
        font-family: 'Courier New', monospace;
        padding: 2px 7px;
        border-radius: 4px;
        white-space: nowrap;

        &.action-auth {
          background-color: var(--cfh-primary-blue-light);
          color: var(--cfh-primary-blue);
        }

        &.action-file {
          background-color: #f5f3ff;
          color: #7c3aed;
        }

        &.action-user {
          background-color: var(--cfh-success-light);
          color: var(--cfh-success);
        }

        &.action-security {
          background-color: var(--cfh-error-light);
          color: var(--cfh-error);
        }
      }

      .target-cell {
        font-size: var(--cfh-font-size-secondary);
        color: var(--cfh-text-secondary);
        max-width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ip-cell {
        code {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: var(--cfh-text-secondary);
          background-color: #f3f4f6;
          padding: 1px 5px;
          border-radius: 4px;
        }
      }

      .row-failed td {
        background-color: #fff9f9;
      }
    `,
  ],
})
export class ActivityLogsComponent {
  private readonly auditLogService = inject(AuditLogService);

  readonly pageSize = PAGE_SIZE;
  searchQuery = '';
  actionFilter = '';
  resultFilter = '';
  currentPage = 1;

  readonly actionTypes: ActivityAction[] = [
    'LOGIN_SUCCESS',
    'LOGIN_FAILED',
    'FILE_LIST_VIEWED',
    'FILE_ACCESS_ATTEMPT',
    'FILE_PASSWORD_FAILED',
    'FILE_VIEWED',
    'FILE_UPLOAD',
    'FILE_UPDATED',
    'FILE_DELETED',
    'USER_CREATED',
    'USER_UPDATED',
    'USER_STATUS_CHANGED',
  ];

  readonly hasActiveFilters = computed(
    () => !!this.searchQuery.trim() || !!this.actionFilter || !!this.resultFilter
  );

  readonly filteredLogs = computed(() => {
    let logs = this.auditLogService.logs();

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.userName.toLowerCase().includes(q) ||
          l.userEmail.toLowerCase().includes(q) ||
          (l.targetFile?.toLowerCase() || '').includes(q)
      );
    }

    if (this.actionFilter) {
      logs = logs.filter((l) => l.action === this.actionFilter);
    }

    if (this.resultFilter) {
      logs = logs.filter((l) => l.result === (this.resultFilter as AuditResult));
    }

    return logs;
  });

  readonly pagedLogs = computed(() => {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredLogs().slice(start, start + this.pageSize);
  });

  getActionCategory(action: ActivityAction): string {
    if (action.startsWith('LOGIN')) return 'auth';
    if (action.startsWith('FILE_PASSWORD') || action.startsWith('LOGIN_FAILED')) return 'security';
    if (action.startsWith('FILE')) return 'file';
    if (action.startsWith('USER')) return 'user';
    return 'file';
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.actionFilter = '';
    this.resultFilter = '';
    this.currentPage = 1;
  }
}
