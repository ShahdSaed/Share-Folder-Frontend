import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FileService } from '../../core/services/file.service';
import { AuthService } from '../../core/services/auth.service';
import { FileItem } from '../../core/models/file-item.model';
import { FileIconComponent } from '../../shared/components/file-icon/file-icon.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

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
export class DocumentViewerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fileService = inject(FileService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly file = signal<FileItem | null>(null);
  readonly currentPage = signal(1);
  readonly zoomLevel = signal(100);

  readonly baseFontSize = computed(() => 14 * (this.zoomLevel() / 100));

  readonly currentContent = computed(() => {
    const f = this.file();
    if (!f?.sampleContent?.length) return null;
    return f.sampleContent;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/shared-files']);
      return;
    }

    const fileData = this.fileService.getFileById(id);
    if (!fileData || !this.fileService.isFileUnlocked(id)) {
      this.router.navigate(['/shared-files']);
      return;
    }
    this.file.set(fileData);
  }

  prevPage(): void {
    if (this.currentPage() > 1) this.currentPage.update((p) => p - 1);
  }

  nextPage(): void {
    if (this.currentPage() < (this.file()?.pageCount || 1)) this.currentPage.update((p) => p + 1);
  }

  zoomIn(): void {
    if (this.zoomLevel() < 200) this.zoomLevel.update((z) => z + 10);
  }

  zoomOut(): void {
    if (this.zoomLevel() > 50) this.zoomLevel.update((z) => z - 10);
  }
}
