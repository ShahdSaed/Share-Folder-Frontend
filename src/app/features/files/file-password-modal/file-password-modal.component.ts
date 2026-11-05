import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
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
  templateUrl: './file-password-modal.component.html',
  styleUrl: './file-password-modal.component.scss',
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

    this.fileService.verifyPassword(this.file.id, password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastService.success(`${this.file!.name} unlocked successfully.`, 'File Opened');
        this.unlocked.emit(this.file!.id);
        this.reset();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          this.errorMessage.set('Incorrect password. Please try again.');
        } else if (err.status === 429) {
          this.errorMessage.set('Too many failed attempts. Please wait 15 minutes before trying again.');
        } else if (err.status === 403) {
          this.errorMessage.set('You do not have access to this file.');
        } else if (err.status === 0) {
          this.errorMessage.set('Cannot connect to server. Please check your connection.');
        } else {
          this.errorMessage.set(err.error?.message ?? 'Incorrect password. Please try again.');
        }
      },
    });
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
