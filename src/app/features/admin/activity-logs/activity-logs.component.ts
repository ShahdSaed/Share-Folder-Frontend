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
  templateUrl: './activity-logs.component.html',
  styleUrl: './activity-logs.component.scss',
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
