import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'navy' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="'btn btn-' + variant + ' btn-' + size + (fullWidth ? ' btn-block' : '') + (loading ? ' is-loading' : '')"
      (click)="onClick($event)"
    >
      @if (loading) {
        <span class="spinner" aria-hidden="true"></span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styles: [
    `
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-family: inherit;
        font-weight: 500;
        border-radius: var(--cfh-radius-md);
        border: 1px solid transparent;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
        text-decoration: none;
        user-select: none;

        &:focus-visible {
          outline: 2px solid var(--cfh-primary-blue);
          outline-offset: 2px;
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .btn-block {
        width: 100%;
      }

      /* Sizes */
      .btn-sm {
        height: var(--cfh-btn-height-sm);
        padding: 0 12px;
        font-size: var(--cfh-font-size-small);
      }

      .btn-md {
        height: var(--cfh-btn-height);
        padding: 0 16px;
        font-size: var(--cfh-font-size-body);
      }

      .btn-lg {
        height: var(--cfh-btn-height-lg);
        padding: 0 20px;
        font-size: 15px;
        font-weight: 600;
      }

      /* Variants */
      .btn-primary {
        background-color: var(--cfh-primary-blue);
        color: #ffffff;
        border-color: var(--cfh-primary-blue);

        &:hover:not(:disabled) {
          background-color: var(--cfh-primary-blue-hover);
          border-color: var(--cfh-primary-blue-hover);
        }
      }

      .btn-navy {
        background-color: var(--cfh-primary-navy);
        color: #ffffff;
        border-color: var(--cfh-primary-navy);

        &:hover:not(:disabled) {
          background-color: var(--cfh-primary-navy-dark);
        }
      }

      .btn-secondary {
        background-color: var(--cfh-surface);
        color: var(--cfh-text-main);
        border-color: var(--cfh-border);

        &:hover:not(:disabled) {
          background-color: #f9fafb;
          border-color: var(--cfh-border-dark);
        }
      }

      .btn-outline {
        background-color: transparent;
        color: var(--cfh-primary-blue);
        border-color: var(--cfh-primary-blue);

        &:hover:not(:disabled) {
          background-color: var(--cfh-primary-blue-light);
        }
      }

      .btn-danger {
        background-color: var(--cfh-error);
        color: #ffffff;
        border-color: var(--cfh-error);

        &:hover:not(:disabled) {
          background-color: var(--cfh-error-hover);
          border-color: var(--cfh-error-hover);
        }
      }

      .btn-ghost {
        background-color: transparent;
        color: var(--cfh-text-secondary);
        border-color: transparent;

        &:hover:not(:disabled) {
          background-color: #f3f4f6;
          color: var(--cfh-text-main);
        }
      }

      .spinner {
        width: 14px;
        height: 14px;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class AppButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;

  @Output() btnClick = new EventEmitter<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.btnClick.emit(event);
    }
  }
}
