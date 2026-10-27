import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FileService } from '../../../core/services/file.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { FileItem, FileType, SortDirection, FileSortField } from '../../../core/models/file-item.model';
import { FilePasswordModalComponent } from '../file-password-modal/file-password-modal.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
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
export class SharedFilesComponent {
  private readonly fileService = inject(FileService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly isAdmin = this.authService.isAdmin;
  readonly pageSize = PAGE_SIZE;

  searchQuery = '';
  typeFilter = '';
  sortField: FileSortField = 'updatedAt';
  sortDir: SortDirection = 'desc';
  currentPage = 1;

  readonly fileTypes: FileType[] = ['PDF', 'DOCX', 'XLSX', 'PPTX', 'TXT'];

  readonly showPasswordModal = signal(false);
  readonly selectedFile = signal<FileItem | null>(null);
  readonly showDeleteDialog = signal(false);
  readonly fileToDelete = signal<FileItem | null>(null);
  readonly deleteConfirmMessage = computed(
    () => `Are you sure you want to delete "${this.fileToDelete()?.name ?? ''}"?`
  );

  readonly filteredFiles = computed(() => {
    let files = this.fileService.files();

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      files = files.filter((f) => f.name.toLowerCase().includes(q));
    }

    if (this.typeFilter) {
      files = files.filter((f) => f.type === this.typeFilter);
    }

    return [...files].sort((a, b) => {
      let comparison = 0;
      if (this.sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (this.sortField === 'size') {
        comparison = a.size - b.size;
      } else {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      return this.sortDir === 'asc' ? comparison : -comparison;
    });
  });

  readonly pagedFiles = computed(() => {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredFiles().slice(start, start + this.pageSize);
  });

  isUnlocked(id: string): boolean {
    return this.fileService.isFileUnlocked(id);
  }

  onSearch(): void {
    this.currentPage = 1;
  }

  onFilter(): void {
    this.currentPage = 1;
  }

  onSort(): void {
    this.currentPage = 1;
  }

  toggleSortDir(): void {
    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onViewFile(file: FileItem): void {
    if (this.fileService.isFileUnlocked(file.id)) {
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
    if (file) {
      this.fileService.deleteFile(file.id);
      this.toastService.success(`"${file.name}" has been removed.`, 'File Deleted');
      this.showDeleteDialog.set(false);
      this.fileToDelete.set(null);
    }
  }

  goToManageFiles(): void {
    this.router.navigate(['/admin/manage-files']);
  }
}
