import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { FileService } from '../../core/services/file.service';
import { AuditLogService } from '../../core/services/audit-log.service';
import { AuthService } from '../../core/services/auth.service';
import { SummaryCardComponent } from '../../shared/components/summary-card/summary-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { FileIconComponent } from '../../shared/components/file-icon/file-icon.component';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SummaryCardComponent,
    StatusBadgeComponent,
    FileIconComponent,
    FileSizePipe,
    TimeAgoPipe,
    IconComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly fileService = inject(FileService);
  private readonly auditLogService = inject(AuditLogService);
  private readonly authService = inject(AuthService);

  readonly stats = this.dashboardService.statistics;
  readonly isAdmin = this.authService.isAdmin;

  readonly recentLogs = computed(() => this.auditLogService.logs().slice(0, 7));
  readonly recentFiles = computed(() => this.fileService.files().slice(0, 5));

  ngOnInit(): void {
    // 1. Load summary stats from backend
    this.dashboardService.loadStatistics().subscribe({
      error: (err) => console.error('Failed to load dashboard statistics', err),
    });

    // 2. Load recent files from backend
    this.fileService.loadFiles({ page: 1, limit: 5 }).subscribe({
      error: (err) => console.error('Failed to load recent files', err),
    });

    // 3. Load recent activity logs if admin
    if (this.isAdmin()) {
      this.auditLogService.loadLogs({ page: 1, limit: 7 }).subscribe({
        error: (err) => console.error('Failed to load recent activity logs', err),
      });
    }
  }

  resolveTarget(targetId?: string): string {
    if (!targetId) return '—';
    const file = this.fileService.files().find((f) => f.id === targetId);
    if (file) return file.name;
    return targetId.length > 12 ? `File #${targetId.slice(0, 8)}` : targetId;
  }

  formatAction(action: string): string {
    return action
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
}
