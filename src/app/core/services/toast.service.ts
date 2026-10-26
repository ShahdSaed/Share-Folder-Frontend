import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly toastsSignal = signal<ToastMessage[]>([]);
  public readonly toasts = this.toastsSignal.asReadonly();

  public show(message: string, type: ToastType = 'info', title?: string, durationMs = 4000): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastMessage = { id, type, message, title };

    this.toastsSignal.update((current) => [...current, newToast]);

    if (durationMs > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, durationMs);
    }
  }

  public success(message: string, title = 'Success'): void {
    this.show(message, 'success', title);
  }

  public error(message: string, title = 'Error'): void {
    this.show(message, 'error', title);
  }

  public info(message: string, title = 'Information'): void {
    this.show(message, 'info', title);
  }

  public warning(message: string, title = 'Warning'): void {
    this.show(message, 'warning', title);
  }

  public dismiss(id: string): void {
    this.toastsSignal.update((current) => current.filter((t) => t.id !== id));
  }
}
