import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="summary-card">
      <div class="card-header-row">
        <span class="card-label">{{ label }}</span>
        <div [class]="'icon-box theme-' + theme">
          <app-icon [name]="icon" [size]="18"></app-icon>
        </div>
      </div>
      <div class="card-value">{{ value }}</div>
      @if (trend) {
        <div class="card-trend">
          <span class="trend-text">{{ trend }}</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .summary-card {
        background-color: var(--cfh-surface);
        border: 1px solid var(--cfh-border);
        border-radius: var(--cfh-radius-lg);
        padding: 20px;
        box-shadow: var(--cfh-shadow-xs);
        display: flex;
        flex-direction: column;
        transition: box-shadow 0.15s ease, border-color 0.15s ease;

        &:hover {
          border-color: var(--cfh-border-dark);
          box-shadow: var(--cfh-shadow-sm);
        }
      }

      .card-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .card-label {
        font-size: var(--cfh-font-size-label);
        font-weight: 500;
        color: var(--cfh-text-secondary);
      }

      .icon-box {
        width: 34px;
        height: 34px;
        border-radius: var(--cfh-radius-md);
        display: flex;
        align-items: center;
        justify-content: center;

        &.theme-blue {
          background-color: var(--cfh-primary-blue-light);
          color: var(--cfh-primary-blue);
        }

        &.theme-navy {
          background-color: var(--cfh-primary-navy-subtle);
          color: var(--cfh-primary-navy);
        }

        &.theme-green {
          background-color: var(--cfh-success-light);
          color: var(--cfh-success);
        }

        &.theme-amber {
          background-color: var(--cfh-warning-light);
          color: var(--cfh-warning);
        }

        &.theme-red {
          background-color: var(--cfh-error-light);
          color: var(--cfh-error);
        }
      }

      .card-value {
        font-size: 26px;
        font-weight: 700;
        color: var(--cfh-primary-navy);
        line-height: 1.1;
        letter-spacing: -0.02em;
        margin-bottom: 6px;
      }

      .card-trend {
        font-size: var(--cfh-font-size-small);
        color: var(--cfh-text-secondary);
        display: flex;
        align-items: center;
        gap: 4px;
      }
    `,
  ],
})
export class SummaryCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number;
  @Input({ required: true }) icon!: IconName;
  @Input() trend?: string;
  @Input() theme: 'blue' | 'navy' | 'green' | 'amber' | 'red' = 'blue';
}
