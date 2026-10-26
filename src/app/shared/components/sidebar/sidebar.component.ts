import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <aside [class]="'cfh-sidebar' + (isOpen ? ' is-open' : '')">
      <!-- Brand Logo / Product Name Header -->
      <div class="sidebar-brand">
        <div class="brand-logo-icon">
          <app-icon name="shield" [size]="20" color="#FFFFFF"></app-icon>
        </div>
        <div class="brand-text">
          <span class="product-name">Company File Hub</span>
          <span class="brand-tag">Enterprise Portal</span>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="sidebar-nav">
        <div class="nav-section-title">Navigation</div>
        <ul class="nav-list">
          <li class="nav-item">
            <a
              routerLink="/dashboard"
              routerLinkActive="active"
              class="nav-link"
              (click)="onLinkClick()"
            >
              <app-icon name="layout-dashboard" [size]="18"></app-icon>
              <span>Dashboard</span>
            </a>
          </li>
          <li class="nav-item">
            <a
              routerLink="/shared-files"
              routerLinkActive="active"
              class="nav-link"
              (click)="onLinkClick()"
            >
              <app-icon name="folder" [size]="18"></app-icon>
              <span>Shared Files</span>
            </a>
          </li>
        </ul>

        <!-- Admin-Only Navigation -->
        @if (authService.isAdmin()) {
          <div class="nav-section-title admin-title">Administration</div>
          <ul class="nav-list">
            <li class="nav-item">
              <a
                routerLink="/admin/manage-files"
                routerLinkActive="active"
                class="nav-link"
                (click)="onLinkClick()"
              >
                <app-icon name="file-text" [size]="18"></app-icon>
                <span>Manage Files</span>
              </a>
            </li>
            <li class="nav-item">
              <a
                routerLink="/admin/manage-users"
                routerLinkActive="active"
                class="nav-link"
                (click)="onLinkClick()"
              >
                <app-icon name="users" [size]="18"></app-icon>
                <span>Manage Users</span>
              </a>
            </li>
            <li class="nav-item">
              <a
                routerLink="/admin/activity-logs"
                routerLinkActive="active"
                class="nav-link"
                (click)="onLinkClick()"
              >
                <app-icon name="activity" [size]="18"></app-icon>
                <span>Activity Logs</span>
              </a>
            </li>
          </ul>
        }
      </nav>

      <!-- Sidebar Bottom: User Profile & Logout -->
      <div class="sidebar-footer">
        @if (authService.currentUser(); as user) {
          <div class="user-profile-badge">
            <div class="user-avatar">{{ user.avatarInitials || 'U' }}</div>
            <div class="user-info">
              <span class="user-name">{{ user.fullName }}</span>
              <span class="user-role">{{ user.role === 'ADMIN' ? 'Administrator' : 'Viewer' }}</span>
            </div>
            <button
              type="button"
              class="logout-btn"
              (click)="authService.logout()"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <app-icon name="log-out" [size]="16"></app-icon>
            </button>
          </div>
        }
      </div>
    </aside>

    @if (isOpen) {
      <div class="sidebar-backdrop" (click)="closeSidebar()"></div>
    }
  `,
  styles: [
    `
      .cfh-sidebar {
        width: var(--cfh-sidebar-width);
        background-color: var(--cfh-primary-navy);
        color: #f3f4f6;
        height: 100vh;
        position: fixed;
        left: 0;
        top: 0;
        z-index: 50;
        display: flex;
        flex-direction: column;
        border-right: 1px solid rgba(255, 255, 255, 0.08);
        transition: transform 0.25s ease-in-out;
      }

      .sidebar-brand {
        height: var(--cfh-topbar-height);
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .brand-logo-icon {
        width: 32px;
        height: 32px;
        border-radius: var(--cfh-radius-md);
        background-color: var(--cfh-primary-blue);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .brand-text {
        display: flex;
        flex-direction: column;
      }

      .product-name {
        font-size: 14px;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: -0.01em;
        line-height: 1.2;
      }

      .brand-tag {
        font-size: 11px;
        color: #94a3b8;
        line-height: 1.2;
      }

      .sidebar-nav {
        flex: 1;
        overflow-y: auto;
        padding: 16px 12px;
      }

      .nav-section-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: #94a3b8;
        letter-spacing: 0.05em;
        padding: 8px 12px 6px;
      }

      .admin-title {
        margin-top: 16px;
      }

      .nav-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .nav-link {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 9px 12px;
        color: #cbd5e1;
        text-decoration: none;
        font-size: 13.5px;
        font-weight: 500;
        border-radius: var(--cfh-radius-md);
        transition: all 0.15s ease;

        &:hover {
          background-color: rgba(255, 255, 255, 0.07);
          color: #ffffff;
        }

        &.active {
          background-color: #253858;
          color: #ffffff;
          font-weight: 600;
          box-shadow: inset 3px 0 0 var(--cfh-primary-blue);
        }
      }

      .sidebar-footer {
        padding: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        background-color: #0f1d32;
      }

      .user-profile-badge {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .user-avatar {
        width: 34px;
        height: 34px;
        border-radius: var(--cfh-radius-full);
        background-color: var(--cfh-primary-blue);
        color: #ffffff;
        font-weight: 600;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .user-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }

      .user-name {
        font-size: 13px;
        font-weight: 600;
        color: #ffffff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-role {
        font-size: 11px;
        color: #94a3b8;
      }

      .logout-btn {
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 6px;
        border-radius: var(--cfh-radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.15s ease, background-color 0.15s ease;

        &:hover {
          color: #ffffff;
          background-color: rgba(255, 255, 255, 0.1);
        }
      }

      .sidebar-backdrop {
        display: none;
      }

      /* Mobile Responsive */
      @media (max-width: 991px) {
        .cfh-sidebar {
          transform: translateX(-100%);
        }

        .cfh-sidebar.is-open {
          transform: translateX(0);
        }

        .sidebar-backdrop {
          display: block;
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.45);
          z-index: 40;
        }
      }
    `,
  ],
})
export class SidebarComponent {
  protected readonly authService = inject(AuthService);

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  onLinkClick(): void {
    if (window.innerWidth < 992) {
      this.close.emit();
    }
  }

  closeSidebar(): void {
    this.close.emit();
  }
}
