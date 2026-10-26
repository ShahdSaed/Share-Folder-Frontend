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
  template: `
    <div class="login-page">
      <div class="login-container">

        <!-- Header -->
        <div class="login-header">
          <div class="brand-mark">
            <app-icon name="shield" [size]="22" color="#ffffff"></app-icon>
          </div>
          <p class="product-name">Company File Hub</p>
          <h1 class="welcome-heading">Welcome Back</h1>
          <p class="welcome-subtitle">Sign in to access your company's secure documents.</p>
        </div>

        <!-- Login Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>

          <!-- Email Field -->
          <div class="form-group">
            <label for="email">
              Email Address
              <span class="required-indicator" aria-hidden="true">*</span>
            </label>
            <input
              id="email"
              type="email"
              formControlName="email"
              [class]="'form-control' + (emailInvalid ? ' is-invalid' : '')"
              placeholder="name@company.com"
              autocomplete="email"
              aria-required="true"
              [attr.aria-describedby]="emailInvalid ? 'email-error' : null"
            />
            @if (emailInvalid) {
              <span id="email-error" class="input-error" role="alert">
                <app-icon name="alert-circle" [size]="12"></app-icon>
                {{ emailErrorMessage }}
              </span>
            }
          </div>

          <!-- Password Field -->
          <div class="form-group">
            <label for="password">
              Password
              <span class="required-indicator" aria-hidden="true">*</span>
            </label>
            <div class="input-with-addon">
              <input
                id="password"
                [type]="showPassword ? 'text' : 'password'"
                formControlName="password"
                [class]="'form-control' + (passwordInvalid ? ' is-invalid' : '')"
                placeholder="Enter your password"
                autocomplete="current-password"
                aria-required="true"
                [attr.aria-describedby]="passwordInvalid ? 'password-error' : null"
              />
              <button
                type="button"
                class="input-addon-btn"
                (click)="showPassword = !showPassword"
                [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
              >
                <app-icon [name]="showPassword ? 'eye-off' : 'eye'" [size]="16"></app-icon>
              </button>
            </div>
            @if (passwordInvalid) {
              <span id="password-error" class="input-error" role="alert">
                <app-icon name="alert-circle" [size]="12"></app-icon>
                {{ passwordErrorMessage }}
              </span>
            }
          </div>

          <!-- Remember Me -->
          <div class="remember-row">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="rememberMe" class="checkbox-input" />
              <span class="checkbox-text">Remember me</span>
            </label>
          </div>

          <!-- Error State -->
          @if (loginError) {
            <div class="login-error-msg" role="alert">
              <app-icon name="alert-circle" [size]="16"></app-icon>
              {{ loginError }}
            </div>
          }

          <!-- Submit -->
          <app-button
            type="submit"
            variant="primary"
            size="lg"
            [fullWidth]="true"
            [loading]="isLoading"
            [disabled]="loginForm.invalid || isLoading"
          >
            Sign In
          </app-button>
        </form>

        <!-- Security Note -->
        <div class="security-note">
          <app-icon name="lock" [size]="13"></app-icon>
          <span>Secure access to your company's files.</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .login-page {
        min-height: 100vh;
        background-color: var(--cfh-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px 16px;
      }

      .login-container {
        width: 100%;
        max-width: 420px;
        background-color: var(--cfh-surface);
        border: 1px solid var(--cfh-border);
        border-radius: var(--cfh-radius-xl);
        padding: 36px 32px;
        box-shadow: var(--cfh-shadow-md);
      }

      .login-header {
        text-align: center;
        margin-bottom: 20px;
      }

      .brand-mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        background-color: var(--cfh-primary-navy);
        border-radius: var(--cfh-radius-lg);
        margin-bottom: 14px;
      }

      .product-name {
        font-size: 12px;
        font-weight: 600;
        color: var(--cfh-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-bottom: 8px;
      }

      .welcome-heading {
        font-size: 22px;
        font-weight: 700;
        color: var(--cfh-primary-navy);
        margin-bottom: 6px;
      }

      .welcome-subtitle {
        font-size: var(--cfh-font-size-secondary);
        color: var(--cfh-text-secondary);
        line-height: 1.5;
      }

      .demo-banner {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background-color: var(--cfh-primary-blue-light);
        border: 1px solid var(--cfh-primary-blue-subtle);
        border-radius: var(--cfh-radius-md);
        font-size: var(--cfh-font-size-small);
        color: var(--cfh-primary-blue);
        margin-bottom: 16px;
      }

      .quick-access {
        margin-bottom: 16px;
      }

      .quick-label {
        font-size: var(--cfh-font-size-small);
        font-weight: 500;
        color: var(--cfh-text-secondary);
        margin-bottom: 8px;
      }

      .quick-btn-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .quick-role-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 9px 12px;
        background-color: #f9fafb;
        border: 1px solid var(--cfh-border);
        border-radius: var(--cfh-radius-md);
        font-family: inherit;
        font-size: 13px;
        font-weight: 600;
        color: var(--cfh-primary-navy);
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          background-color: var(--cfh-primary-blue-light);
          border-color: var(--cfh-primary-blue);
          color: var(--cfh-primary-blue);
        }
      }

      .divider-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
      }

      .divider-line {
        flex: 1;
        border: none;
        border-top: 1px solid var(--cfh-border);
      }

      .divider-label {
        font-size: 12px;
        color: var(--cfh-text-muted);
        white-space: nowrap;
      }

      .remember-row {
        margin-bottom: 20px;
      }

      .checkbox-label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }

      .checkbox-input {
        width: 15px;
        height: 15px;
        accent-color: var(--cfh-primary-blue);
        cursor: pointer;
      }

      .checkbox-text {
        font-size: var(--cfh-font-size-secondary);
        color: var(--cfh-text-secondary);
        user-select: none;
      }

      .login-error-msg {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background-color: var(--cfh-error-light);
        border: 1px solid var(--cfh-error-border);
        border-radius: var(--cfh-radius-md);
        font-size: var(--cfh-font-size-secondary);
        color: var(--cfh-error);
        margin-bottom: 16px;
      }

      .security-note {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 12px;
        color: var(--cfh-text-muted);
        margin-top: 20px;
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
          transition: color 0.15s ease;

          &:hover {
            color: var(--cfh-text-main);
          }
        }
      }
    `,
  ],
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
