import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DuplicateAction } from './import.service';

@Component({
  selector: 'app-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './import-modal.component.html',
  styleUrl: './import-modal.component.scss'
})
export class ImportModalComponent {
  @Input() isOpen = false;
  @Input() duplicates: string[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() importWithAction = new EventEmitter<DuplicateAction>();

  protected selectedAction: DuplicateAction = 'skip';

  protected onClose(): void {
    this.close.emit();
  }

  protected onImport(): void {
    this.importWithAction.emit(this.selectedAction);
  }

  protected getDuplicateList(): string {
    return this.duplicates.map(dup => `• ${dup}`).join('\n');
  }
}
