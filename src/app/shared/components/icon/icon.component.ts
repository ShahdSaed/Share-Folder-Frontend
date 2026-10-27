import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type IconName =
  | 'folder'
  | 'file'
  | 'file-text'
  | 'lock'
  | 'unlock'
  | 'shield'
  | 'shield-check'
  | 'eye'
  | 'eye-off'
  | 'upload'
  | 'download'
  | 'trash'
  | 'edit'
  | 'plus'
  | 'check'
  | 'alert-circle'
  | 'alert-triangle'
  | 'info'
  | 'x'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'log-out'
  | 'layout-dashboard'
  | 'clock'
  | 'filter'
  | 'arrow-up-down'
  | 'user'
  | 'users'
  | 'calendar'
  | 'refresh-cw'
  | 'external-link'
  | 'zoom-in'
  | 'zoom-out'
  | 'search'
  | 'menu'
  | 'key'
  | 'hard-drive'
  | 'activity'
  | 'check-circle'
  | 'x-circle';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
})
export class IconComponent {
  @Input({ required: true }) name!: IconName;
  @Input() size: number = 18;
  @Input() color?: string;
  @Input() strokeWidth: number = 2;
  @Input() className = '';
}
