import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileType } from '../../../core/models/file-item.model';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-file-icon',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './file-icon.component.html',
  styleUrl: './file-icon.component.scss',
})
export class FileIconComponent {
  @Input({ required: true }) type!: FileType | string;
  @Input() size: 'sm' | 'md' | 'lg' = 'sm';

  get iconName(): 'file-text' | 'file' {
    return 'file-text';
  }

  get iconSize(): number {
    switch (this.size) {
      case 'sm':
        return 16;
      case 'md':
        return 20;
      case 'lg':
        return 28;
    }
  }
}
