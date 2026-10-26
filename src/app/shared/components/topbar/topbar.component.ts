import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../icon/icon.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, IconComponent, StatusBadgeComponent],
  template: `
    <header class="cfh-topbar">
      <div class="topbar-left">
        <button
          type="button"
          class="mobile-menu-trigger"
          (click)="toggleSidebar.emit()"
          aria-label="Toggle navigation menu"
        >
          <app-icon name="menu" [size]="20"></app-icon>
        </button>

        <div class="topbar-context">
          <span class="system-title">Enterprise File Hub</span>
        </div>
      </div>

      <div class="topbar-right">
        <!-- Current User indicator -->
        @if (authService.currentUser(); as user) {
          <div class="current-user-card">
            <div class="user-avatar-circle">
              {{ user.fullName.charAt(0).toUpperCase() }}
            </div>
            <div class="user-details-col">
              <span class="user-greeting">{{ user.fullName }}</span>
              <span class="user-email-sub">{{ user.email }}</span>
            </div>
            <app-status-badge
              [variant]="user.role === 'ADMIN' ? 'info' : 'neutral'"
              size="sm"
              [showDot]="false"
            >
              {{ user.role }}
            </app-status-badge>
          </div>
        }
      </div>
    </header>
  `,
  styles: [
    `
      .cfh-topbar {
        height: var(--cfh-topbar-height);
        background-color: var(--cfh-surface);
        border-bottom: 1px solid var(--cfh-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        position: sticky;
        top: 0;
        z-index: 30;
      }

      .topbar-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .mobile-menu-trigger {
        display: none;
        background: none;
        border: none;
        color: var(--cfh-text-main);
        cursor: pointer;
        padding: 6px;
        border-radius: var(--cfh-radius-sm);

        &:hover {
          background-color: #f3f4f6;
        }
      }

      .system-title {
        font-size: var(--cfh-font-size-small);
        color: var(--cfh-text-secondary);
        font-weight: 500;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }

      .topbar-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .current-user-card {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .user-avatar-circle {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--cfh-primary-navy), var(--cfh-primary-blue));
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 13px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .user-details-col {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }

      .user-greeting {
        font-size: var(--cfh-font-size-secondary);
        font-weight: 600;
        color: var(--cfh-text-main);
      }

      .user-email-sub {
        font-size: 11px;
        color: var(--cfh-text-secondary);
      }

      @media (max-width: 991px) {
        .mobile-menu-trigger {
          display: flex;
        }

        .system-title {
          display: none;
        }
      }

      @media (max-width: 540px) {
        .user-details-col {
          display: none;
        }
      }
    `,
  ],
})
export class TopbarComponent {
  protected readonly authService = inject(AuthService);

  @Output() toggleSidebar = new EventEmitter<void>();
}
