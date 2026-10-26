import { Injectable, inject, signal } from '@angular/core';
import { FileItem, FileType } from '../models/file-item.model';
import { MOCK_FILES } from '../mock-data/files.mock';
import { AuditLogService } from './audit-log.service';
import { AuthService } from './auth.service';

const MASTER_DEMO_PASSWORD = 'company123';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private readonly auditLogService = inject(AuditLogService);
  private readonly authService = inject(AuthService);

  private readonly filesSignal = signal<FileItem[]>([...MOCK_FILES]);
  public readonly files = this.filesSignal.asReadonly();

  // Track files unlocked in this demo session
  private readonly unlockedFileIdsSignal = signal<Set<string>>(new Set());
  public readonly unlockedFileIds = this.unlockedFileIdsSignal.asReadonly();

  public getFiles(): FileItem[] {
    return this.filesSignal();
  }

  public getFileById(id: string): FileItem | undefined {
    return this.filesSignal().find((f) => f.id === id);
  }

  public isFileUnlocked(id: string): boolean {
    return this.unlockedFileIdsSignal().has(id);
  }

  public unlockFileDirectly(id: string): void {
    this.unlockedFileIdsSignal.update((set) => {
      const next = new Set(set);
      next.add(id);
      return next;
    });
  }

  public verifyPassword(
    id: string,
    password: string
  ): { success: boolean; message?: string } {
    const file = this.getFileById(id);
    if (!file) {
      return { success: false, message: 'File not found.' };
    }

    const currentUser = this.authService.currentUser();
    const userEmail = currentUser?.email || 'viewer@company.com';
    const userName = currentUser?.fullName || 'Viewer User';

    // Record access attempt
    this.auditLogService.logActivity({
      userEmail,
      userName,
      action: 'FILE_ACCESS_ATTEMPT',
      targetFile: file.name,
      result: 'SUCCESS',
      details: 'Password verification challenge submitted',
    });

    const isMatch =
      password === file.mockPassword ||
      password === MASTER_DEMO_PASSWORD;

    if (isMatch) {
      this.unlockFileDirectly(id);

      this.auditLogService.logActivity({
        userEmail,
        userName,
        action: 'FILE_VIEWED',
        targetFile: file.name,
        result: 'SUCCESS',
        details: 'Password verified successfully. Document unlocked for viewing.',
      });

      return { success: true };
    } else {
      this.auditLogService.logActivity({
        userEmail,
        userName,
        action: 'FILE_PASSWORD_FAILED',
        targetFile: file.name,
        result: 'FAILED',
        details: 'Incorrect password attempt entered in protection modal.',
      });

      return {
        success: false,
        message: 'Incorrect password. Please verify the password and try again.',
      };
    }
  }

  public uploadFile(payload: {
    name: string;
    type: FileType;
    size: number;
    password: string;
    description?: string;
  }): FileItem {
    const currentUser = this.authService.currentUser();
    const userEmail = currentUser?.email || 'alex.morris@company.com';
    const userName = currentUser?.fullName || 'Alex Morris';
    const userId = currentUser?.id || 'usr-001';

    const newFile: FileItem = {
      id: `file-${Date.now()}`,
      name: payload.name,
      originalName: payload.name,
      type: payload.type,
      size: payload.size,
      uploadedBy: userName,
      uploadedById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mockPassword: payload.password || MASTER_DEMO_PASSWORD,
      description: payload.description || 'Uploaded enterprise document.',
      pageCount: Math.floor(Math.random() * 15) + 3,
      isProtected: true,
      sampleContent: [
        `${payload.name.toUpperCase()} • COMPANY CONFIDENTIAL`,
        'DOCUMENT PREVIEW DEMO',
        'This file was uploaded during the current demo session.',
        payload.description || 'Document contents are encrypted and managed by Company File Hub controls.',
        'Access to this document is logged in the centralized activity logs.',
      ],
    };

    this.filesSignal.update((current) => [newFile, ...current]);

    this.auditLogService.logActivity({
      userEmail,
      userName,
      action: 'FILE_UPLOAD',
      targetFile: newFile.name,
      result: 'SUCCESS',
      details: `New ${newFile.type} uploaded (${(newFile.size / 1024 / 1024).toFixed(2)} MB)`,
    });

    return newFile;
  }

  public updateFile(id: string, patch: Partial<FileItem>): boolean {
    const file = this.getFileById(id);
    if (!file) return false;

    const currentUser = this.authService.currentUser();
    const updatedFile: FileItem = {
      ...file,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    this.filesSignal.update((current) =>
      current.map((f) => (f.id === id ? updatedFile : f))
    );

    this.auditLogService.logActivity({
      userEmail: currentUser?.email || 'admin@company.com',
      userName: currentUser?.fullName || 'Administrator',
      action: 'FILE_UPDATED',
      targetFile: updatedFile.name,
      result: 'SUCCESS',
      details: `Metadata updated: ${Object.keys(patch).join(', ')}`,
    });

    return true;
  }

  public changePassword(id: string, newPassword: string): boolean {
    return this.updateFile(id, { mockPassword: newPassword });
  }

  public deleteFile(id: string): boolean {
    const file = this.getFileById(id);
    if (!file) return false;

    const currentUser = this.authService.currentUser();

    this.filesSignal.update((current) => current.filter((f) => f.id !== id));

    // Also remove from unlocked set if present
    this.unlockedFileIdsSignal.update((set) => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });

    this.auditLogService.logActivity({
      userEmail: currentUser?.email || 'admin@company.com',
      userName: currentUser?.fullName || 'Administrator',
      action: 'FILE_DELETED',
      targetFile: file.name,
      result: 'SUCCESS',
      details: `File permanently deleted from repository by administrator`,
    });

    return true;
  }
}
