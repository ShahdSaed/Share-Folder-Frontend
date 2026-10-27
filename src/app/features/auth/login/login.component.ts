import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
    password: ['', [Validators.required, Validators.minLength(4)]],
    rememberMe: [false],
  });

  showPassword = false;
  isLoading = false;
  loginError = '';

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
    if (this.passwordControl.hasError('minlength')) return 'Password must be at least 4 characters.';
    return '';
  }


  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loginError = '';
    this.isLoading = true;

    const { email, password, rememberMe } = this.loginForm.value as {
      email: string;
      password: string;
      rememberMe: boolean;
    };

    // Simulate brief loading delay for UX demo
    setTimeout(() => {
      const result = this.authService.login(email, password, rememberMe);
      this.isLoading = false;

      if (result.success) {
        this.toastService.success(`Welcome back! Signed in as ${email}`);
        this.router.navigate(['/dashboard']);
      } else {
        this.loginError = result.message || 'Login failed. Please try again.';
      }
    }, 800);
  }
}
