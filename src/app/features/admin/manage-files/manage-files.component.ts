import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FileService } from '../../../core/services/file.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { FileItem, FileType } from '../../../core/models/file-item.model';
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
  template: `
    <div class="manage-files-page">
      <!-- Page Header -->
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Manage Files</h1>
          <p class="text-secondary">Upload, edit, and delete company documents.</p>
        </div>
        <app-button variant="primary" (btnClick)="openUploadModal()">
          <app-icon name="upload" [size]="16"></app-icon>
          Upload File
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
              placeholder="Search files..."
              [(ngModel)]="searchQuery"
              (ngModelChange)="currentPage = 1"
            />
          </div>
          <select class="form-control filter-select" [(ngModel)]="typeFilter" (ngModelChange)="currentPage = 1">
            <option value="">All Types</option>
            @for (t of fileTypes; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </div>
        <span class="file-count">{{ filteredFiles().length }} files</span>
      </div>

      <!-- Table -->
      @if (pagedFiles().length > 0) {
        <div class="cfh-table-container">
          <table class="cfh-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Uploaded By</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (file of pagedFiles(); track file.id) {
                <tr>
                  <td class="name-cell">
                    <app-file-icon [type]="file.type" size="sm"></app-file-icon>
                    <div class="name-info">
                      <span class="file-name">{{ file.name }}</span>
                    </div>
                  </td>
                  <td><app-status-badge variant="neutral" size="sm" [showDot]="false">{{ file.type }}</app-status-badge></td>
                  <td class="size-cell">{{ file.size | fileSize }}</td>
                  <td class="secondary-cell">{{ file.uploadedBy }}</td>
                  <td class="secondary-cell">{{ file.updatedAt | timeAgo }}</td>
                  <td class="actions-cell">
                    <div class="action-btn-group">
                      <button type="button" class="action-icon-btn" (click)="onView(file)" title="View">
                        <app-icon name="eye" [size]="14"></app-icon>
                      </button>
                      <button type="button" class="action-icon-btn" (click)="openEditModal(file)" title="Edit metadata">
                        <app-icon name="edit" [size]="14"></app-icon>
                      </button>
                      <button type="button" class="action-icon-btn" (click)="openPasswordModal(file)" title="Change password">
                        <app-icon name="key" [size]="14"></app-icon>
                      </button>
                      <button type="button" class="action-icon-btn danger" (click)="confirmDelete(file)" title="Delete">
                        <app-icon name="trash" [size]="14"></app-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <app-pagination
            [currentPage]="currentPage"
            [totalItems]="filteredFiles().length"
            [pageSize]="pageSize"
            (pageChange)="currentPage = $event"
          ></app-pagination>
        </div>
      } @else {
        <app-empty-state icon="file-text" title="No files found" description="No files match your criteria."></app-empty-state>
      }
    </div>

    <!-- Upload Modal -->
    <app-modal [isOpen]="showUploadModal()" title="Upload File" subtitle="Select a file and configure encryption security settings." size="md" (closed)="closeUploadModal()">
      @if (!uploadSuccess()) {
        <form [formGroup]="uploadForm" (ngSubmit)="onUpload()" novalidate>
          <!-- Drag & Drop Zone -->
          <div
            [class]="'drop-zone' + (isDragOver ? ' drag-over' : '') + (selectedFile() ? ' has-file' : '')"
            (dragover)="onDragOver($event)"
            (dragleave)="isDragOver = false"
            (drop)="onDrop($event)"
            (click)="fileInput.click()"
          >
            <input #fileInput type="file" hidden (change)="onFileSelected($event)" />
            @if (selectedFile()) {
              <div class="selected-file-preview">
                <app-file-icon [type]="guessedType()" size="md"></app-file-icon>
                <div class="preview-info">
                  <span class="preview-name">{{ selectedFile()!.name }}</span>
                  <span class="preview-size">{{ selectedFile()!.size | fileSize }}</span>
                </div>
                <button type="button" class="remove-file-btn" (click)="$event.stopPropagation(); removeFile()">
                  <app-icon name="x" [size]="16"></app-icon>
                </button>
              </div>
            } @else {
              <div class="drop-placeholder">
                <app-icon name="upload" [size]="28" [strokeWidth]="1.5"></app-icon>
                <p class="drop-main">Drag & drop file here or <span class="browse-link">browse</span></p>
                <p class="drop-sub">PDF, DOCX, XLSX, PPTX, TXT · Maximum size {{ maxSizeMb }} MB</p>
              </div>
            }
          </div>

          @if (uploadSizeError()) {
            <div class="upload-error-msg" role="alert">
              <app-icon name="alert-circle" [size]="14"></app-icon>
              {{ uploadSizeError() }}
            </div>
          }

          <div class="form-group" style="margin-top: 16px;">
            <label for="upload-pw">File Password <span class="required-indicator">*</span></label>
            <div class="input-with-addon">
              <input id="upload-pw" [type]="showUploadPw ? 'text' : 'password'" formControlName="password" class="form-control" placeholder="Set a password to protect this file" autocomplete="new-password" />
              <button type="button" class="input-addon-btn" (click)="showUploadPw = !showUploadPw">
                <app-icon [name]="showUploadPw ? 'eye-off' : 'eye'" [size]="16"></app-icon>
              </button>
            </div>
            @if (uploadForm.get('password')!.invalid && uploadForm.get('password')!.touched) {
              <span class="input-error"><app-icon name="alert-circle" [size]="12"></app-icon> Password is required.</span>
            }
          </div>

          <div class="form-group">
            <label for="upload-confirm-pw">Confirm Password <span class="required-indicator">*</span></label>
            <input id="upload-confirm-pw" type="password" formControlName="confirmPassword" class="form-control" placeholder="Re-enter the file password" autocomplete="new-password" />
            @if (uploadForm.hasError('passwordMismatch') && uploadForm.get('confirmPassword')!.touched) {
              <span class="input-error"><app-icon name="alert-circle" [size]="12"></app-icon> Passwords do not match.</span>
            }
          </div>

          <div class="form-group">
            <label for="upload-desc">Description (Optional)</label>
            <textarea id="upload-desc" formControlName="description" class="form-control" rows="2" placeholder="Enter a brief document description..."></textarea>
          </div>

          <p class="demo-note">
            <app-icon name="info" [size]="12"></app-icon>
            Demo only — no file is uploaded to any server. Changes apply to frontend session state.
          </p>
        </form>
      } @else {
        <div class="upload-success-state">
          <div class="success-icon-wrap"><app-icon name="check-circle" [size]="40"></app-icon></div>
          <h3>File Added Successfully!</h3>
          <p>The file has been added to the demo repository for this session.</p>
        </div>
      }

      <div modal-footer>
        @if (!uploadSuccess()) {
          <app-button variant="secondary" (btnClick)="closeUploadModal()">Cancel</app-button>
          <app-button
            variant="primary"
            type="submit"
            [loading]="isUploading()"
            [disabled]="uploadForm.invalid || !selectedFile() || !!uploadSizeError() || isUploading()"
            (btnClick)="onUpload()"
          >
            <app-icon name="upload" [size]="16"></app-icon>
            Upload File
          </app-button>
        } @else {
          <app-button variant="primary" (btnClick)="closeUploadModal()">Done</app-button>
        }
      </div>
    </app-modal>

    <!-- Edit Modal -->
    <app-modal [isOpen]="showEditModal()" title="Edit File Metadata" size="sm" (closed)="showEditModal.set(false)">
      <form [formGroup]="editForm" (ngSubmit)="onEditSave()" novalidate>
        <div class="form-group">
          <label for="edit-name">Display Name <span class="required-indicator">*</span></label>
          <input id="edit-name" type="text" formControlName="name" class="form-control" />
          @if (editForm.get('name')!.invalid && editForm.get('name')!.touched) {
            <span class="input-error"><app-icon name="alert-circle" [size]="12"></app-icon> Name is required.</span>
          }
        </div>
        <div class="form-group">
          <label for="edit-desc">Description</label>
          <textarea id="edit-desc" formControlName="description" class="form-control" rows="3"></textarea>
        </div>
        <p class="demo-note"><app-icon name="info" [size]="12"></app-icon> Changes are local session state only.</p>
      </form>
      <div modal-footer>
        <app-button variant="secondary" (btnClick)="showEditModal.set(false)">Cancel</app-button>
        <app-button variant="primary" [disabled]="editForm.invalid" (btnClick)="onEditSave()">Save Changes</app-button>
      </div>
    </app-modal>

    <!-- Change Password Modal -->
    <app-modal [isOpen]="showChangePwModal()" title="Change File Password" subtitle="Never reveals the existing password." size="sm" (closed)="showChangePwModal.set(false)">
      <form [formGroup]="changePasswordForm" novalidate>
        <div class="form-group">
          <label for="new-file-pw">New Password <span class="required-indicator">*</span></label>
          <div class="input-with-addon">
            <input id="new-file-pw" [type]="showNewPw ? 'text' : 'password'" formControlName="newPassword" class="form-control" placeholder="Enter new file password" />
            <button type="button" class="input-addon-btn" (click)="showNewPw = !showNewPw">
              <app-icon [name]="showNewPw ? 'eye-off' : 'eye'" [size]="16"></app-icon>
            </button>
          </div>
          @if (changePasswordForm.get('newPassword')!.invalid && changePasswordForm.get('newPassword')!.touched) {
            <span class="input-error"><app-icon name="alert-circle" [size]="12"></app-icon> Password must be at least 4 characters.</span>
          }
        </div>
        <p class="demo-note"><app-icon name="info" [size]="12"></app-icon> The previous password is never displayed. Demo only.</p>
      </form>
      <div modal-footer>
        <app-button variant="secondary" (btnClick)="showChangePwModal.set(false)">Cancel</app-button>
        <app-button variant="primary" [disabled]="changePasswordForm.invalid" (btnClick)="onPasswordChange()">Update Password</app-button>
      </div>
    </app-modal>

    <!-- View Password Modal (for access verification) -->
    <app-file-password-modal
      [isOpen]="showViewModal()"
      [file]="viewTarget()"
      (closed)="showViewModal.set(false)"
      (unlocked)="onViewUnlocked($event)"
    ></app-file-password-modal>

    <!-- Delete Confirmation -->
    <app-confirmation-dialog
      [isOpen]="showDeleteDialog()"
      title="Delete File"
      [message]="deleteConfirmMessage()"
      submessage="This action will permanently delete the file from the repository. Are you sure you wish to continue?"
      confirmText="Delete File"
      (confirmed)="onDeleteConfirmed()"
      (cancelled)="showDeleteDialog.set(false)"
    ></app-confirmation-dialog>
  `,
  styles: [
    `
      .manage-files-page {
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

      .file-count {
        font-size: var(--cfh-font-size-secondary);
        color: var(--cfh-text-secondary);
        font-weight: 500;
      }

      .name-cell {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 200px;
      }

      .file-name {
        font-size: 13.5px;
        font-weight: 500;
      }

      .size-cell {
        white-space: nowrap;
        font-size: var(--cfh-font-size-secondary);
        font-weight: 500;
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

        &:hover {
          background-color: #f3f4f6;
          color: var(--cfh-text-main);
          border-color: var(--cfh-border-dark);
        }

        &.danger {
          color: var(--cfh-error);
          border-color: var(--cfh-error-border);
          &:hover {
            background-color: var(--cfh-error-light);
          }
        }
      }

      /* Upload Modal Styles */
      .drop-zone {
        border: 2px dashed var(--cfh-border);
        border-radius: var(--cfh-radius-lg);
        padding: 28px 20px;
        text-align: center;
        cursor: pointer;
        transition: all 0.15s ease;
        background-color: #fafbfc;

        &:hover, &.drag-over {
          border-color: var(--cfh-primary-blue);
          background-color: var(--cfh-primary-blue-light);
        }

        &.has-file {
          border-style: solid;
          border-color: var(--cfh-success);
          background-color: var(--cfh-success-light);
          cursor: default;
        }
      }

      .drop-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        color: var(--cfh-text-secondary);
      }

      .drop-main {
        font-size: 14px;
        font-weight: 500;
        color: var(--cfh-text-main);

        .browse-link {
          color: var(--cfh-primary-blue);
          text-decoration: underline;
        }
      }

      .drop-sub {
        font-size: 12px;
        color: var(--cfh-text-muted);
      }

      .selected-file-preview {
        display: flex;
        align-items: center;
        gap: 12px;
        text-align: left;
      }

      .preview-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .preview-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--cfh-success);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .preview-size {
        font-size: 11px;
        color: var(--cfh-text-secondary);
      }

      .remove-file-btn {
        background: none;
        border: none;
        color: var(--cfh-text-secondary);
        cursor: pointer;
        padding: 4px;
        border-radius: var(--cfh-radius-sm);
        &:hover { color: var(--cfh-error); }
      }

      .upload-error-msg {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background-color: var(--cfh-error-light);
        border: 1px solid var(--cfh-error-border);
        border-radius: var(--cfh-radius-md);
        font-size: var(--cfh-font-size-secondary);
        color: var(--cfh-error);
        margin-top: 8px;
      }

      .demo-note {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: var(--cfh-text-muted);
        margin-top: 12px;
      }

      .upload-success-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        text-align: center;
        padding: 16px 0;

        .success-icon-wrap {
          color: var(--cfh-success);
        }

        h3 {
          font-size: 18px;
          color: var(--cfh-primary-navy);
        }

        p {
          font-size: 13px;
          color: var(--cfh-text-secondary);
        }
      }

      .input-with-addon {
        position: relative;
        .form-control { padding-right: 42px; }
        .input-addon-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--cfh-text-secondary);
          cursor: pointer;
          padding: 4px;
          border-radius: var(--cfh-radius-sm);
          display: flex;
          align-items: center;
          &:hover { color: var(--cfh-text-main); }
        }
      }
    `,
  ],
})
export class ManageFilesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly fileService = inject(FileService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly pageSize = PAGE_SIZE;
  readonly maxSizeMb = MAX_DEMO_SIZE_MB;

  searchQuery = '';
  typeFilter = '';
  currentPage = 1;
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
  readonly deleteConfirmMessage = computed(
    () => `Are you sure you want to delete "${this.fileToDelete()?.name ?? ''}"?`
  );

  uploadForm: FormGroup = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(4)]],
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
    newPassword: ['', [Validators.required, Validators.minLength(4)]],
  });

  private passwordMatchValidator(form: FormGroup) {
    const pw = form.get('password')?.value as string;
    const confirm = form.get('confirmPassword')?.value as string;
    return pw && confirm && pw !== confirm ? { passwordMismatch: true } : null;
  }

  readonly filteredFiles = computed(() => {
    let files = this.fileService.files();
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      files = files.filter((f) => f.name.toLowerCase().includes(q));
    }
    if (this.typeFilter) {
      files = files.filter((f) => f.type === this.typeFilter);
    }
    return files;
  });

  readonly pagedFiles = computed(() => {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredFiles().slice(start, start + this.pageSize);
  });

  readonly guessedType = computed<FileType>(() => {
    const f = this.selectedFile();
    if (!f) return 'PDF';
    const ext = f.name.split('.').pop()?.toUpperCase() || '';
    const knownTypes: FileType[] = ['PDF', 'DOCX', 'XLSX', 'PPTX', 'TXT'];
    return (knownTypes.find((t) => t === ext) as FileType) || 'PDF';
  });

  openUploadModal(): void {
    this.uploadForm.reset();
    this.selectedFile.set(null);
    this.uploadSuccess.set(false);
    this.uploadSizeError.set('');
    this.showUploadModal.set(true);
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
      this.uploadSizeError.set(`File exceeds the demo limit of ${MAX_DEMO_SIZE_MB} MB.`);
      return;
    }
    this.selectedFile.set(file);
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.uploadSizeError.set('');
  }

  onUpload(): void {
    if (this.uploadForm.invalid || !this.selectedFile()) return;
    this.isUploading.set(true);

    const file = this.selectedFile()!;
    const { password, description } = this.uploadForm.value as { password: string; description: string };

    setTimeout(() => {
      this.fileService.uploadFile({
        name: file.name,
        type: this.guessedType(),
        size: file.size,
        password,
        description,
      });
      this.isUploading.set(false);
      this.uploadSuccess.set(true);
      this.toastService.success(`"${file.name}" added to the demo repository.`, 'File Uploaded');
    }, 1200);
  }

  openEditModal(file: FileItem): void {
    this.editingFile.set(file);
    this.editForm.reset({ name: file.name, description: file.description || '' });
    this.showEditModal.set(true);
  }

  onEditSave(): void {
    const file = this.editingFile();
    if (!file || this.editForm.invalid) return;

    const { name, description } = this.editForm.value as { name: string; description: string };
    this.fileService.updateFile(file.id, { name, description });
    this.toastService.success(`"${name}" metadata updated.`, 'File Updated');
    this.showEditModal.set(false);
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
    this.fileService.changePassword(file.id, newPassword);
    this.toastService.success(`Password for "${file.name}" has been updated.`, 'Password Changed');
    this.showChangePwModal.set(false);
  }

  onView(file: FileItem): void {
    if (this.fileService.isFileUnlocked(file.id)) {
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
      this.fileService.deleteFile(file.id);
      this.toastService.success(`"${file.name}" deleted.`, 'File Deleted');
      this.showDeleteDialog.set(false);
      this.fileToDelete.set(null);
    }
  }
}
