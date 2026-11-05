import { Component, computed, inject, signal, OnInit } from '@angular/core';
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
export class ManageUsersComponent implements OnInit {

  ngOnInit(): void {
    // Load the first page of users on component init
    this.userService.loadUsers({ page: 1, limit: this.pageSize }).subscribe({
      error: (err) => {
        this.toastService.error('Failed to load users.', 'Error');
        console.error(err);
      },
    });
  }

  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly toastService = inject(ToastService);

  readonly pageSize = PAGE_SIZE;
  readonly searchQuery = signal('');
  readonly roleFilter = signal('');
  readonly statusFilter = signal('');
  readonly currentPage = signal(1);
  showUserPassword = false;

  readonly showUserModal = signal(false);
  readonly showStatusDialog = signal(false);
  readonly editingUser = signal<User | null>(null);
  readonly toggleTarget = signal<User | null>(null);

  userForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
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
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      users = users.filter(
        (u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    const role = this.roleFilter();
    if (role) {
      users = users.filter((u) => u.role === role);
    }
    const status = this.statusFilter();
    if (status) {
      users = users.filter((u) => u.status === status);
    }
    return users;
  });

  readonly pagedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredUsers().slice(start, start + this.pageSize);
  });

  openAddModal(): void {
    this.editingUser.set(null);
    this.userForm.reset({ role: 'VIEWER', status: 'ACTIVE', password: '' });
    this.userForm.get('email')?.enable();
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showUserPassword = false;
    this.showUserModal.set(true);
  }

  openEditModal(user: User): void {
    this.editingUser.set(user);
    this.userForm.reset({ fullName: user.fullName, email: user.email, role: user.role, status: user.status, password: '' });
    this.userForm.get('email')?.disable();
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showUserModal.set(true);
  }

  closeUserModal(): void {
    this.showUserModal.set(false);
    this.editingUser.set(null);
  }

  generatePassword(): void {
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghjkmnpqrstuvwxyz';
    const numbers = '23456789';
    const specials = '!@#$%&*';
    const all = uppers + lowers + numbers + specials;

    let pwd = '';
    pwd += uppers[Math.floor(Math.random() * uppers.length)];
    pwd += lowers[Math.floor(Math.random() * lowers.length)];
    pwd += numbers[Math.floor(Math.random() * numbers.length)];
    pwd += specials[Math.floor(Math.random() * specials.length)];

    for (let i = pwd.length; i < 12; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }

    pwd = pwd.split('').sort(() => Math.random() - 0.5).join('');

    this.userForm.patchValue({ password: pwd });
    this.showUserPassword = true;
    this.toastService.info('Suggested password generated!', 'Password Suggestion');
  }

  onSaveUser(): void {
    if (this.userForm.invalid) return;

    const { fullName, email, password, role, status } = this.userForm.getRawValue() as {
      fullName: string;
      email: string;
      password?: string;
      role: UserRole;
      status: AccountStatus;
    };

    const editingUser = this.editingUser();
    if (editingUser) {
      // Backend accepts: name, role, isActive
      const isActive = status === 'ACTIVE';
      this.userService.updateUser(editingUser.id, { name: fullName, role, isActive }).subscribe({
        next: () => {
          this.toastService.success(`${fullName}'s account updated.`, 'User Updated');
          this.closeUserModal();
        },
        error: (err) => {
          const msg = err.error?.message || 'Failed to update user.';
          this.toastService.error(msg, 'Error');
          console.error(err);
        },
      });
    } else {
      const userPassword = password && password.trim().length >= 8 ? password.trim() : 'ChangeMe123!';
      this.userService.createUser({ name: fullName, email, role, password: userPassword }).subscribe({
        next: () => {
          this.toastService.success(`Account created for ${fullName}.`, 'User Added');
          this.closeUserModal();
        },
        error: (err) => {
          const msg = err.error?.message || 'Failed to create user.';
          this.toastService.error(msg, 'Error');
          console.error(err);
        },
      });
    }
  }

  confirmToggleStatus(user: User): void {
    this.toggleTarget.set(user);
    this.showStatusDialog.set(true);
  }

  onToggleConfirmed(): void {
    const user = this.toggleTarget();
    if (user) {
      this.userService.toggleStatus(user.id).subscribe({
        next: () => {
          const newStatus = user.status === 'ACTIVE' ? 'Inactive' : 'Active';
          this.toastService.success(`${user.fullName}'s account set to ${newStatus}.`);
          this.showStatusDialog.set(false);
          this.toggleTarget.set(null);
        },
        error: (err) => {
          this.toastService.error('Failed to update user status.', 'Error');
          console.error(err);
        },
      });
    }
  }
}
