import { Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    @if (totalItems > 0) {
      <div class="pagination-container">
        <div class="pagination-info">
          Showing <span class="highlight">{{ startIndex }}</span> to
          <span class="highlight">{{ endIndex }}</span> of
          <span class="highlight">{{ totalItems }}</span> items
        </div>

        @if (totalPages > 1) {
          <div class="pagination-controls">
            <button
              type="button"
              class="page-btn nav-btn"
              [disabled]="currentPage === 1"
              (click)="goToPage(currentPage - 1)"
              aria-label="Previous page"
            >
              <app-icon name="chevron-left" [size]="16"></app-icon>
            </button>

            @for (page of pages; track page) {
              <button
                type="button"
                [class]="'page-btn' + (page === currentPage ? ' active' : '')"
                (click)="goToPage(page)"
              >
                {{ page }}
              </button>
            }

            <button
              type="button"
              class="page-btn nav-btn"
              [disabled]="currentPage === totalPages"
              (click)="goToPage(currentPage + 1)"
              aria-label="Next page"
            >
              <app-icon name="chevron-right" [size]="16"></app-icon>
            </button>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      .pagination-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background-color: var(--cfh-surface);
        border-top: 1px solid var(--cfh-border);
        font-size: var(--cfh-font-size-secondary);
        color: var(--cfh-text-secondary);
        flex-wrap: wrap;
        gap: 12px;
      }

      .pagination-info {
        .highlight {
          color: var(--cfh-text-main);
          font-weight: 600;
        }
      }

      .pagination-controls {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .page-btn {
        min-width: 32px;
        height: 32px;
        padding: 0 6px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-family: inherit;
        font-size: var(--cfh-font-size-secondary);
        font-weight: 500;
        color: var(--cfh-text-main);
        background-color: var(--cfh-surface);
        border: 1px solid var(--cfh-border);
        border-radius: var(--cfh-radius-sm);
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover:not(:disabled):not(.active) {
          background-color: #f3f4f6;
          border-color: var(--cfh-border-dark);
        }

        &.active {
          background-color: var(--cfh-primary-blue);
          color: #ffffff;
          border-color: var(--cfh-primary-blue);
          font-weight: 600;
        }

        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      }

      .nav-btn {
        color: var(--cfh-text-secondary);
      }
    `,
  ],
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 10;

  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  get startIndex(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get pages(): number[] {
    const list: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      list.push(i);
    }
    return list;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}
