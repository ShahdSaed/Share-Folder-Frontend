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
  template: `
    <div class="shared-files-page">
      <!-- Page Header -->
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Shared Files</h1>
          <nav class="breadcrumb-nav" aria-label="Breadcrumb">
            <span>Home</span>
            <span class="separator">/</span>
            <span class="current">Shared Files</span>
          </nav>
        </div>
        @if (isAdmin()) {
          <app-button variant="primary" (btnClick)="goToManageFiles()">
            <app-icon name="upload" [size]="16"></app-icon>
            Upload File
          </app-button>
        }
      </div>

      <!-- Toolbar -->
      <div class="cfh-surface toolbar">
        <div class="toolbar-left">
          <!-- Search -->
          <div class="search-input-wrap">
            <app-icon name="search" [size]="16" class="search-icon"></app-icon>
            <input
              type="search"
              class="form-control search-input"
              placeholder="Search files..."
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearch()"
              aria-label="Search files"
            />
          </div>

          <!-- Type Filter -->
          <select
            class="form-control filter-select"
            [(ngModel)]="typeFilter"
            (ngModelChange)="onFilter()"
            aria-label="Filter by file type"
          >
            <option value="">All Types</option>
            @for (t of fileTypes; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>

          <!-- Sort -->
          <select
            class="form-control filter-select"
            [(ngModel)]="sortField"
            (ngModelChange)="onSort()"
            aria-label="Sort files"
          >
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="updatedAt">Last Updated</option>
          </select>

          <button type="button" class="sort-dir-btn" (click)="toggleSortDir()" [attr.aria-label]="'Sort ' + (sortDir === 'asc' ? 'descending' : 'ascending')">
            <app-icon name="arrow-up-down" [size]="16"></app-icon>
            {{ sortDir === 'asc' ? 'ASC' : 'DESC' }}
          </button>
        </div>

        <div class="toolbar-right">
          <span class="file-count">{{ filteredFiles().length }} files</span>
        </div>
      </div>

      <!-- Files Table -->
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
                <tr [class.row-unlocked]="isUnlocked(file.id)">
                  <td class="name-cell">
                    <app-file-icon [type]="file.type" size="sm"></app-file-icon>
                    <div class="name-info">
                      <span class="file-name">{{ file.name }}</span>
                      @if (file.description) {
                        <span class="file-desc">{{ file.description | slice:0:60 }}{{ file.description!.length > 60 ? '...' : '' }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <app-status-badge variant="neutral" size="sm" [showDot]="false">{{ file.type }}</app-status-badge>
                  </td>
                  <td class="size-cell">{{ file.size | fileSize }}</td>
                  <td class="secondary-cell">{{ file.uploadedBy }}</td>
                  <td class="secondary-cell">{{ file.updatedAt | timeAgo }}</td>
                  <td class="actions-cell">
                    <div class="action-btn-group">
                      <button
                        type="button"
                        class="action-icon-btn"
                        (click)="onViewFile(file)"
                        title="View document"
                        aria-label="View document"
                      >
                        <app-icon name="eye" [size]="16"></app-icon>
                        View
                      </button>
                      @if (isAdmin()) {
                        <button
                          type="button"
                          class="action-icon-btn danger"
                          (click)="confirmDelete(file)"
                          title="Delete file"
                          aria-label="Delete file"
                        >
                          <app-icon name="trash" [size]="16"></app-icon>
                        </button>
                      }
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
            (pageChange)="onPageChange($event)"
          ></app-pagination>
        </div>
      } @else {
        <app-empty-state
          icon="folder"
          title="No files found"
          description="No files match your search or filter criteria. Try adjusting your search terms."
        ></app-empty-state>
      }

    </div>

    <!-- Password Modal -->
    <app-file-password-modal
      [isOpen]="showPasswordModal()"
      [file]="selectedFile()"
      (closed)="showPasswordModal.set(false)"
      (unlocked)="onFileUnlocked($event)"
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
      .shared-files-page {
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

      .toolbar-right {
        display: flex;
        align-items: center;
      }

      .search-input-wrap {
        position: relative;

        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--cfh-text-muted);
          pointer-events: none;
        }

        .search-input {
          padding-left: 34px;
          min-width: 220px;
          height: 36px;
        }
      }

      .filter-select {
        height: 36px;
        min-width: 130px;
      }

      .sort-dir-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 36px;
        padding: 0 12px;
        font-family: inherit;
        font-size: 12px;
        font-weight: 600;
        color: var(--cfh-text-secondary);
        background-color: var(--cfh-surface);
        border: 1px solid var(--cfh-border);
        border-radius: var(--cfh-radius-md);
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          background-color: #f3f4f6;
          color: var(--cfh-text-main);
        }
      }

      .file-count {
        font-size: var(--cfh-font-size-secondary);
        color: var(--cfh-text-secondary);
        font-weight: 500;
      }

      .name-cell {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 240px;
      }

      .name-info {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .file-name {
        font-size: 13.5px;
        font-weight: 500;
        color: var(--cfh-text-main);
      }

      .file-desc {
        font-size: 11px;
        color: var(--cfh-text-secondary);
        margin-top: 2px;
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

      .actions-cell {
        min-width: 100px;
      }

      .action-btn-group {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .action-icon-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 5px 10px;
        border: 1px solid var(--cfh-border);
        border-radius: var(--cfh-radius-sm);
        background-color: var(--cfh-surface);
        font-family: inherit;
        font-size: 12px;
        font-weight: 500;
        color: var(--cfh-text-main);
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          background-color: #f3f4f6;
          border-color: var(--cfh-border-dark);
        }

        &.danger {
          color: var(--cfh-error);
          border-color: var(--cfh-error-border);
          padding: 5px 8px;

          &:hover {
            background-color: var(--cfh-error-light);
          }
        }
      }

      .row-unlocked td {
        background-color: #f0fdf4;
      }
    `,
  ],
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

