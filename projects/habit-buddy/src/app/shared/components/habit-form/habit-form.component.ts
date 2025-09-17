import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Reminder } from '../../models/habit.model';

@Component({
  selector: 'app-habit-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './habit-form.component.html',
  styleUrl: './habit-form.component.scss'
})
export class HabitFormComponent {
  @Output() habitAdded = new EventEmitter<{ title: string; reminder?: Reminder | null }>();
  @Output() openReminderModal = new EventEmitter<void>();

  protected title = signal('');
  protected reminder = signal<Reminder | null>(null);

  protected get hasReminder(): boolean {
    return this.reminder() !== null;
  }

  protected get hasInputContent(): boolean {
    return this.title().trim().length > 0;
  }

  protected onOpenReminderModal(): void {
    this.openReminderModal.emit();
  }

  protected onSubmit(): void {
    const title = this.title().trim();
    if (!title) return;

    this.habitAdded.emit({
      title,
      reminder: this.reminder()
    });

    // Reset form
    this.title.set('');
    this.reminder.set(null);
  }

  // Method to be called from parent when reminder is set
  setReminder(reminder: Reminder | null): void {
    this.reminder.set(reminder);
  }
}
