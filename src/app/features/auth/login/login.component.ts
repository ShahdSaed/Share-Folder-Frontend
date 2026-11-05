import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppButtonComponent, IconComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
  });

  readonly showPassword = signal(false);
  readonly isLoading = signal(false);
  readonly loginError = signal('');

  get emailControl() {
    return this.loginForm.get('email')!;
  }
  get passwordControl() {
    return this.loginForm.get('password')!;
  }

  get emailInvalid(): boolean {
    return this.emailControl.invalid && (this.emailControl.dirty || this.emailControl.touched);
  }

  get passwordInvalid(): boolean {
    return this.passwordControl.invalid && (this.passwordControl.dirty || this.passwordControl.touched);
  }

  get emailErrorMessage(): string {
    if (this.emailControl.hasError('required')) return 'Email address is required.';
    if (this.emailControl.hasError('email')) return 'Please enter a valid email address.';
    return '';
  }

  get passwordErrorMessage(): string {
    if (this.passwordControl.hasError('required')) return 'Password is required.';
    if (this.passwordControl.hasError('minlength')) return 'Password must be at least 8 characters.';
    return '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loginError.set('');
    this.isLoading.set(true);

    const { email, password } = this.loginForm.value as {
      email: string;
      password: string;
      rememberMe: boolean;
    };

    this.authService.login(email, password).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        this.toastService.success(`Welcome back, ${user.fullName}!`);
        // Admins go to Dashboard, Viewers go directly to Shared Files
        if (user.role === 'ADMIN') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/shared-files']);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          this.loginError.set('Invalid email or password. Please try again.');
        } else if (err.status === 400) {
          this.loginError.set(err.error?.message ?? 'Invalid request. Please check your input.');
        } else if (err.status === 429) {
          this.loginError.set('Too many login attempts. Please wait before trying again.');
        } else if (err.status === 0) {
          this.loginError.set('Cannot reach the server. Please check your connection.');
        } else {
          this.loginError.set('Login failed. Please try again.');
        }
      },
    });
  }
}
