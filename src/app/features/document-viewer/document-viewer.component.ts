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
  template: `
    @if (file()) {
      <div class="viewer-page">
        <!-- Back Navigation + Header -->
        <div class="viewer-topbar">
          <a routerLink="/shared-files" class="back-link">
            <app-icon name="chevron-left" [size]="16"></app-icon>
            Back to Shared Files
          </a>
          <div class="viewer-file-header">
            <app-file-icon [type]="file()!.type" size="md"></app-file-icon>
            <div>
              <h1 class="viewer-filename">{{ file()!.name }}</h1>
              <div class="viewer-meta">
                <span>{{ file()!.type }}</span>
                <span class="dot">·</span>
                <span>{{ file()!.pageCount || 1 }} page{{ (file()!.pageCount || 1) > 1 ? 's' : '' }}</span>
                <span class="dot">·</span>
                <span>Uploaded by {{ file()!.uploadedBy }}</span>
              </div>
            </div>
          </div>
          <app-status-badge variant="success" size="sm">
            <app-icon name="shield-check" [size]="12"></app-icon>
            Verified Access
          </app-status-badge>
        </div>

        <!-- Document Viewer Area -->
        <div class="viewer-layout">
          <!-- Main Content Panel -->
          <div class="viewer-main">
            <!-- Viewer Toolbar -->
            <div class="viewer-controls">
              <div class="controls-left">
                <button type="button" class="ctrl-btn" (click)="prevPage()" [disabled]="currentPage() === 1" aria-label="Previous page">
                  <app-icon name="chevron-left" [size]="16"></app-icon>
                </button>
                <span class="page-indicator">Page {{ currentPage() }} of {{ file()!.pageCount || 1 }}</span>
                <button type="button" class="ctrl-btn" (click)="nextPage()" [disabled]="currentPage() >= (file()!.pageCount || 1)" aria-label="Next page">
                  <app-icon name="chevron-right" [size]="16"></app-icon>
                </button>
              </div>
              <div class="controls-right">
                <button type="button" class="ctrl-btn" (click)="zoomOut()" aria-label="Zoom out">
                  <app-icon name="zoom-out" [size]="16"></app-icon>
                </button>
                <span class="zoom-label">{{ zoomLevel() }}%</span>
                <button type="button" class="ctrl-btn" (click)="zoomIn()" aria-label="Zoom in">
                  <app-icon name="zoom-in" [size]="16"></app-icon>
                </button>
              </div>
            </div>

            <!-- Document Render Area -->
            <div class="document-render-area" [style.fontSize.px]="baseFontSize()">
              <div class="document-page">
                <div class="document-watermark">CONFIDENTIAL</div>
                <div class="document-content">
                  @if (currentContent(); as content) {
                    @for (paragraph of content; track $index) {
                      <p
                        [class]="$index === 0 ? 'doc-heading' : ($index === 1 ? 'doc-subheading' : 'doc-paragraph')"
                      >
                        {{ paragraph }}
                      </p>
                    }
                  } @else {
                    <p class="doc-heading">{{ file()!.name }}</p>
                    <p class="doc-paragraph">Document preview is being prepared. Real-time rendering streams the content securely from the backend service.</p>
                  }
                </div>
                <div class="document-footer">
                  {{ file()!.name }} &mdash; Page {{ currentPage() }} of {{ file()!.pageCount || 1 }} &mdash; CONFIDENTIAL
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar Panel -->
          <div class="viewer-sidebar-panel">
            <div class="info-section">
              <h3 class="info-section-title">Document Details</h3>
              <dl class="info-list">
                <div class="info-row">
                  <dt>File Name</dt>
                  <dd>{{ file()!.name }}</dd>
                </div>
                <div class="info-row">
                  <dt>Type</dt>
                  <dd>{{ file()!.type }}</dd>
                </div>
                <div class="info-row">
                  <dt>Uploaded By</dt>
                  <dd>{{ file()!.uploadedBy }}</dd>
                </div>
                <div class="info-row">
                  <dt>Last Updated</dt>
                  <dd>{{ file()!.updatedAt | date:'mediumDate' }}</dd>
                </div>
                @if (file()!.description) {
                  <div class="info-row">
                    <dt>Description</dt>
                    <dd class="desc-text">{{ file()!.description }}</dd>
                  </div>
                }
              </dl>
            </div>

            <div class="protection-notice">
              <div class="protection-icon">
                <app-icon name="shield" [size]="16"></app-icon>
              </div>
              <p class="protection-text">
                Protected Document. Access, printing, and downloads are audited and logged according to corporate security policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="not-found-state">
        <app-icon name="alert-circle" [size]="40"></app-icon>
        <h2>Document not found or access denied.</h2>
        <p>This file may have been removed or you lack the necessary access.</p>
        <a routerLink="/shared-files" class="back-link">
          Return to Shared Files
        </a>
      </div>
    }
  `,
  styles: [
    `
      .viewer-page {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .viewer-topbar {
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
        background-color: var(--cfh-surface);
        border: 1px solid var(--cfh-border);
        border-radius: var(--cfh-radius-lg);
        padding: 16px 20px;
      }

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: var(--cfh-font-size-secondary);
        font-weight: 500;
        color: var(--cfh-primary-blue);
        text-decoration: none;
        white-space: nowrap;

        &:hover {
          opacity: 0.8;
        }
      }

      .viewer-file-header {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        min-width: 0;
      }

      .viewer-filename {
        font-size: 16px;
        font-weight: 700;
        color: var(--cfh-primary-navy);
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 400px;
      }

      .viewer-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--cfh-text-secondary);
        margin-top: 4px;

        .dot {
          color: var(--cfh-border-dark);
        }
      }

      .viewer-layout {
        display: grid;
        grid-template-columns: 1fr 280px;
        gap: 20px;
        align-items: start;
      }

      .viewer-main {
        background-color: var(--cfh-surface);
        border: 1px solid var(--cfh-border);
        border-radius: var(--cfh-radius-lg);
        overflow: hidden;
      }

      .viewer-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 16px;
        background-color: #f8f9fb;
        border-bottom: 1px solid var(--cfh-border);
      }

      .controls-left,
      .controls-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .ctrl-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        background-color: var(--cfh-surface);
        border: 1px solid var(--cfh-border);
        border-radius: var(--cfh-radius-sm);
        color: var(--cfh-text-secondary);
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover:not(:disabled) {
          background-color: #f3f4f6;
          color: var(--cfh-text-main);
        }

        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      }

      .page-indicator,
      .zoom-label {
        font-size: var(--cfh-font-size-secondary);
        font-weight: 500;
        color: var(--cfh-text-secondary);
        white-space: nowrap;
      }

      .document-render-area {
        padding: 32px;
        min-height: 520px;
        background-color: #f0f2f5;
        display: flex;
        justify-content: center;
      }

      .document-page {
        width: 100%;
        max-width: 680px;
        background-color: var(--cfh-surface);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-radius: 2px;
        padding: 48px 56px;
        position: relative;
        min-height: 480px;
        display: flex;
        flex-direction: column;
      }

      .document-watermark {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-30deg);
        font-size: 60px;
        font-weight: 900;
        color: rgba(0, 0, 0, 0.04);
        letter-spacing: 0.06em;
        pointer-events: none;
        user-select: none;
        white-space: nowrap;
        z-index: 0;
      }

      .document-content {
        position: relative;
        z-index: 1;
        flex: 1;
      }

      .doc-heading {
        font-size: 1.2em;
        font-weight: 700;
        color: var(--cfh-primary-navy);
        margin-bottom: 8px;
        letter-spacing: -0.01em;
        border-bottom: 1px solid var(--cfh-border);
        padding-bottom: 10px;
        margin-bottom: 16px;
      }

      .doc-subheading {
        font-size: 1em;
        font-weight: 600;
        color: var(--cfh-text-main);
        margin-bottom: 10px;
        margin-top: 14px;
      }

      .doc-paragraph {
        font-size: 0.875em;
        color: var(--cfh-text-main);
        line-height: 1.75;
        margin-bottom: 10px;
        text-align: justify;
      }

      .document-footer {
        position: relative;
        z-index: 1;
        font-size: 10px;
        color: var(--cfh-text-muted);
        border-top: 1px solid var(--cfh-border);
        padding-top: 12px;
        margin-top: 24px;
        text-align: center;
      }

      .viewer-sidebar-panel {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .info-section {
        background-color: var(--cfh-surface);
        border: 1px solid var(--cfh-border);
        border-radius: var(--cfh-radius-lg);
        padding: 18px;
      }

      .info-section-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--cfh-primary-navy);
        margin-bottom: 14px;
      }

      .info-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .info-row {
        display: flex;
        flex-direction: column;
        gap: 2px;

        dt {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--cfh-text-secondary);
        }

        dd {
          font-size: 13px;
          color: var(--cfh-text-main);
          font-weight: 500;
        }

        .desc-text {
          font-size: 12px;
          font-weight: 400;
          color: var(--cfh-text-secondary);
          line-height: 1.5;
        }
      }

      .protection-notice {
        display: flex;
        gap: 10px;
        background-color: var(--cfh-warning-light);
        border: 1px solid var(--cfh-warning-border);
        border-radius: var(--cfh-radius-md);
        padding: 12px 14px;

        .protection-icon {
          color: var(--cfh-warning);
          flex-shrink: 0;
          margin-top: 1px;
        }

        .protection-text {
          font-size: 12px;
          color: #92400e;
          line-height: 1.5;
        }
      }

      .not-found-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 80px 24px;
        text-align: center;
        color: var(--cfh-text-secondary);

        h2 {
          font-size: 20px;
          color: var(--cfh-primary-navy);
        }
      }

      @media (max-width: 1024px) {
        .viewer-layout {
          grid-template-columns: 1fr;
        }

        .document-page {
          padding: 32px;
        }
      }
    `,
  ],
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

