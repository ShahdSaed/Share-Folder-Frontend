import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { AppButtonComponent, ButtonVariant } from '../app-button/app-button.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent, AppButtonComponent, IconComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      [title]="title"
      size="sm"
      (closed)="onCancel()"
    >
      <div class="confirm-content">
        @if (isDanger) {
          <div class="confirm-icon danger">
            <app-icon name="alert-triangle" [size]="24"></app-icon>
          </div>
        }
        <div class="confirm-text">
          <p class="confirm-message">{{ message }}</p>
          @if (submessage) {
            <p class="confirm-submessage">{{ submessage }}</p>
          }
        </div>
      </div>

      <div modal-footer class="confirm-actions">
        <app-button variant="secondary" (btnClick)="onCancel()" [disabled]="loading">
          {{ cancelText }}
        </app-button>
        <app-button
          [variant]="isDanger ? 'danger' : 'primary'"
          [loading]="loading"
          (btnClick)="onConfirm()"
        >
          {{ confirmText }}
        </app-button>
      </div>
    </app-modal>
  `,
  styles: [
    `
      .confirm-content {
        display: flex;
        gap: 16px;
        align-items: flex-start;
      }

      .confirm-icon {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        border-radius: var(--cfh-radius-md);
        display: flex;
        align-items: center;
        justify-content: center;

        &.danger {
          background-color: var(--cfh-error-light);
          color: var(--cfh-error);
          border: 1px solid var(--cfh-error-border);
        }
      }

      .confirm-text {
        flex: 1;
      }

      .confirm-message {
        font-size: var(--cfh-font-size-body);
        color: var(--cfh-text-main);
        font-weight: 500;
        line-height: 1.4;
      }

      .confirm-submessage {
        font-size: var(--cfh-font-size-secondary);
        color: var(--cfh-text-secondary);
        margin-top: 6px;
        line-height: 1.4;
      }

      .confirm-actions {
        display: flex;
        gap: 10px;
      }
    `,
  ],
})
export class ConfirmationDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() submessage?: string;
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() isDanger = true;
  @Input() loading = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
