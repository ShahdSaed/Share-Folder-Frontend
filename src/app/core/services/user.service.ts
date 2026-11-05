import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { User, ApiUser, mapApiUser } from '../models/user.model';
import { ApiPagination } from '../models/audit-log.model';
import { environment } from '../../../environments/environment';

interface UserListResponse {
  status: string;
  data: {
    users: ApiUser[];
    pagination: ApiPagination;
  };
}

interface UserResponse {
  status: string;
  data: { user: ApiUser };
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  // Existing properties and methods...
  // Adds a convenience method to toggle a user's active status
  public toggleStatus(id: string): Observable<void> {
    const current = this.getUserById(id);
    if (!current) {
      return throwError(() => new Error('User not found'));
    }
    const newStatus = current.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    // Backend expects isActive boolean
    const isActive = newStatus === 'ACTIVE';
    return this.updateUser(id, { isActive }).pipe(map(() => void 0));
  }

  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly usersSignal = signal<User[]>([]);
  public readonly users = this.usersSignal.asReadonly();

  // ─── List users ───────────────────────────────────────────────────────────

  public loadUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Observable<{ users: User[]; pagination: ApiPagination }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.role) httpParams = httpParams.set('role', params.role);
    // Backend does not use `status` for filtering; only `role` and `search` are supported
    // The `status` filter will be done on the frontend signal

    return this.http
      .get<UserListResponse>(`${this.apiUrl}/users`, { params: httpParams, withCredentials: true })
      .pipe(
        tap((res) => {
          const mapped = res.data.users.map(mapApiUser);
          this.usersSignal.set(mapped);
        }),
        map((res) => ({
          users: res.data.users.map(mapApiUser),
          pagination: res.data.pagination,
        })),
        catchError((err) => throwError(() => err))
      );
  }

  public getUsers(): User[] {
    return this.usersSignal();
  }

  public getUserById(id: string): User | undefined {
    return this.usersSignal().find((u) => u.id === id);
  }

  // ─── Get single user ──────────────────────────────────────────────────────

  public fetchUserById(id: string): Observable<User> {
    return this.http
      .get<UserResponse>(`${this.apiUrl}/users/${id}`, { withCredentials: true })
      .pipe(
        map((res) => mapApiUser(res.data.user)),
        catchError((err) => throwError(() => err))
      );
  }

  // ─── Create user ──────────────────────────────────────────────────────────

  public createUser(data: {
    name: string;
    email: string;
    password: string;
    role?: 'ADMIN' | 'VIEWER';
  }): Observable<User> {
    return this.http
      .post<UserResponse>(`${this.apiUrl}/users`, data, { withCredentials: true })
      .pipe(
        tap((res) => {
          const newUser = mapApiUser(res.data.user);
          this.usersSignal.update((current) => [newUser, ...current]);
        }),
        map((res) => mapApiUser(res.data.user)),
        catchError((err) => throwError(() => err))
      );
  }

  // ─── Update user ──────────────────────────────────────────────────────────

  public updateUser(
    id: string,
    updates: { name?: string; role?: 'ADMIN' | 'VIEWER'; isActive?: boolean }
  ): Observable<User> {
    return this.http
      .patch<UserResponse>(`${this.apiUrl}/users/${id}`, updates, { withCredentials: true })
      .pipe(
        tap((res) => {
          const updated = mapApiUser(res.data.user);
          this.usersSignal.update((current) =>
            current.map((u) => (u.id === id ? updated : u))
          );
        }),
        map((res) => mapApiUser(res.data.user)),
        catchError((err) => throwError(() => err))
      );
  }

  // ─── Reset password (admin only) ──────────────────────────────────────────

  public resetUserPassword(id: string, password: string): Observable<void> {
    return this.http
      .post<{ status: string }>(`${this.apiUrl}/users/${id}/reset-password`, { password }, { withCredentials: true })
      .pipe(
        map(() => void 0),
        catchError((err) => throwError(() => err))
      );
  }
}
