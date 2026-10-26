import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { AppButtonComponent } from '../app-button/app-button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, IconComponent, AppButtonComponent],
  template: `
    <div class="empty-state-card">
      <div class="empty-icon-wrapper">
        <app-icon [name]="icon" [size]="32" [strokeWidth]="1.5"></app-icon>
      </div>
      <h4 class="empty-title">{{ title }}</h4>
      <p class="empty-description">{{ description }}</p>
      @if (actionLabel) {
        <div class="empty-action">
          <app-button variant="primary" size="sm" (btnClick)="onAction()">
            {{ actionLabel }}
          </app-button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .empty-state-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 48px 24px;
        background-color: var(--cfh-surface);
        border-radius: var(--cfh-radius-lg);
      }

      .empty-icon-wrapper {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background-color: #f3f4f6;
        color: var(--cfh-text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
      }

      .empty-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--cfh-primary-navy);
        margin-bottom: 6px;
      }

      .empty-description {
        font-size: var(--cfh-font-size-secondary);
        color: var(--cfh-text-secondary);
        max-width: 360px;
        line-height: 1.5;
        margin-bottom: 16px;
      }

      .empty-action {
        margin-top: 8px;
      }
    `,
  ],
})
export class EmptyStateComponent {
  @Input() icon: IconName = 'folder';
  @Input() title = 'No items found';
  @Input() description = 'There are no records matching your current filter criteria.';
  @Input() actionLabel?: string;

  @Output() actionClicked = new EventEmitter<void>();

  onAction(): void {
    this.actionClicked.emit();
  }
}
