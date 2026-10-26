import { Injectable, inject, signal } from '@angular/core';
import { User, UserRole, AccountStatus } from '../models/user.model';
import { MOCK_USERS } from '../mock-data/users.mock';
import { AuditLogService } from './audit-log.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly auditLogService = inject(AuditLogService);
  private readonly authService = inject(AuthService);

  private readonly usersSignal = signal<User[]>([...MOCK_USERS]);
  public readonly users = this.usersSignal.asReadonly();

  public getUsers(): User[] {
    return this.usersSignal();
  }

  public getUserById(id: string): User | undefined {
    return this.usersSignal().find((u) => u.id === id);
  }

  public addUser(userData: {
    fullName: string;
    email: string;
    role: UserRole;
    status: AccountStatus;
  }): User {
    const initials = userData.fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const newUser: User = {
      id: `usr-${Date.now()}`,
      fullName: userData.fullName,
      email: userData.email,
      role: userData.role,
      status: userData.status,
      createdAt: new Date().toISOString(),
      avatarInitials: initials || 'U',
    };

    this.usersSignal.update((current) => [...current, newUser]);

    const admin = this.authService.currentUser();
    this.auditLogService.logActivity({
      userEmail: admin?.email || 'admin@company.com',
      userName: admin?.fullName || 'Administrator',
      action: 'USER_CREATED',
      result: 'SUCCESS',
      details: `Created new account for ${newUser.fullName} (${newUser.email}) with role ${newUser.role}`,
    });

    return newUser;
  }

  public updateUser(id: string, patch: Partial<User>): boolean {
    const user = this.getUserById(id);
    if (!user) return false;

    const initials = patch.fullName
      ? patch.fullName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .substring(0, 2)
      : user.avatarInitials;

    const updatedUser: User = {
      ...user,
      ...patch,
      avatarInitials: initials,
    };

    this.usersSignal.update((current) =>
      current.map((u) => (u.id === id ? updatedUser : u))
    );

    const admin = this.authService.currentUser();
    this.auditLogService.logActivity({
      userEmail: admin?.email || 'admin@company.com',
      userName: admin?.fullName || 'Administrator',
      action: 'USER_UPDATED',
      result: 'SUCCESS',
      details: `Updated details for ${updatedUser.fullName} (${updatedUser.email})`,
    });

    return true;
  }

  public toggleStatus(id: string): boolean {
    const user = this.getUserById(id);
    if (!user) return false;

    const newStatus: AccountStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.updateUser(id, { status: newStatus });

    const admin = this.authService.currentUser();
    this.auditLogService.logActivity({
      userEmail: admin?.email || 'admin@company.com',
      userName: admin?.fullName || 'Administrator',
      action: 'USER_STATUS_CHANGED',
      result: 'SUCCESS',
      details: `Account for ${user.fullName} changed to ${newStatus}`,
    });

    return true;
  }

  public deleteUser(id: string): boolean {
    const user = this.getUserById(id);
    if (!user) return false;

    this.usersSignal.update((current) => current.filter((u) => u.id !== id));

    const admin = this.authService.currentUser();
    this.auditLogService.logActivity({
      userEmail: admin?.email || 'admin@company.com',
      userName: admin?.fullName || 'Administrator',
      action: 'USER_UPDATED',
      result: 'SUCCESS',
      details: `Account for ${user.fullName} removed from registry`,
    });

    return true;
  }
}
