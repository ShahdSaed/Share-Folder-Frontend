import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileType } from '../../../core/models/file-item.model';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-file-icon',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div [class]="'file-icon-badge type-' + type.toLowerCase() + ' size-' + size" [title]="type + ' Document'">
      <app-icon [name]="iconName" [size]="iconSize" [strokeWidth]="2"></app-icon>
      <span class="file-ext">{{ type }}</span>
    </div>
  `,
  styles: [
    `
      .file-icon-badge {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: var(--cfh-radius-sm);
        font-family: inherit;
        font-weight: 700;
        line-height: 1;
        user-select: none;
        flex-shrink: 0;
      }

      .size-sm {
        width: 34px;
        height: 38px;
        padding: 3px 2px;
        .file-ext {
          font-size: 8px;
          margin-top: 2px;
        }
      }

      .size-md {
        width: 42px;
        height: 48px;
        padding: 4px 3px;
        .file-ext {
          font-size: 9px;
          margin-top: 3px;
        }
      }

      .size-lg {
        width: 56px;
        height: 64px;
        padding: 6px 4px;
        border-radius: var(--cfh-radius-md);
        .file-ext {
          font-size: 11px;
          margin-top: 4px;
        }
      }

      /* Color Themes for File Types */
      .type-pdf {
        background-color: #fee2e2;
        color: #dc2626;
        border: 1px solid #fca5a5;
      }

      .type-docx {
        background-color: #dbeafe;
        color: #2563eb;
        border: 1px solid #bfdbfe;
      }

      .type-xlsx {
        background-color: #dcfce7;
        color: #16a34a;
        border: 1px solid #bbf7d0;
      }

      .type-pptx {
        background-color: #ffedd5;
        color: #ea580c;
        border: 1px solid #fed7aa;
      }

      .type-txt,
      .type-zip {
        background-color: #f3f4f6;
        color: #4b5563;
        border: 1px solid #e5e7eb;
      }
    `,
  ],
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
