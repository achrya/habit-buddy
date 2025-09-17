import { Injectable, signal } from '@angular/core';
import { DialogButton } from '../components/dialog/dialog.component';

export interface NotificationConfig {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger';
  buttons?: DialogButton[];
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private readonly _isOpen = signal(false);
  private readonly _config = signal<NotificationConfig>({
    title: '',
    message: '',
    type: 'info'
  });

  readonly isOpen = this._isOpen.asReadonly();
  readonly config = this._config.asReadonly();

  showSuccess(message: string, title: string = 'Success'): void {
    this.show({
      title,
      message,
      type: 'info',
      buttons: [{ label: 'OK', action: 'ok', variant: 'primary' }]
    });
  }

  showError(message: string, title: string = 'Error'): void {
    this.show({
      title,
      message,
      type: 'danger',
      buttons: [{ label: 'OK', action: 'ok', variant: 'danger' }]
    });
  }

  showWarning(message: string, title: string = 'Warning'): void {
    this.show({
      title,
      message,
      type: 'warning',
      buttons: [{ label: 'OK', action: 'ok', variant: 'secondary' }]
    });
  }

  showInfo(message: string, title: string = 'Information'): void {
    this.show({
      title,
      message,
      type: 'info',
      buttons: [{ label: 'OK', action: 'ok', variant: 'primary' }]
    });
  }

  show(config: NotificationConfig): void {
    this._config.set(config);
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
  }
}
