import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './summary-card.component.html',
  styleUrl: './summary-card.component.scss',
})
export class SummaryCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number;
  @Input({ required: true }) icon!: IconName;
  @Input() trend?: string;
  @Input() theme: 'blue' | 'navy' | 'green' | 'amber' | 'red' = 'blue';
}
