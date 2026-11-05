import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { User, ApiUser, mapApiUser } from '../models/user.model';
import { ToastService } from './toast.service';
import { environment } from '../../../environments/environment';

interface AuthResponse {
  status: string;
  message?: string;
  data: {
    token?: string;
    accessToken?: string;
    expiresIn?: string;
    user: ApiUser;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  private readonly apiUrl = environment.apiUrl;

  // In-memory access token — NEVER stored in localStorage/sessionStorage
  private accessToken: string | null = null;

  private readonly currentUserSignal = signal<User | null>(null);

  public readonly currentUser = this.currentUserSignal.asReadonly();
  public readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  public readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'ADMIN');
  public readonly isViewer = computed(() => this.currentUserSignal()?.role === 'VIEWER');

  // ─── Token management ─────────────────────────────────────────────────────

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  private setSession(token: string, apiUser: ApiUser): void {
    this.accessToken = token;
    this.currentUserSignal.set(mapApiUser(apiUser));
    try {
      localStorage.setItem('company_hub_has_session', 'true');
    } catch {
      // Ignore if localStorage is restricted
    }
  }

  /** Clears in-memory session. Called on logout or failed refresh. */
  public clearSession(): void {
    this.accessToken = null;
    this.currentUserSignal.set(null);
    try {
      localStorage.removeItem('company_hub_has_session');
    } catch {
      // Ignore
    }
    this.router.navigate(['/login']);
  }

  // ─── Refresh token (uses HttpOnly cookie automatically) ───────────────────

  /**
   * Attempts to restore a session using the HttpOnly refresh cookie.
   * Returns the new access token on success, throws on failure.
   */
  public refreshToken(): Observable<string> {
    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      .pipe(
        tap((res) => {
          const token = res.data.accessToken ?? res.data.token ?? '';
          this.setSession(token, res.data.user);
        }),
        map((res) => res.data.accessToken ?? res.data.token ?? ''),
        catchError((err: unknown) => {
          // Refresh failed — session is gone
          this.accessToken = null;
          this.currentUserSignal.set(null);
          return throwError(() => err);
        })
      );
  }

  /**
   * Attempts to restore a session on app load (browser reload).
   * Silently succeeds or fails without redirecting.
   */
  public tryRestoreSession(): Observable<boolean> {
    try {
      const hasSession = localStorage.getItem('company_hub_has_session');
      if (!hasSession) {
        return of(false);
      }
    } catch {
      // Proceed if localStorage is unavailable
    }

    return this.refreshToken().pipe(
      map(() => true),
      catchError(() => {
        try {
          localStorage.removeItem('company_hub_has_session');
        } catch {
          // Ignore
        }
        return of(false);
      })
    );
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  public login(
    email: string,
    password: string
  ): Observable<User> {
    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/auth/login`,
        { email, password },
        { withCredentials: true }
      )
      .pipe(
        tap((res) => {
          const token = res.data.accessToken ?? res.data.token ?? '';
          this.setSession(token, res.data.user);
        }),
        map((res) => mapApiUser(res.data.user)),
        catchError((err: HttpErrorResponse) => throwError(() => err))
      );
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  public logout(): void {
    this.http
      .post<{ status: string }>(
        `${this.apiUrl}/auth/logout`,
        {},
        { withCredentials: true }
      )
      .subscribe({
        complete: () => this._finishLogout(),
        error: () => this._finishLogout(),
      });
  }

  private _finishLogout(): void {
    this.accessToken = null;
    this.currentUserSignal.set(null);
    try {
      localStorage.removeItem('company_hub_has_session');
    } catch {
      // Ignore
    }
    this.toastService.info('Signed out successfully');
    this.router.navigate(['/login']);
  }

  // ─── Logout all sessions ──────────────────────────────────────────────────

  public logoutAll(): Observable<void> {
    return this.http
      .post<{ status: string }>(
        `${this.apiUrl}/auth/logout-all`,
        {},
        { withCredentials: true }
      )
      .pipe(
        tap(() => {
          this.accessToken = null;
          this.currentUserSignal.set(null);
        }),
        map(() => void 0),
        catchError((err: unknown) => throwError(() => err))
      );
  }

  // ─── Change password ──────────────────────────────────────────────────────

  public changePassword(
    currentPassword: string,
    newPassword: string
  ): Observable<void> {
    return this.http
      .patch<{ status: string }>(
        `${this.apiUrl}/auth/change-password`,
        { currentPassword, newPassword },
        { withCredentials: true }
      )
      .pipe(
        tap(() => {
          // Backend revokes all sessions on password change
          this.accessToken = null;
          this.currentUserSignal.set(null);
        }),
        map(() => void 0),
        catchError((err: unknown) => throwError(() => err))
      );
  }

  // ─── Current user profile ─────────────────────────────────────────────────

  public getMe(): Observable<User> {
    return this.http
      .get<{ status: string; data: { user: ApiUser } }>(
        `${this.apiUrl}/auth/me`,
        { withCredentials: true }
      )
      .pipe(
        tap((res) => {
          this.currentUserSignal.set(mapApiUser(res.data.user));
        }),
        map((res) => mapApiUser(res.data.user)),
        catchError((err: unknown) => throwError(() => err))
      );
  }
}
