import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { FileItem, ApiFile, mapApiFile } from '../models/file-item.model';
import { ApiPagination } from '../models/audit-log.model';
import { environment } from '../../../environments/environment';

interface FileListResponse {
  status: string;
  data: {
    files: ApiFile[];
    pagination: ApiPagination;
  };
}

interface FileResponse {
  status: string;
  data: { file: ApiFile };
}

interface VerifyPasswordResponse {
  status: string;
  message: string;
  data: {
    unlockToken: string;
    expiresInSeconds: number;
  };
}

interface GrantsResponse {
  status: string;
  data: { grants: FileGrant[] };
}

export interface FileGrant {
  id: string;
  fileId: string;
  userId: string;
  expiresAt: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // In-memory signal for the current page of files
  private readonly filesSignal = signal<FileItem[]>([]);
  public readonly files = this.filesSignal.asReadonly();

  // In-memory unlock tokens keyed by fileId
  private readonly unlockTokens = new Map<string, string>();

  // Track which file IDs are unlocked (token exists in memory)
  private readonly unlockedFileIdsSignal = signal<Set<string>>(new Set());
  public readonly unlockedFileIds = this.unlockedFileIdsSignal.asReadonly();

  // ─── File listing ─────────────────────────────────────────────────────────

  public loadFiles(params?: { page?: number; limit?: number; search?: string; mimeType?: string }): Observable<{ files: FileItem[]; pagination: ApiPagination }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.mimeType) httpParams = httpParams.set('mimeType', params.mimeType);

    return this.http
      .get<FileListResponse>(`${this.apiUrl}/files`, { params: httpParams, withCredentials: true })
      .pipe(
        tap((res) => {
          const mapped = res.data.files.map(mapApiFile);
          this.filesSignal.set(mapped);
        }),
        map((res) => ({
          files: res.data.files.map(mapApiFile),
          pagination: res.data.pagination,
        })),
        catchError((err) => throwError(() => err))
      );
  }

  /** Returns current in-memory file list (from last loadFiles call) */
  public getFiles(): FileItem[] {
    return this.filesSignal();
  }

  public getFileById(id: string): FileItem | undefined {
    return this.filesSignal().find((f) => f.id === id);
  }

  // ─── Single file metadata ─────────────────────────────────────────────────

  public fetchFileById(id: string): Observable<FileItem> {
    return this.http
      .get<FileResponse>(`${this.apiUrl}/files/${id}`, { withCredentials: true })
      .pipe(
        map((res) => mapApiFile(res.data.file)),
        catchError((err) => throwError(() => err))
      );
  }

  // ─── Unlock token management ──────────────────────────────────────────────

  public isFileUnlocked(id: string): boolean {
    return this.unlockTokens.has(id);
  }

  public getUnlockToken(id: string): string | null {
    return this.unlockTokens.get(id) ?? null;
  }

  // ─── Password verification ────────────────────────────────────────────────

  public verifyPassword(id: string, password: string): Observable<{ unlockToken: string; expiresInSeconds: number }> {
    return this.http
      .post<VerifyPasswordResponse>(
        `${this.apiUrl}/files/${id}/verify-password`,
        { password },
        { withCredentials: true }
      )
      .pipe(
        tap((res) => {
          // Store the unlock token in memory only
          this.unlockTokens.set(id, res.data.unlockToken);
          this.unlockedFileIdsSignal.update((set) => {
            const next = new Set(set);
            next.add(id);
            return next;
          });
        }),
        map((res) => res.data),
        catchError((err) => throwError(() => err))
      );
  }

  // ─── File content (streaming) ─────────────────────────────────────────────

  public getFileContentUrl(id: string): string {
    return `${this.apiUrl}/files/${id}/content?inline=true`;
  }

  public downloadFileContent(id: string): Observable<Blob> {
    const unlockToken = this.getUnlockToken(id);
    let headers = new HttpHeaders();
    if (unlockToken) {
      headers = headers.set('X-File-Unlock-Token', unlockToken);
    }
    return this.http
      .get(`${this.apiUrl}/files/${id}/content`, {
        headers,
        responseType: 'blob',
        withCredentials: true,
        params: { inline: 'true' },
      })
      .pipe(catchError((err) => throwError(() => err)));
  }

  // ─── Upload ───────────────────────────────────────────────────────────────

  public uploadFile(file: File, password: string, name?: string): Observable<FileItem> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);
    if (name) formData.append('name', name);

    return this.http
      .post<FileResponse>(`${this.apiUrl}/files`, formData, { withCredentials: true })
      .pipe(
        tap((res) => {
          const newFile = mapApiFile(res.data.file);
          this.filesSignal.update((current) => [newFile, ...current]);
        }),
        map((res) => mapApiFile(res.data.file)),
        catchError((err) => throwError(() => err))
      );
  }

  // ─── Update (rename) ──────────────────────────────────────────────────────

  public updateFile(id: string, updates: { name: string }): Observable<FileItem> {
    return this.http
      .patch<FileResponse>(`${this.apiUrl}/files/${id}`, updates, { withCredentials: true })
      .pipe(
        tap((res) => {
          const updated = mapApiFile(res.data.file);
          this.filesSignal.update((current) =>
            current.map((f) => (f.id === id ? updated : f))
          );
        }),
        map((res) => mapApiFile(res.data.file)),
        catchError((err) => throwError(() => err))
      );
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  public deleteFile(id: string): Observable<void> {
    return this.http
      .delete<{ status: string }>(`${this.apiUrl}/files/${id}`, { withCredentials: true })
      .pipe(
        tap(() => {
          this.filesSignal.update((current) => current.filter((f) => f.id !== id));
          this.unlockTokens.delete(id);
          this.unlockedFileIdsSignal.update((set) => {
            const next = new Set(set);
            next.delete(id);
            return next;
          });
        }),
        map(() => void 0),
        catchError((err) => throwError(() => err))
      );
  }

  // ─── Change file password ─────────────────────────────────────────────────

  public changePassword(id: string, password: string): Observable<void> {
    return this.http
      .put<{ status: string }>(`${this.apiUrl}/files/${id}/password`, { password }, { withCredentials: true })
      .pipe(
        map(() => void 0),
        catchError((err) => throwError(() => err))
      );
  }

  // ─── File access grants ───────────────────────────────────────────────────

  public getFileGrants(fileId: string, status?: 'all' | 'active' | 'expired'): Observable<FileGrant[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http
      .get<GrantsResponse>(`${this.apiUrl}/files/${fileId}/access`, { params, withCredentials: true })
      .pipe(
        map((res) => res.data.grants),
        catchError((err) => throwError(() => err))
      );
  }

  public grantAccess(fileId: string, userId: string, expiresInDays?: number): Observable<{ grant: FileGrant; created: boolean }> {
    return this.http
      .post<{ status: string; data: { grant: FileGrant; created: boolean } }>(
        `${this.apiUrl}/files/${fileId}/access`,
        { userId, expiresInDays },
        { withCredentials: true }
      )
      .pipe(
        map((res) => res.data),
        catchError((err) => throwError(() => err))
      );
  }

  public revokeAccess(fileId: string, userId: string): Observable<void> {
    return this.http
      .delete<{ status: string }>(`${this.apiUrl}/files/${fileId}/access/${userId}`, { withCredentials: true })
      .pipe(
        map(() => void 0),
        catchError((err) => throwError(() => err))
      );
  }
}
