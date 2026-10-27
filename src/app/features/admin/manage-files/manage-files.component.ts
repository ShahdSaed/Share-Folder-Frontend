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
  templateUrl: './manage-files.component.html',
  styleUrl: './manage-files.component.scss',
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
