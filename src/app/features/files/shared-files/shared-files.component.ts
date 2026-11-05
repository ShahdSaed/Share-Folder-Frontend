import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FileService } from '../../../core/services/file.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { FileItem, FileType, FileSortField, SortDirection } from '../../../core/models/file-item.model';
import { ApiPagination } from '../../../core/models/audit-log.model';
import { FilePasswordModalComponent } from '../file-password-modal/file-password-modal.component';
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

@Component({
  selector: 'app-shared-files',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FilePasswordModalComponent,
    ConfirmationDialogComponent,
    FileIconComponent,
    StatusBadgeComponent,
    PaginationComponent,
    EmptyStateComponent,
    AppButtonComponent,
    IconComponent,
    FileSizePipe,
    TimeAgoPipe,
  ],
  templateUrl: './shared-files.component.html',
  styleUrl: './shared-files.component.scss',
})
export class SharedFilesComponent implements OnInit {
  private readonly fileService = inject(FileService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly isAdmin = this.authService.isAdmin;
  readonly pageSize = PAGE_SIZE;

  readonly searchQuery = signal('');
  readonly typeFilter = signal('');
  readonly sortField = signal<FileSortField>('updatedAt');
  readonly sortDir = signal<SortDirection>('desc');
  readonly currentPage = signal(1);

  readonly fileTypes: FileType[] = ['PDF', 'DOCX', 'XLSX', 'PPTX', 'TXT', 'ZIP'];

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly pagination = signal<ApiPagination | null>(null);

  readonly showPasswordModal = signal(false);
  readonly selectedFile = signal<FileItem | null>(null);
  readonly showDeleteDialog = signal(false);
  readonly fileToDelete = signal<FileItem | null>(null);
  readonly deleteConfirmMessage = computed(
    () => `Are you sure you want to delete "${this.fileToDelete()?.name ?? ''}"?`
  );

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

    const field = this.sortField();
    const dir = this.sortDir();

    return [...files].sort((a, b) => {
      let comparison = 0;
      if (field === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (field === 'size') {
        comparison = a.size - b.size;
      } else {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      return dir === 'asc' ? comparison : -comparison;
    });
  });

  readonly pagedFiles = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredFiles().slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    this.loadFiles();
  }

  loadFiles(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.fileService
      .loadFiles({ page: 1, limit: 100 })
      .subscribe({
        next: ({ pagination }) => {
          this.pagination.set(pagination);
          this.isLoading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          if (err.status === 0) {
            this.errorMessage.set('Cannot connect to server. Please try again.');
          } else {
            this.errorMessage.set(err.error?.message ?? 'Failed to load files.');
          }
        },
      });
  }

  onSearch(): void {
    this.currentPage.set(1);
  }

  onFilter(): void {
    this.currentPage.set(1);
  }

  onSort(): void {
    this.currentPage.set(1);
  }

  toggleSortDir(): void {
    this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  isUnlocked(id: string): boolean {
    return this.isAdmin() || this.fileService.isFileUnlocked(id);
  }

  onViewFile(file: FileItem): void {
    if (this.isAdmin() || this.fileService.isFileUnlocked(file.id)) {
      this.router.navigate(['/document-viewer', file.id]);
    } else {
      this.selectedFile.set(file);
      this.showPasswordModal.set(true);
    }
  }

  onFileUnlocked(fileId: string): void {
    this.showPasswordModal.set(false);
    this.router.navigate(['/document-viewer', fileId]);
  }

  confirmDelete(file: FileItem): void {
    this.fileToDelete.set(file);
    this.showDeleteDialog.set(true);
  }

  onDeleteConfirmed(): void {
    const file = this.fileToDelete();
    if (!file) return;

    this.fileService.deleteFile(file.id).subscribe({
      next: () => {
        this.toastService.success(`"${file.name}" has been removed.`, 'File Deleted');
        this.showDeleteDialog.set(false);
        this.fileToDelete.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.toastService.error(err.error?.message ?? 'Failed to delete file.');
        this.showDeleteDialog.set(false);
      },
    });
  }

  goToManageFiles(): void {
    this.router.navigate(['/admin/manage-files']);
  }
}
