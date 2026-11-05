import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

/**
 * Called once at application bootstrap.
 * Attempts to restore the user session via the refresh token cookie.
 * Always resolves (never rejects) so the app always starts.
 */
export function sessionInitializer(): () => Promise<void> {
  return async () => {
    const authService = inject(AuthService);
    try {
      await firstValueFrom(authService.tryRestoreSession());
    } catch {
      // No active session — continue unauthenticated
    }
  };
}

