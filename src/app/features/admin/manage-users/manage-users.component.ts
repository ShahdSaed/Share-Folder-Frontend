import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { User, UserRole, AccountStatus } from '../../../core/models/user.model';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

const PAGE_SIZE = 8;

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ConfirmationDialogComponent,
    ModalComponent,
    StatusBadgeComponent,
    PaginationComponent,
    EmptyStateComponent,
    AppButtonComponent,
    IconComponent,
    TimeAgoPipe,
  ],
  template: `
    <div class="manage-users-page">
      <!-- Header -->
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Manage Users</h1>
          <p class="text-secondary">Add, edit, and manage user accounts and roles.</p>
        </div>
        <app-button variant="primary" (btnClick)="openAddModal()">
          <app-icon name="plus" [size]="16"></app-icon>
          Add User
        </app-button>
      </div>

      <!-- Toolbar -->
      <div class="cfh-surface toolbar">
        <div class="toolbar-left">
          <div class="search-input-wrap">
            <app-icon name="search" [size]="16" class="search-icon"></app-icon>
            <input
              type="search"
              class="form-control search-input"
              placeholder="Search by name or email..."
              [(ngModel)]="searchQuery"
              (ngModelChange)="currentPage = 1"
            />
          </div>
          <select class="form-control filter-select" [(ngModel)]="roleFilter" (ngModelChange)="currentPage = 1">
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="VIEWER">Viewer</option>
          </select>
          <select class="form-control filter-select" [(ngModel)]="statusFilter" (ngModelChange)="currentPage = 1">
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <span class="user-count">{{ filteredUsers().length }} users</span>
      </div>

      <!-- Table -->
      @if (pagedUsers().length > 0) {
        <div class="cfh-table-container">
          <table class="cfh-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of pagedUsers(); track user.id) {
                <tr>
                  <td class="name-cell">
                    <div class="user-avatar">{{ user.avatarInitials || 'U' }}</div>
                    <span class="user-full-name">{{ user.fullName }}</span>
                  </td>
                  <td class="email-cell">{{ user.email }}</td>
                  <td>
                    <app-status-badge
                      [variant]="user.role === 'ADMIN' ? 'info' : 'neutral'"
                      size="sm"
                      [showDot]="false"
                    >
                      {{ user.role }}
                    </app-status-badge>
                  </td>
                  <td>
                    <app-status-badge
                      [variant]="user.status === 'ACTIVE' ? 'success' : 'error'"
                      size="sm"
                    >
                      {{ user.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
                    </app-status-badge>
                  </td>
                  <td class="secondary-cell">{{ user.createdAt | timeAgo }}</td>
                  <td class="actions-cell">
                    <div class="action-btn-group">
                      <button type="button" class="action-icon-btn" (click)="openEditModal(user)" title="Edit user">
                        <app-icon name="edit" [size]="14"></app-icon>
                      </button>
                      <button
                        type="button"
                        [class]="'action-icon-btn toggle-btn ' + (user.status === 'ACTIVE' ? 'warning' : 'success')"
                        (click)="confirmToggleStatus(user)"
                        [title]="user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'"
                      >
                        <app-icon [name]="user.status === 'ACTIVE' ? 'x-circle' : 'check-circle'" [size]="14"></app-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <app-pagination
            [currentPage]="currentPage"
            [totalItems]="filteredUsers().length"
            [pageSize]="pageSize"
            (pageChange)="currentPage = $event"
          ></app-pagination>
        </div>
      } @else {
        <app-empty-state icon="users" title="No users found" description="No users match your filter."></app-empty-state>
      }
    </div>

    <!-- Add/Edit User Modal -->
    <app-modal
      [isOpen]="showUserModal()"
      [title]="editingUser() ? 'Edit User' : 'Add New User'"
      size="sm"
      (closed)="closeUserModal()"
    >
      <form [formGroup]="userForm" novalidate>
        <div class="form-group">
          <label for="user-fullname">Full Name <span class="required-indicator">*</span></label>
          <input id="user-fullname" type="text" formControlName="fullName" class="form-control" placeholder="Enter full name" />
          @if (userForm.get('fullName')!.invalid && userForm.get('fullName')!.touched) {
            <span class="input-error"><app-icon name="alert-circle" [size]="12"></app-icon> Full name is required.</span>
          }
        </div>

        <div class="form-group">
          <label for="user-email">Email Address <span class="required-indicator">*</span></label>
          <input id="user-email" type="email" formControlName="email" class="form-control" placeholder="name@company.com" [readonly]="!!editingUser()" />
          @if (userForm.get('email')!.invalid && userForm.get('email')!.touched) {
            <span class="input-error"><app-icon name="alert-circle" [size]="12"></app-icon> Valid email required.</span>
          }
        </div>

        <div class="form-group">
          <label for="user-role">Role <span class="required-indicator">*</span></label>
          <select id="user-role" formControlName="role" class="form-control">
            <option value="VIEWER">Viewer</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div class="form-group">
          <label for="user-status">Account Status</label>
          <select id="user-status" formControlName="status" class="form-control">
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </form>

      <div modal-footer>
        <app-button variant="secondary" (btnClick)="closeUserModal()">Cancel</app-button>
        <app-button variant="primary" [disabled]="userForm.invalid" (btnClick)="onSaveUser()">
          {{ editingUser() ? 'Save Changes' : 'Add User' }}
        </app-button>
      </div>
    </app-modal>

    <!-- Toggle Status Confirmation -->
    <app-confirmation-dialog
      [isOpen]="showStatusDialog()"
      [title]="toggleTarget()?.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'"
      [message]="statusDialogMessage()"
      submessage="This will update the user's access credentials and permissions across all systems."
      [isDanger]="toggleTarget()?.status === 'ACTIVE'"
      [confirmText]="toggleTarget()?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'"
      (confirmed)="onToggleConfirmed()"
      (cancelled)="showStatusDialog.set(false)"
    ></app-confirmation-dialog>
  `,
  styles: [
    `
      .manage-users-page {
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

      .toolbar-left {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .search-input-wrap {
        position: relative;
        .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--cfh-text-muted); pointer-events: none; }
        .search-input { padding-left: 34px; min-width: 220px; height: 36px; }
      }

      .filter-select { height: 36px; min-width: 130px; }

      .user-count {
        font-size: var(--cfh-font-size-secondary);
        color: var(--cfh-text-secondary);
        font-weight: 500;
      }

      .name-cell {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 180px;
      }

      .user-avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background-color: var(--cfh-primary-blue-subtle);
        color: var(--cfh-primary-blue);
        font-weight: 700;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .user-full-name {
        font-weight: 500;
        font-size: 13.5px;
      }

      .email-cell {
        font-size: var(--cfh-font-size-secondary);
        color: var(--cfh-text-secondary);
      }

      .secondary-cell {
        font-size: var(--cfh-font-size-secondary);
        color: var(--cfh-text-secondary);
        white-space: nowrap;
      }

      .action-btn-group {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .action-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border: 1px solid var(--cfh-border);
        border-radius: var(--cfh-radius-sm);
        background-color: var(--cfh-surface);
        color: var(--cfh-text-secondary);
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover { background-color: #f3f4f6; color: var(--cfh-text-main); }

        &.warning {
          color: var(--cfh-warning);
          border-color: var(--cfh-warning-border);
          &:hover { background-color: var(--cfh-warning-light); }
        }

        &.success {
          color: var(--cfh-success);
          border-color: var(--cfh-success-border);
          &:hover { background-color: var(--cfh-success-light); }
        }
      }


    `,
  ],
})
export class ManageUsersComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly toastService = inject(ToastService);

  readonly pageSize = PAGE_SIZE;
  searchQuery = '';
  roleFilter = '';
  statusFilter = '';
  currentPage = 1;

  readonly showUserModal = signal(false);
  readonly showStatusDialog = signal(false);
  readonly editingUser = signal<User | null>(null);
  readonly toggleTarget = signal<User | null>(null);

  userForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['VIEWER' as UserRole],
    status: ['ACTIVE' as AccountStatus],
  });

  readonly statusDialogMessage = computed(() => {
    const u = this.toggleTarget();
    if (!u) return '';
    return u.status === 'ACTIVE'
      ? `Deactivate account for ${u.fullName}? They will no longer be able to sign in.`
      : `Activate account for ${u.fullName}? They will be able to sign in again.`;
  });

  readonly filteredUsers = computed(() => {
    let users = this.userService.users();
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      users = users.filter(
        (u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    if (this.roleFilter) {
      users = users.filter((u) => u.role === this.roleFilter);
    }
    if (this.statusFilter) {
      users = users.filter((u) => u.status === this.statusFilter);
    }
    return users;
  });

  readonly pagedUsers = computed(() => {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers().slice(start, start + this.pageSize);
  });

  openAddModal(): void {
    this.editingUser.set(null);
    this.userForm.reset({ role: 'VIEWER', status: 'ACTIVE' });
    this.userForm.get('email')?.enable();
    this.showUserModal.set(true);
  }

  openEditModal(user: User): void {
    this.editingUser.set(user);
    this.userForm.reset({ fullName: user.fullName, email: user.email, role: user.role, status: user.status });
    this.userForm.get('email')?.disable();
    this.showUserModal.set(true);
  }

  closeUserModal(): void {
    this.showUserModal.set(false);
    this.editingUser.set(null);
  }

  onSaveUser(): void {
    if (this.userForm.invalid) return;

    const { fullName, email, role, status } = this.userForm.getRawValue() as {
      fullName: string;
      email: string;
      role: UserRole;
      status: AccountStatus;
    };

    const editingUser = this.editingUser();
    if (editingUser) {
      this.userService.updateUser(editingUser.id, { fullName, role, status });
      this.toastService.success(`${fullName}'s account updated.`, 'User Updated');
    } else {
      this.userService.addUser({ fullName, email, role, status });
      this.toastService.success(`Account created for ${fullName}.`, 'User Added');
    }

    this.closeUserModal();
  }

  confirmToggleStatus(user: User): void {
    this.toggleTarget.set(user);
    this.showStatusDialog.set(true);
  }

  onToggleConfirmed(): void {
    const user = this.toggleTarget();
    if (user) {
      this.userService.toggleStatus(user.id);
      const newStatus = user.status === 'ACTIVE' ? 'Inactive' : 'Active';
      this.toastService.success(`${user.fullName}'s account set to ${newStatus}.`);
      this.showStatusDialog.set(false);
      this.toggleTarget.set(null);
    }
  }
}
