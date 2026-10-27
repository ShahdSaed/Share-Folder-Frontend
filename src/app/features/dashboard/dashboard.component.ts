import { Component, inject, computed } from '@angular/core';
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
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly fileService = inject(FileService);
  private readonly auditLogService = inject(AuditLogService);
  private readonly authService = inject(AuthService);

  readonly stats = this.dashboardService.statistics;
  readonly isAdmin = this.authService.isAdmin;

  readonly recentLogs = computed(() => this.auditLogService.logs().slice(0, 7));
  readonly recentFiles = computed(() => this.fileService.files().slice(0, 5));
}
