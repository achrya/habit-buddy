import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, AlertTriangle } from 'lucide-angular';

export interface DialogButton {
  label: string;
  action: string;
  variant: 'primary' | 'secondary' | 'danger';
}

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss'
})
export class DialogComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() message = '';
  @Input() type: 'info' | 'warning' | 'danger' = 'info';
  @Input() buttons: DialogButton[] = [];
  @Input() showCloseButton = true;
  
  @Output() close = new EventEmitter<void>();
  @Output() buttonClick = new EventEmitter<string>();

  // Lucide icons
  protected readonly XIcon = X;
  protected readonly AlertTriangleIcon = AlertTriangle;

  protected onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  protected onClose(): void {
    this.close.emit();
  }

  protected onButtonClick(action: string): void {
    this.buttonClick.emit(action);
  }

  protected getButtonClasses(variant: string): string {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors flex-1 sm:flex-none sm:px-6';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white`;
      case 'danger':
        return `${baseClasses} bg-red-600 hover:bg-red-700 text-white`;
      case 'secondary':
      default:
        return `${baseClasses} bg-slate-100 hover:bg-slate-200 text-slate-700`;
    }
  }
}
