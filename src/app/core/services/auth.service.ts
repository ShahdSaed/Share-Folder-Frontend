import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User, UserRole } from '../models/user.model';
import { MOCK_ADMIN_USER, MOCK_VIEWER_USER, MOCK_USERS } from '../mock-data/users.mock';
import { AuditLogService } from './audit-log.service';
import { ToastService } from './toast.service';

const DEMO_SESSION_KEY = 'cfh_demo_session_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly router = inject(Router);
  private readonly auditLogService = inject(AuditLogService);
  private readonly toastService = inject(ToastService);

  // Initialize with persisted demo session if available, else null (requiring login)
  private readonly currentUserSignal = signal<User | null>(this.getInitialUser());

  public readonly currentUser = this.currentUserSignal.asReadonly();
  public readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  public readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'ADMIN');
  public readonly isViewer = computed(() => this.currentUserSignal()?.role === 'VIEWER');

  private getInitialUser(): User | null {
    try {
      const saved = localStorage.getItem(DEMO_SESSION_KEY);
      if (saved) {
        return JSON.parse(saved) as User;
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
    return null;
  }

  public login(
    email: string,
    password: string,
    rememberMe = false
  ): { success: boolean; message?: string } {
    const trimmedEmail = email.trim().toLowerCase();

    // Check if matching any mock user
    let user = MOCK_USERS.find((u) => u.email.toLowerCase() === trimmedEmail);

    // If email is not in mock users but looks valid, assign role based on prefix or admin domain
    if (!user) {
      if (trimmedEmail.includes('admin')) {
        user = {
          id: `usr-${Date.now()}`,
          fullName: 'Demo Administrator',
          email: trimmedEmail,
          role: 'ADMIN',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          avatarInitials: 'DA',
        };
      } else {
        user = {
          id: `usr-${Date.now()}`,
          fullName: 'Demo Viewer',
          email: trimmedEmail,
          role: 'VIEWER',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          avatarInitials: 'DV',
        };
      }
    }

    if (user.status === 'INACTIVE') {
      this.auditLogService.logActivity({
        userEmail: trimmedEmail,
        userName: user.fullName,
        action: 'LOGIN_FAILED',
        result: 'FAILED',
        details: 'Login rejected: account is deactivated',
      });
      return { success: false, message: 'Account is deactivated. Please contact an administrator.' };
    }

    // Minimum password check for mock demo (e.g. at least 4 characters)
    if (!password || password.length < 4) {
      this.auditLogService.logActivity({
        userEmail: trimmedEmail,
        userName: user?.fullName || 'Unknown',
        action: 'LOGIN_FAILED',
        result: 'FAILED',
        details: 'Password validation failed (too short)',
      });
      return { success: false, message: 'Invalid credentials. Password must be at least 4 characters.' };
    }

    this.setCurrentUser(user);

    this.auditLogService.logActivity({
      userEmail: user.email,
      userName: user.fullName,
      action: 'LOGIN_SUCCESS',
      result: 'SUCCESS',
      details: `User signed in successfully as ${user.role}`,
    });

    return { success: true };
  }

  public logout(): void {
    const previousUser = this.currentUserSignal();
    this.currentUserSignal.set(null);
    try {
      localStorage.removeItem(DEMO_SESSION_KEY);
    } catch {
      // Ignore
    }

    if (previousUser) {
      this.auditLogService.logActivity({
        userEmail: previousUser.email,
        userName: previousUser.fullName,
        action: 'LOGIN_SUCCESS',
        result: 'SUCCESS',
        details: 'User signed out',
      });
    }

    this.toastService.info('Signed out successfully');
    this.router.navigate(['/login']);
  }

  private setCurrentUser(user: User): void {
    this.currentUserSignal.set(user);
    try {
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
    } catch {
      // Ignore
    }
  }
}
