import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FileItem } from '../../../core/models/file-item.model';
import { FileService } from '../../../core/services/file.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-file-password-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, AppButtonComponent, IconComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      title="Protected File"
      size="sm"
      (closed)="onCancel()"
    >
      @if (file) {
        <div class="password-modal-body">
          <div class="file-lock-header">
            <div class="lock-icon-wrap">
              <app-icon name="lock" [size]="22"></app-icon>
            </div>
            <div class="file-info">
              <p class="file-modal-name">{{ file.name }}</p>
              <p class="file-modal-hint">Enter the password to access this document.</p>
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <div class="form-group">
              <label for="doc-password">Document Password</label>
              <div class="input-with-addon">
                <input
                  id="doc-password"
                  [type]="showPw ? 'text' : 'password'"
                  formControlName="password"
                  class="form-control"
                  placeholder="Enter document password"
                  autocomplete="off"
                  aria-required="true"
                />
                <button
                  type="button"
                  class="input-addon-btn"
                  (click)="showPw = !showPw"
                  [attr.aria-label]="showPw ? 'Hide password' : 'Show password'"
                >
                  <app-icon [name]="showPw ? 'eye-off' : 'eye'" [size]="16"></app-icon>
                </button>
              </div>
            </div>

            @if (errorMessage()) {
              <div class="pw-error-msg" role="alert">
                <app-icon name="alert-circle" [size]="14"></app-icon>
                {{ errorMessage() }}
              </div>
            }

            <div class="security-info-box">
              <app-icon name="shield" [size]="13"></app-icon>
              <span>This document is protected with end-to-end AES-256 encryption.</span>
            </div>
          </form>
        </div>
      }

      <div modal-footer>
        <app-button variant="secondary" (btnClick)="onCancel()">Cancel</app-button>
        <app-button
          variant="primary"
          [loading]="isLoading()"
          [disabled]="form.invalid || isLoading()"
          (btnClick)="onSubmit()"
        >
          Open File
        </app-button>
      </div>
    </app-modal>
  `,
  styles: [
    `
      .file-lock-header {
        display: flex;
        gap: 14px;
        align-items: flex-start;
        margin-bottom: 20px;
      }

      .lock-icon-wrap {
        width: 44px;
        height: 44px;
        border-radius: var(--cfh-radius-md);
        background-color: var(--cfh-primary-blue-light);
        color: var(--cfh-primary-blue);
        border: 1px solid var(--cfh-primary-blue-subtle);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .file-modal-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--cfh-primary-navy);
        margin-bottom: 4px;
        word-break: break-word;
      }

      .file-modal-hint {
        font-size: var(--cfh-font-size-secondary);
        color: var(--cfh-text-secondary);
      }

      .pw-error-msg {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background-color: var(--cfh-error-light);
        border: 1px solid var(--cfh-error-border);
        border-radius: var(--cfh-radius-md);
        font-size: var(--cfh-font-size-secondary);
        color: var(--cfh-error);
        margin-bottom: 14px;
      }

      .security-info-box {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        color: var(--cfh-text-secondary);
        background-color: #f8fafc;
        border: 1px solid var(--cfh-border);
        border-radius: var(--cfh-radius-sm);
        padding: 8px 12px;
        margin-top: 10px;
      }

      .input-with-addon {
        position: relative;

        .form-control {
          padding-right: 42px;
        }

        .input-addon-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--cfh-text-secondary);
          cursor: pointer;
          padding: 4px;
          border-radius: var(--cfh-radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;

          &:hover {
            color: var(--cfh-text-main);
          }
        }
      }
    `,
  ],
})
export class FilePasswordModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly fileService = inject(FileService);
  private readonly toastService = inject(ToastService);

  @Input() isOpen = false;
  @Input() file: FileItem | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() unlocked = new EventEmitter<string>(); // emits file ID

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  showPw = false;

  form: FormGroup = this.fb.group({
    password: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid || !this.file) return;
    this.errorMessage.set('');
    this.isLoading.set(true);

    const password: string = this.form.value.password as string;

    setTimeout(() => {
      const result = this.fileService.verifyPassword(this.file!.id, password);
      this.isLoading.set(false);

      if (result.success) {
        this.toastService.success(`${this.file!.name} unlocked successfully.`, 'File Opened');
        this.unlocked.emit(this.file!.id);
        this.reset();
      } else {
        this.errorMessage.set(result.message || 'Incorrect password. Please try again.');
      }
    }, 600);
  }

  onCancel(): void {
    this.reset();
    this.closed.emit();
  }

  private reset(): void {
    this.form.reset();
    this.showPw = false;
    this.errorMessage.set('');
    this.isLoading.set(false);
  }
}
