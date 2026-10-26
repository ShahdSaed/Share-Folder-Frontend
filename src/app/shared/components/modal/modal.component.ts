import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    @if (isOpen) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <div
          class="modal-dialog modal-{{ size }}"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-header">
            <div class="modal-title-wrap">
              <h3 class="modal-title">{{ title }}</h3>
              @if (subtitle) {
                <p class="modal-subtitle">{{ subtitle }}</p>
              }
            </div>
            @if (showClose) {
              <button
                type="button"
                class="modal-close-btn"
                (click)="close()"
                aria-label="Close dialog"
              >
                <app-icon name="x" [size]="18"></app-icon>
              </button>
            }
          </div>

          <div class="modal-body">
            <ng-content></ng-content>
          </div>

          <div class="modal-footer">
            <ng-content select="[modal-footer]"></ng-content>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background-color: rgba(15, 29, 50, 0.45);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        animation: fadeIn 0.15s ease-out;
      }

      .modal-dialog {
        background-color: var(--cfh-surface);
        border: 1px solid var(--cfh-border);
        border-radius: var(--cfh-radius-xl);
        box-shadow: var(--cfh-shadow-lg);
        width: 100%;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: scaleIn 0.15s ease-out;
      }

      .modal-sm {
        max-width: 400px;
      }

      .modal-md {
        max-width: 520px;
      }

      .modal-lg {
        max-width: 680px;
      }

      .modal-xl {
        max-width: 840px;
      }

      .modal-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid var(--cfh-border);
      }

      .modal-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--cfh-primary-navy);
      }

      .modal-subtitle {
        font-size: var(--cfh-font-size-secondary);
        color: var(--cfh-text-secondary);
        margin-top: 4px;
      }

      .modal-close-btn {
        background: none;
        border: none;
        color: var(--cfh-text-secondary);
        cursor: pointer;
        padding: 4px;
        border-radius: var(--cfh-radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;

        &:hover {
          background-color: #f3f4f6;
          color: var(--cfh-text-main);
        }
      }

      .modal-body {
        padding: 24px;
        overflow-y: auto;
      }

      .modal-footer {
        padding: 16px 24px;
        border-top: 1px solid var(--cfh-border);
        background-color: #fafbfc;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;

        &:empty {
          display: none;
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.97);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `,
  ],
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() size: ModalSize = 'md';
  @Input() showClose = true;
  @Input() closeOnBackdrop = true;

  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop) {
      this.close();
    }
  }

  close(): void {
    this.closed.emit();
  }
}
