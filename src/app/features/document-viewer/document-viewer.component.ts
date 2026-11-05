import { Component, OnInit, OnDestroy, HostListener, computed, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import JSZip from 'jszip';
import { FileService } from '../../core/services/file.service';
import { AuthService } from '../../core/services/auth.service';
import { FileItem } from '../../core/models/file-item.model';
import { FileIconComponent } from '../../shared/components/file-icon/file-icon.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

export interface FolderFileItem {
  name: string;
  relativePath: string;
  size: number;
  type: string;
  extension: string;
  zipObject: JSZip.JSZipObject;
}

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FileIconComponent,
    StatusBadgeComponent,
    IconComponent,
    DatePipe,
  ],
  templateUrl: './document-viewer.component.html',
  styleUrl: './document-viewer.component.scss',
})
export class DocumentViewerComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly fileService = inject(FileService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly file = signal<FileItem | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly blobUrl = signal<SafeResourceUrl | null>(null);

  readonly isViewer = this.authService.isViewer;
  readonly currentUser = this.authService.currentUser;
  readonly isWindowBlurred = signal(false);
  readonly isScreenshotAttempted = signal(false);
  readonly isMouseOutside = signal(false);
  readonly isIdle = signal(false);
  readonly watermarkItems = Array(28).fill(0);

  private idleTimer: any = null;

  readonly isObscured = computed(
    () => this.isViewer() && (this.isWindowBlurred() || this.isScreenshotAttempted() || this.isMouseOutside() || this.isIdle())
  );

  // Keep these for template compatibility
  readonly currentPage = signal(1);
  readonly zoomLevel = signal(100);
  readonly baseFontSize = computed(() => 14 * (this.zoomLevel() / 100));
  readonly currentContent = computed(() => {
    const f = this.file();
    if (!f?.sampleContent?.length) return null;
    return f.sampleContent;
  });

  // Folder & ZIP state
  readonly isFolder = signal(false);
  readonly folderFiles = signal<FolderFileItem[]>([]);
  readonly folderSearch = signal('');
  readonly filteredFolderFiles = computed(() => {
    const q = this.folderSearch().toLowerCase().trim();
    const files = this.folderFiles();
    if (!q) return files;
    return files.filter((f) => f.name.toLowerCase().includes(q) || f.relativePath.toLowerCase().includes(q));
  });
  readonly activeFolderFile = signal<FolderFileItem | null>(null);
  readonly activeFileBlobUrl = signal<SafeResourceUrl | null>(null);
  readonly activeFileText = signal<string | null>(null);
  readonly activeFileType = signal<'pdf' | 'image' | 'text' | 'unsupported'>('unsupported');
  readonly isLoadingFolderFile = signal(false);

  private rawBlobUrl: string | null = null;
  private rawActiveBlobUrl: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/shared-files']);
      return;
    }

    // Check if the file is unlocked (viewers only; admins bypass password verification)
    if (!this.authService.isAdmin() && !this.fileService.isFileUnlocked(id)) {
      this.router.navigate(['/shared-files']);
      return;
    }

    // Fetch metadata first
    const cached = this.fileService.getFileById(id);
    if (cached) {
      this.file.set(cached);
    }

    this.loadContent(id);
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (this.isViewer()) {
      const hidden = document.visibilityState === 'hidden';
      this.isWindowBlurred.set(hidden);
      this.cdr.detectChanges();
    }
  }

  @HostListener('window:blur')
  onWindowBlur(): void {
    if (this.isViewer()) {
      this.isWindowBlurred.set(true);
      this.cdr.detectChanges();
    }
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    if (this.isViewer()) {
      this.isWindowBlurred.set(false);
      this.cdr.detectChanges();
    }
  }

  onMouseLeaveArea(): void {
    if (this.isViewer()) {
      this.isMouseOutside.set(true);
      clearTimeout(this.idleTimer);
      this.cdr.detectChanges();
    }
  }

  onMouseEnterArea(): void {
    if (this.isViewer()) {
      this.isMouseOutside.set(false);
      this.resetIdleTimer();
      this.cdr.detectChanges();
    }
  }

  onMouseMoveArea(): void {
    this.resetIdleTimer();
  }

  resetIdleTimer(): void {
    if (!this.isViewer()) return;

    if (this.isIdle()) {
      this.isIdle.set(false);
      this.cdr.detectChanges();
    }

    clearTimeout(this.idleTimer);
    // Auto-blur after 4 seconds of stillness so a user cannot freeze screen for a screenshot
    this.idleTimer = setTimeout(() => {
      this.isIdle.set(true);
      this.cdr.detectChanges();
    }, 4500);
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'PrintScreen') {
      this.handleScreenshotAttempt();
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Intercept PrintScreen
    if (event.key === 'PrintScreen') {
      event.preventDefault();
      event.stopPropagation();
      this.handleScreenshotAttempt();
      return;
    }

    // Prevent Ctrl+S (Save), Ctrl+P (Print), Ctrl+C (Copy), Ctrl+Shift+S (Snipping)
    if ((event.ctrlKey || event.metaKey) && ['s', 'p', 'c', 'S', 'P', 'C'].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  private handleScreenshotAttempt(): void {
    if (!this.isViewer()) return;

    // Immediately overwrite clipboard buffer to wipe any screen grab
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText('Protected document: Screen captures are prohibited.');
      }
    } catch {
      // Ignore clipboard permission issues if any
    }

    this.isScreenshotAttempted.set(true);
    this.cdr.detectChanges();
    setTimeout(() => {
      this.isScreenshotAttempted.set(false);
      this.cdr.detectChanges();
    }, 3000);
  }

  private loadContent(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.fileService.downloadFileContent(id).subscribe({
      next: async (blob) => {
        // Also refresh file metadata if not cached
        if (!this.file()) {
          this.fileService.fetchFileById(id).subscribe({
            next: (fileItem) => this.file.set(fileItem),
          });
        }

        // Check if file is a ZIP or folder archive
        const currentFile = this.file();
        const isZip =
          currentFile?.type === 'ZIP' ||
          (currentFile?.name && currentFile.name.toLowerCase().endsWith('.zip')) ||
          blob.type.includes('zip');

        if (isZip) {
          try {
            const zip = await JSZip.loadAsync(blob);
            const entries: FolderFileItem[] = [];
            zip.forEach((relativePath, fileObj) => {
              if (!fileObj.dir) {
                const name = relativePath.split('/').pop() || relativePath;
                if (!relativePath.includes('__MACOSX') && !name.startsWith('.')) {
                  const ext = name.split('.').pop()?.toLowerCase() || '';
                  entries.push({
                    name,
                    relativePath,
                    size: (fileObj as any)._data?.uncompressedSize || 0,
                    type: this.guessExtensionType(ext),
                    extension: ext.toUpperCase(),
                    zipObject: fileObj,
                  });
                }
              }
            });
            this.folderFiles.set(entries);
            this.isFolder.set(true);
            this.isLoading.set(false);
            this.cdr.detectChanges();
            return;
          } catch (zipErr) {
            console.warn('Could not parse as ZIP archive; rendering as standard file', zipErr);
          }
        }

        this.isLoading.set(false);
        const url = URL.createObjectURL(blob);
        this.rawBlobUrl = url;
        // Suppress browser PDF toolbar, download, save, and print actions
        const viewerUrl = `${url}#toolbar=0&navpanes=0`;
        this.blobUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl));
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 403) {
          this.errorMessage.set('Access denied. Your unlock token may have expired.');
        } else if (err.status === 404) {
          this.errorMessage.set('File not found.');
        } else if (err.status === 0) {
          this.errorMessage.set('Cannot connect to server.');
        } else {
          this.errorMessage.set('Failed to load file content.');
        }
      },
    });
  }

  async openFolderFile(item: FolderFileItem): Promise<void> {
    this.isLoadingFolderFile.set(true);
    this.activeFolderFile.set(item);
    if (this.rawActiveBlobUrl) {
      URL.revokeObjectURL(this.rawActiveBlobUrl);
      this.rawActiveBlobUrl = null;
    }
    this.activeFileBlobUrl.set(null);
    this.activeFileText.set(null);

    const ext = item.extension.toLowerCase();
    try {
      if (ext === 'pdf') {
        const fileBlob = await item.zipObject.async('blob');
        const pdfBlob = new Blob([fileBlob], { type: 'application/pdf' });
        const url = URL.createObjectURL(pdfBlob);
        this.rawActiveBlobUrl = url;
        this.activeFileBlobUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(`${url}#toolbar=0&navpanes=0`));
        this.activeFileType.set('pdf');
      } else if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
        const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        const fileBlob = await item.zipObject.async('blob');
        const imgBlob = new Blob([fileBlob], { type: mime });
        const url = URL.createObjectURL(imgBlob);
        this.rawActiveBlobUrl = url;
        this.activeFileBlobUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        this.activeFileType.set('image');
      } else if (['txt', 'csv', 'json', 'log', 'md', 'xml', 'html'].includes(ext)) {
        const text = await item.zipObject.async('text');
        this.activeFileText.set(text);
        this.activeFileType.set('text');
      } else {
        this.activeFileType.set('unsupported');
      }
    } catch (err) {
      console.error('Failed to unpack folder file', err);
    } finally {
      this.isLoadingFolderFile.set(false);
      this.resetIdleTimer();
      this.cdr.detectChanges();
    }
  }

  closeFolderFilePreview(): void {
    if (this.rawActiveBlobUrl) {
      URL.revokeObjectURL(this.rawActiveBlobUrl);
      this.rawActiveBlobUrl = null;
    }
    this.activeFolderFile.set(null);
    this.activeFileBlobUrl.set(null);
    this.activeFileText.set(null);
    this.cdr.detectChanges();
  }

  onFolderSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value || '';
    this.folderSearch.set(val);
  }

  private guessExtensionType(ext: string): string {
    switch (ext.toLowerCase()) {
      case 'pdf': return 'PDF';
      case 'doc':
      case 'docx': return 'DOCX';
      case 'xls':
      case 'xlsx': return 'XLSX';
      case 'ppt':
      case 'pptx': return 'PPTX';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp': return 'IMAGE';
      case 'txt':
      case 'csv':
      case 'json': return 'TXT';
      default: return ext.toUpperCase() || 'FILE';
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.idleTimer);
    if (this.rawBlobUrl) {
      URL.revokeObjectURL(this.rawBlobUrl);
    }
    if (this.rawActiveBlobUrl) {
      URL.revokeObjectURL(this.rawActiveBlobUrl);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) this.currentPage.update((p) => p - 1);
  }

  nextPage(): void {
    const max = this.file()?.pageCount ?? 1;
    if (this.currentPage() < max) this.currentPage.update((p) => p + 1);
  }

  zoomIn(): void {
    if (this.zoomLevel() < 200) this.zoomLevel.update((z) => z + 10);
  }

  zoomOut(): void {
    if (this.zoomLevel() > 50) this.zoomLevel.update((z) => z - 10);
  }
}
