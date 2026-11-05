// Updated to integrate real backend API
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import JSZip from 'jszip';
import { FileService, FileGrant } from '../../../core/services/file.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { FileItem, FileType } from '../../../core/models/file-item.model';
import { User } from '../../../core/models/user.model';
import { FilePasswordModalComponent } from '../../files/file-password-modal/file-password-modal.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { FileIconComponent } from '../../../shared/components/file-icon/file-icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { FileSizePipe } from '../../../shared/pipes/file-size.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

const PAGE_SIZE = 8;
const MAX_DEMO_SIZE_MB = 50;

@Component({
  selector: 'app-manage-files',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    FilePasswordModalComponent,
    ConfirmationDialogComponent,
    ModalComponent,
    FileIconComponent,
    StatusBadgeComponent,
    PaginationComponent,
    EmptyStateComponent,
    AppButtonComponent,
    IconComponent,
    FileSizePipe,
    TimeAgoPipe,
  ],
  templateUrl: './manage-files.component.html',
  styleUrl: './manage-files.component.scss',
})
export class ManageFilesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly fileService = inject(FileService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly pageSize = PAGE_SIZE;
  readonly maxSizeMb = MAX_DEMO_SIZE_MB;

  readonly searchQuery = signal('');
  readonly typeFilter = signal('');
  readonly currentPage = signal(1);
  isDragOver = false;
  showUploadPw = false;
  showNewPw = false;

  readonly fileTypes: FileType[] = ['PDF', 'DOCX', 'XLSX', 'PPTX', 'TXT'];

  readonly showUploadModal = signal(false);
  readonly showEditModal = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showChangePwModal = signal(false);
  readonly showViewModal = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly fileToDelete = signal<FileItem | null>(null);
  readonly editingFile = signal<FileItem | null>(null);
  readonly changePwFile = signal<FileItem | null>(null);
  readonly viewTarget = signal<FileItem | null>(null);
  readonly isUploading = signal(false);
  readonly uploadSuccess = signal(false);
  readonly uploadSizeError = signal('');
  readonly uploadMode = signal<'file' | 'folder'>('file');
  readonly selectedFolderFiles = signal<File[]>([]);
  readonly folderName = signal<string>('');
  readonly isZipping = signal(false);
  readonly totalFolderSize = computed(() => this.selectedFolderFiles().reduce((acc, f) => acc + f.size, 0));
  readonly deleteConfirmMessage = computed(
    () => `Are you sure you want to delete "${this.fileToDelete()?.name ?? ''}"?`
  );

  // Viewers state
  readonly viewers = signal<User[]>([]);
  readonly uploadSelectedViewerIds = signal<string[]>([]);

  // Access Modal state
  readonly showAccessModal = signal(false);
  readonly accessFile = signal<FileItem | null>(null);
  readonly fileGrants = signal<FileGrant[]>([]);
  readonly isLoadingGrants = signal(false);
  readonly selectedAddViewerId = signal('');
  readonly grantExpiryDays = signal(365);
  readonly isGrantingAccess = signal(false);

  uploadForm: FormGroup = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      description: [''],
    },
    { validators: this.passwordMatchValidator }
  );

  editForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  changePasswordForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  private passwordMatchValidator(form: FormGroup) {
    const pw = form.get('password')?.value as string;
    const confirm = form.get('confirmPassword')?.value as string;
    return pw && confirm && pw !== confirm ? { passwordMismatch: true } : null;
  }

  readonly filteredFiles = computed(() => {
    let files = this.fileService.files();
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      files = files.filter((f) => f.name.toLowerCase().includes(q) || (f.description && f.description.toLowerCase().includes(q)));
    }
    const type = this.typeFilter();
    if (type) {
      files = files.filter((f) => f.type === type);
    }
    return files;
  });

  readonly pagedFiles = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredFiles().slice(start, start + this.pageSize);
  });

  readonly guessedType = computed<FileType>(() => {
    const f = this.selectedFile();
    if (!f) return 'PDF';
    const ext = f.name.split('.').pop()?.toUpperCase() || '';
    const knownTypes: FileType[] = ['PDF', 'DOCX', 'XLSX', 'PPTX', 'TXT'];
    return (knownTypes.find((t) => t === ext) as FileType) || 'PDF';
  });

  ngOnInit(): void {
    // Load the first page of files on component init
    this.fileService.loadFiles({ page: 1, limit: this.pageSize }).subscribe({
      error: (err) => {
        this.toastService.error('Failed to load files.', 'Error');
        console.error(err);
      },
    });
    this.loadViewers();
  }

  loadViewers(): void {
    this.userService.loadUsers({ limit: 100 }).subscribe({
      next: (res) => {
        const onlyActiveViewers = res.users.filter((u) => u.role === 'VIEWER' && u.status === 'ACTIVE');
        this.viewers.set(onlyActiveViewers);
        if (this.showUploadModal() && this.uploadSelectedViewerIds().length === 0) {
          this.uploadSelectedViewerIds.set(onlyActiveViewers.map((u) => u.id));
        }
      },
      error: (err) => console.error('Failed to load viewers', err),
    });
  }

  readonly availableViewersForFile = computed(() => {
    const grantedUserIds = new Set(this.fileGrants().map((g) => g.userId));
    return this.viewers().filter((v) => !grantedUserIds.has(v.id));
  });

  isViewerSelectedForUpload(userId: string): boolean {
    return this.uploadSelectedViewerIds().includes(userId);
  }

  toggleUploadViewer(userId: string): void {
    this.uploadSelectedViewerIds.update((ids) =>
      ids.includes(userId) ? ids.filter((id) => id !== userId) : [...ids, userId]
    );
  }

  selectAllUploadViewers(): void {
    this.uploadSelectedViewerIds.set(this.viewers().map((u) => u.id));
  }

  deselectAllUploadViewers(): void {
    this.uploadSelectedViewerIds.set([]);
  }

  openUploadModal(): void {
    this.uploadForm.reset();
    this.selectedFile.set(null);
    this.uploadMode.set('file');
    this.selectedFolderFiles.set([]);
    this.folderName.set('');
    this.isZipping.set(false);
    this.uploadSuccess.set(false);
    this.uploadSizeError.set('');
    this.showUploadPw = false;
    // Default: all active viewers have access
    this.uploadSelectedViewerIds.set(this.viewers().map((u) => u.id));
    this.showUploadModal.set(true);
    if (this.viewers().length === 0) {
      this.loadViewers();
    }
  }

  generateUploadPassword(): void {
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

    this.uploadForm.patchValue({
      password: pwd,
      confirmPassword: pwd,
    });
    this.showUploadPw = true;
    this.toastService.info('Suggested password generated!', 'Password Generated');
  }

  generateNewFilePassword(): void {
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

    this.changePasswordForm.patchValue({ newPassword: pwd });
    this.showNewPw = true;
    this.toastService.info('Suggested password generated!', 'Password Generated');
  }

  closeUploadModal(): void {
    this.showUploadModal.set(false);
    this.uploadSuccess.set(false);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.validateAndSetFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.validateAndSetFile(file);
  }

  private validateAndSetFile(file: File): void {
    this.uploadSizeError.set('');
    const maxBytes = MAX_DEMO_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      this.uploadSizeError.set(`File exceeds the limit of ${MAX_DEMO_SIZE_MB} MB.`);
      return;
    }
    this.selectedFile.set(file);
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.uploadSizeError.set('');
  }

  setUploadMode(mode: 'file' | 'folder'): void {
    this.uploadMode.set(mode);
    this.uploadSizeError.set('');
  }

  onFolderSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length) return;

    this.uploadSizeError.set('');
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const maxBytes = MAX_DEMO_SIZE_MB * 1024 * 1024;
    if (totalSize > maxBytes) {
      this.uploadSizeError.set(`Folder size (${(totalSize / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum limit of ${MAX_DEMO_SIZE_MB} MB.`);
      return;
    }

    const firstRel = (files[0] as any).webkitRelativePath || '';
    const detectedName = firstRel.split('/')[0] || 'Secure-Folder';
    this.folderName.set(detectedName);
    this.selectedFolderFiles.set(files);
  }

  removeFolder(): void {
    this.selectedFolderFiles.set([]);
    this.folderName.set('');
    this.uploadSizeError.set('');
  }

  async onUpload(): Promise<void> {
    if (this.uploadForm.invalid) return;
    const { password } = this.uploadForm.value as { password: string };

    if (this.uploadMode() === 'folder') {
      if (!this.selectedFolderFiles().length) return;
      this.isUploading.set(true);
      this.isZipping.set(true);

      try {
        const zip = new JSZip();
        for (const file of this.selectedFolderFiles()) {
          const relPath = (file as any).webkitRelativePath || file.name;
          zip.file(relPath, file);
        }
        const zipBlob = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
        });

        const rawName = this.folderName().trim() || 'Folder';
        const finalName = rawName.toLowerCase().endsWith('.zip') ? rawName : `${rawName}.zip`;
        const zipFile = new File([zipBlob], finalName, { type: 'application/zip' });
        this.isZipping.set(false);

        this.executeFileUpload(zipFile, password, finalName, true);
      } catch (zipErr) {
        this.isUploading.set(false);
        this.isZipping.set(false);
        this.toastService.error('Failed to compress folder files.', 'Upload Error');
        console.error(zipErr);
      }
    } else {
      if (!this.selectedFile()) return;
      this.isUploading.set(true);
      const file = this.selectedFile()!;
      this.executeFileUpload(file, password, file.name, false);
    }
  }

  private executeFileUpload(file: File, password: string, displayName: string, isFolder: boolean): void {
    this.fileService.uploadFile(file, password, displayName).subscribe({
      next: (uploadedFile) => {
        const selectedIds = this.uploadSelectedViewerIds();
        if (selectedIds.length > 0) {
          const grantObservables = selectedIds.map((userId) =>
            this.fileService.grantAccess(uploadedFile.id, userId, 365)
          );
          forkJoin(grantObservables).subscribe({
            next: () => {
              this.isUploading.set(false);
              this.uploadSuccess.set(true);
              const label = isFolder ? 'Folder' : 'File';
              this.toastService.success(`"${displayName}" (${label}) uploaded and permissions assigned.`, 'Upload Successful');
            },
            error: (grantErr) => {
              console.error('Some grant calls failed', grantErr);
              this.isUploading.set(false);
              this.uploadSuccess.set(true);
              this.toastService.warning('Uploaded, but some viewer permissions could not be set.', 'Warning');
            },
          });
        } else {
          this.isUploading.set(false);
          this.uploadSuccess.set(true);
          const label = isFolder ? 'Folder' : 'File';
          this.toastService.success(`"${displayName}" (${label}) uploaded successfully (admin-only).`, 'Upload Successful');
        }
      },
      error: (err) => {
        this.isUploading.set(false);
        this.isZipping.set(false);
        const msg = err.error?.message || 'Upload failed.';
        this.toastService.error(msg, 'Upload Error');
        console.error(err);
      },
    });
  }

  openEditModal(file: FileItem): void {
    this.editingFile.set(file);
    this.editForm.reset({ name: file.name, description: file.description || '' });
    this.showEditModal.set(true);
  }

  onEditSave(): void {
    const file = this.editingFile();
    if (!file || this.editForm.invalid) return;
    const { name } = this.editForm.value as { name: string; description: string };
    this.fileService.updateFile(file.id, { name }).subscribe({
      next: () => {
        this.toastService.success(`"${name}" metadata updated.`, 'File Updated');
        this.showEditModal.set(false);
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to update file.';
        this.toastService.error(msg, 'Error');
        console.error(err);
      },
    });
  }

  openPasswordModal(file: FileItem): void {
    this.changePwFile.set(file);
    this.changePasswordForm.reset();
    this.showChangePwModal.set(true);
  }

  onPasswordChange(): void {
    const file = this.changePwFile();
    if (!file || this.changePasswordForm.invalid) return;
    const newPassword = this.changePasswordForm.value.newPassword as string;
    this.fileService.changePassword(file.id, newPassword).subscribe({
      next: () => {
        this.toastService.success(`Password for "${file.name}" updated.`, 'Password Changed');
        this.showChangePwModal.set(false);
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to change password.';
        this.toastService.error(msg, 'Error');
        console.error(err);
      },
    });
  }

  onView(file: FileItem): void {
    if (this.authService.isAdmin() || this.fileService.isFileUnlocked(file.id)) {
      this.router.navigate(['/document-viewer', file.id]);
    } else {
      this.viewTarget.set(file);
      this.showViewModal.set(true);
    }
  }

  onViewUnlocked(fileId: string): void {
    this.showViewModal.set(false);
    this.router.navigate(['/document-viewer', fileId]);
  }

  confirmDelete(file: FileItem): void {
    this.fileToDelete.set(file);
    this.showDeleteDialog.set(true);
  }

  onDeleteConfirmed(): void {
    const file = this.fileToDelete();
    if (file) {
      this.fileService.deleteFile(file.id).subscribe({
        next: () => {
          this.toastService.success(`"${file.name}" deleted.`, 'File Deleted');
          this.showDeleteDialog.set(false);
          this.fileToDelete.set(null);
        },
        error: (err) => {
          const msg = err.error?.message || 'Failed to delete file.';
          this.toastService.error(msg, 'Error');
          console.error(err);
        },
      });
    }
  }

  openAccessModal(file: FileItem): void {
    this.accessFile.set(file);
    this.selectedAddViewerId.set('');
    this.grantExpiryDays.set(365);
    this.showAccessModal.set(true);
    this.loadGrants(file.id);
    if (this.viewers().length === 0) {
      this.loadViewers();
    }
  }

  loadGrants(fileId: string): void {
    this.isLoadingGrants.set(true);
    this.fileService.getFileGrants(fileId, 'all').subscribe({
      next: (grants) => {
        this.fileGrants.set(grants);
        this.isLoadingGrants.set(false);
      },
      error: (err) => {
        this.isLoadingGrants.set(false);
        this.toastService.error('Failed to load file permissions.', 'Error');
        console.error(err);
      },
    });
  }

  onGrantAccess(): void {
    const file = this.accessFile();
    const userId = this.selectedAddViewerId();
    if (!file || !userId) return;

    this.isGrantingAccess.set(true);
    this.fileService.grantAccess(file.id, userId, this.grantExpiryDays()).subscribe({
      next: () => {
        this.isGrantingAccess.set(false);
        this.selectedAddViewerId.set('');
        this.toastService.success('Viewer access granted.', 'Permission Updated');
        this.loadGrants(file.id);
      },
      error: (err) => {
        this.isGrantingAccess.set(false);
        const msg = err.error?.message || 'Failed to grant access.';
        this.toastService.error(msg, 'Error');
        console.error(err);
      },
    });
  }

  onRevokeAccess(grant: FileGrant): void {
    const file = this.accessFile();
    if (!file) return;

    this.fileService.revokeAccess(file.id, grant.userId).subscribe({
      next: () => {
        this.toastService.success(`Access revoked for ${grant.user?.name || 'viewer'}.`, 'Access Revoked');
        this.loadGrants(file.id);
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to revoke access.';
        this.toastService.error(msg, 'Error');
        console.error(err);
      },
    });
  }
}
