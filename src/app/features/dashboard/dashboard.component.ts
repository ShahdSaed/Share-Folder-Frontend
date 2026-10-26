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
  template: `
    <div class="dashboard-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="text-secondary">Overview of your company document portal.</p>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="stats-grid">
        <app-summary-card
          label="Total Files"
          [value]="stats().totalFiles"
          icon="folder"
          [trend]="stats().filesTrend"
          theme="blue"
        ></app-summary-card>
        <app-summary-card
          label="Total Users"
          [value]="stats().totalUsers"
          icon="users"
          [trend]="stats().usersTrend"
          theme="navy"
        ></app-summary-card>
        <app-summary-card
          label="Successful File Views"
          [value]="stats().successfulFileViews"
          icon="eye"
          [trend]="stats().viewsTrend"
          theme="green"
        ></app-summary-card>
        <app-summary-card
          label="Security Events"
          [value]="stats().recentSecurityEvents"
          icon="shield"
          [trend]="stats().securityTrend"
          theme="amber"
        ></app-summary-card>
      </div>

      <!-- Bottom Grid: Activity + Files + Quick Actions -->
      <div class="bottom-grid">

        <!-- Recent Activity -->
        <div class="cfh-surface panel">
          <div class="panel-header">
            <h2 class="section-heading">Recent Activity</h2>
            <a routerLink="/admin/activity-logs" class="panel-link">View all</a>
          </div>
          <div class="cfh-table-container flat">
            <table class="cfh-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Time</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                @for (log of recentLogs(); track log.id) {
                  <tr>
                    <td class="cell-user">{{ log.userName }}</td>
                    <td><span class="action-code">{{ log.action }}</span></td>
                    <td class="cell-target">{{ log.targetFile || '—' }}</td>
                    <td class="cell-time">{{ log.timestamp | timeAgo }}</td>
                    <td>
                      <app-status-badge
                        [variant]="log.result === 'SUCCESS' ? 'success' : 'error'"
                        size="sm"
                        [showDot]="false"
                      >
                        {{ log.result }}
                      </app-status-badge>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right Column -->
        <div class="right-column">

          <!-- Recently Uploaded Files -->
          <div class="cfh-surface panel">
            <div class="panel-header">
              <h2 class="section-heading">Recent Uploads</h2>
              <a routerLink="/shared-files" class="panel-link">View all</a>
            </div>
            <ul class="recent-files-list">
              @for (file of recentFiles(); track file.id) {
                <li class="recent-file-item">
                  <app-file-icon [type]="file.type" size="sm"></app-file-icon>
                  <div class="file-meta">
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-by">{{ file.uploadedBy }} · {{ file.createdAt | timeAgo }}</span>
                  </div>
                  <span class="file-size-label">{{ file.size | fileSize }}</span>
                </li>
              }
            </ul>
          </div>

          <!-- Quick Actions -->
          <div class="cfh-surface panel quick-actions-panel">
            <h2 class="section-heading" style="margin-bottom: 16px;">Quick Actions</h2>
            <div class="quick-actions-list">
              <a routerLink="/shared-files" class="quick-action-item">
                <div class="qa-icon-box blue">
                  <app-icon name="folder" [size]="16"></app-icon>
                </div>
                <span>Browse Files</span>
                <app-icon name="chevron-right" [size]="16" class="qa-arrow"></app-icon>
              </a>
              @if (isAdmin()) {
                <a routerLink="/admin/manage-files" class="quick-action-item">
                  <div class="qa-icon-box navy">
                    <app-icon name="upload" [size]="16"></app-icon>
                  </div>
                  <span>Manage Files</span>
                  <app-icon name="chevron-right" [size]="16" class="qa-arrow"></app-icon>
                </a>
                <a routerLink="/admin/manage-users" class="quick-action-item">
                  <div class="qa-icon-box green">
                    <app-icon name="users" [size]="16"></app-icon>
                  </div>
                  <span>Manage Users</span>
                  <app-icon name="chevron-right" [size]="16" class="qa-arrow"></app-icon>
                </a>
                <a routerLink="/admin/activity-logs" class="quick-action-item">
                  <div class="qa-icon-box amber">
                    <app-icon name="activity" [size]="16"></app-icon>
                  </div>
                  <span>Activity Logs</span>
                  <app-icon name="chevron-right" [size]="16" class="qa-arrow"></app-icon>
                </a>
              }
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-page {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
      }

      .bottom-grid {
        display: grid;
        grid-template-columns: 1fr 360px;
        gap: 20px;
        align-items: start;
      }

      .panel {
        border-radius: var(--cfh-radius-lg);
        border: 1px solid var(--cfh-border);
        overflow: hidden;
      }

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid var(--cfh-border);
      }

      .panel-link {
        font-size: var(--cfh-font-size-small);
        color: var(--cfh-primary-blue);
        text-decoration: none;
        font-weight: 500;
        transition: opacity 0.15s ease;

        &:hover {
          opacity: 0.8;
        }
      }

      .flat {
        border: none;
        border-radius: 0;
        box-shadow: none;
      }

      .action-code {
        font-size: 11px;
        font-weight: 500;
        font-family: 'Courier New', monospace;
        color: var(--cfh-primary-navy);
        background-color: #f1f5f9;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
      }

      .cell-user {
        font-weight: 500;
        white-space: nowrap;
      }

      .cell-target {
        max-width: 160px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--cfh-font-size-secondary);
        color: var(--cfh-text-secondary);
      }

      .cell-time {
        font-size: var(--cfh-font-size-secondary);
        color: var(--cfh-text-secondary);
        white-space: nowrap;
      }

      .right-column {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .recent-files-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .recent-file-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 20px;
        border-bottom: 1px solid var(--cfh-border);
        transition: background-color 0.12s ease;

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          background-color: #f9fafb;
        }
      }

      .file-meta {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .file-name {
        font-size: 13px;
        font-weight: 500;
        color: var(--cfh-text-main);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-by {
        font-size: 11px;
        color: var(--cfh-text-secondary);
      }

      .file-size-label {
        font-size: 12px;
        color: var(--cfh-text-muted);
        white-space: nowrap;
      }

      .quick-actions-panel {
        padding: 20px;
      }

      .quick-actions-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .quick-action-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: var(--cfh-radius-md);
        text-decoration: none;
        font-size: 13.5px;
        font-weight: 500;
        color: var(--cfh-text-main);
        transition: background-color 0.15s ease;

        &:hover {
          background-color: #f3f4f6;
        }

        .qa-arrow {
          margin-left: auto;
          color: var(--cfh-text-muted);
        }
      }

      .qa-icon-box {
        width: 30px;
        height: 30px;
        border-radius: var(--cfh-radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &.blue {
          background-color: var(--cfh-primary-blue-light);
          color: var(--cfh-primary-blue);
        }

        &.navy {
          background-color: var(--cfh-primary-navy-subtle);
          color: var(--cfh-primary-navy);
        }

        &.green {
          background-color: var(--cfh-success-light);
          color: var(--cfh-success);
        }

        &.amber {
          background-color: var(--cfh-warning-light);
          color: var(--cfh-warning);
        }
      }

      @media (max-width: 1200px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .bottom-grid {
          grid-template-columns: 1fr;
        }

        .right-column {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 640px) {
        .stats-grid {
          grid-template-columns: 1fr 1fr;
        }

        .right-column {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
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

