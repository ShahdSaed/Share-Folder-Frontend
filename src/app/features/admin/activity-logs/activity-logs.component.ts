import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { FileService } from '../../../core/services/file.service';
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
export class ActivityLogsComponent implements OnInit {
  private readonly auditLogService = inject(AuditLogService);
  private readonly fileService = inject(FileService);

  readonly pageSize = PAGE_SIZE;
  readonly searchQuery = signal('');
  readonly actionFilter = signal('');
  readonly resultFilter = signal('');
  readonly currentPage = signal(1);

  readonly actionTypes = [
    'LOGIN_SUCCESS',
    'LOGIN_FAILED',
    'LOGIN_REJECTED_INACTIVE',
    'LOGOUT',
    'LOGOUT_ALL',
    'TOKEN_REFRESHED',
    'REFRESH_TOKEN_REUSE',
    'FILE_ACCESSED',
    'FILE_UPLOADED',
    'FILE_DELETED',
    'FILE_METADATA_UPDATED',
    'FILE_PASSWORD_VERIFIED',
    'FILE_PASSWORD_FAILED',
    'FILE_PASSWORD_CHANGED',
    'FILE_PASSWORD_ATTEMPT_DENIED',
    'FILE_ACCESS_GRANTED',
    'FILE_ACCESS_REVOKED',
    'USER_CREATED',
    'USER_UPDATED',
    'USER_PASSWORD_RESET',
    'PASSWORD_CHANGED',
    'PASSWORD_CHANGE_FAILED',
    'FORBIDDEN_ACCESS_ATTEMPT',
  ];

  ngOnInit(): void {
    this.auditLogService.loadLogs({ page: 1, limit: 100 }).subscribe({
      error: (err) => console.error('Failed to load audit logs', err),
    });

    if (this.fileService.files().length === 0) {
      this.fileService.loadFiles({ page: 1, limit: 100 }).subscribe();
    }
  }

  readonly hasActiveFilters = computed(
    () => !!this.searchQuery().trim() || !!this.actionFilter() || !!this.resultFilter()
  );

  readonly filteredLogs = computed(() => {
    let logs = this.auditLogService.logs();
    const q = this.searchQuery().trim().toLowerCase();

    if (q) {
      logs = logs.filter(
        (l) =>
          l.userName.toLowerCase().includes(q) ||
          l.userEmail.toLowerCase().includes(q) ||
          (l.targetFile && this.resolveTarget(l.targetFile).toLowerCase().includes(q)) ||
          l.action.toLowerCase().includes(q)
      );
    }

    const action = this.actionFilter();
    if (action) {
      logs = logs.filter((l) => l.action === action);
    }

    const result = this.resultFilter();
    if (result) {
      logs = logs.filter((l) => l.result === (result as AuditResult));
    }

    return logs;
  });

  readonly pagedLogs = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredLogs().slice(start, start + this.pageSize);
  });

  resolveTarget(targetId?: string): string {
    if (!targetId) return '—';
    const file = this.fileService.files().find((f) => f.id === targetId);
    if (file) return file.name;
    return targetId.length > 12 ? `File #${targetId.slice(0, 8)}` : targetId;
  }

  formatIp(ip: string): string {
    if (!ip || ip === '—') return '—';
    if (ip === '::1' || ip === '::ffff:127.0.0.1' || ip === '127.0.0.1') return '127.0.0.1 (Local)';
    return ip;
  }

  formatAction(action: string): string {
    return action
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  getActionCategory(action: string): string {
    if (action.includes('LOGIN') || action.includes('TOKEN') || action.includes('LOGOUT')) return 'auth';
    if (action.includes('PASSWORD') || action.includes('FORBIDDEN')) return 'security';
    if (action.startsWith('FILE')) return 'file';
    if (action.startsWith('USER')) return 'user';
    return 'file';
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.actionFilter.set('');
    this.resultFilter.set('');
    this.currentPage.set(1);
  }
}
