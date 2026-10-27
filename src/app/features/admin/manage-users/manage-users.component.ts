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
  templateUrl: './manage-users.component.html',
  styleUrl: './manage-users.component.scss',
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
