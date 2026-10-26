import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';
import { IconComponent, IconName } from '../icon/icon.component';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div [class]="'toast toast-' + toast.type" role="alert">
          <div class="toast-icon">
            <app-icon [name]="getIcon(toast.type)" [size]="18"></app-icon>
          </div>
          <div class="toast-content">
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button
            type="button"
            class="toast-dismiss"
            (click)="dismiss(toast.id)"
            aria-label="Dismiss notification"
          >
            <app-icon name="x" [size]="14"></app-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 420px;
        pointer-events: none;
      }

      .toast {
        pointer-events: auto;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 16px;
        background-color: var(--cfh-surface);
        border: 1px solid var(--cfh-border);
        border-radius: var(--cfh-radius-lg);
        box-shadow: var(--cfh-shadow-lg);
        animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .toast-icon {
        flex-shrink: 0;
        margin-top: 1px;
      }

      .toast-content {
        flex: 1;
      }

      .toast-title {
        font-size: var(--cfh-font-size-body);
        font-weight: 600;
        color: var(--cfh-text-main);
        margin-bottom: 2px;
      }

      .toast-message {
        font-size: var(--cfh-font-size-secondary);
        color: var(--cfh-text-secondary);
        line-height: 1.4;
      }

      .toast-dismiss {
        background: none;
        border: none;
        color: var(--cfh-text-muted);
        cursor: pointer;
        padding: 2px;
        border-radius: var(--cfh-radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.15s ease;

        &:hover {
          color: var(--cfh-text-main);
        }
      }

      /* Types */
      .toast-success {
        border-left: 4px solid var(--cfh-success);
        .toast-icon {
          color: var(--cfh-success);
        }
      }

      .toast-error {
        border-left: 4px solid var(--cfh-error);
        .toast-icon {
          color: var(--cfh-error);
        }
      }

      .toast-warning {
        border-left: 4px solid var(--cfh-warning);
        .toast-icon {
          color: var(--cfh-warning);
        }
      }

      .toast-info {
        border-left: 4px solid var(--cfh-primary-blue);
        .toast-icon {
          color: var(--cfh-primary-blue);
        }
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);

  getIcon(type: string): IconName {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert-triangle';
      default:
        return 'info';
    }
  }

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
