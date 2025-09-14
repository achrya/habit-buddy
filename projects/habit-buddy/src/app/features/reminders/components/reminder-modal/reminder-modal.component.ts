import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Reminder } from '../../../../shared/models/habit.model';

@Component({
  selector: 'app-reminder-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reminder-modal.component.html',
  styleUrl: './reminder-modal.component.scss'
})
export class ReminderModalComponent implements OnInit {
  @Input() habitTitle = signal('');
  @Input() habitId = signal('');
  @Input() existingReminder: Reminder | null = null;
  @Output() saveReminder = new EventEmitter<{ habitId: string; reminder: Reminder | null }>();
  @Output() closeModal = new EventEmitter<void>();

  protected readonly isOpen = signal(false);
  protected readonly weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  protected reminderForm = {
    time: '08:00',
    days: [1, 2, 3, 4, 5], // Default to weekdays
    window: 120
  };

  protected readonly selectedDays = signal<number[]>([]);

  ngOnInit(): void {
    if (this.existingReminder) {
      this.reminderForm = {
        time: this.existingReminder.time,
        days: this.existingReminder.days,
        window: this.existingReminder.window
      };
      this.selectedDays.set(this.existingReminder.days);
    } else {
      this.selectedDays.set([1, 2, 3, 4, 5]); // Default to weekdays
    }
  }

  protected toggleDay(dayIndex: number): void {
    const days = [...this.selectedDays()];
    const index = days.indexOf(dayIndex);
    
    if (index > -1) {
      days.splice(index, 1);
    } else {
      days.push(dayIndex);
    }
    
    this.selectedDays.set(days);
  }

  protected isDaySelected(dayIndex: number): boolean {
    return this.selectedDays().includes(dayIndex);
  }

  protected hasExistingReminder(): boolean {
    return !!this.existingReminder;
  }

  protected save(): void {
    const time = this.reminderForm.time;
    const window = parseInt(this.reminderForm.window.toString(), 10);
    const days = [...this.selectedDays()];

    if (!time) {
      alert('Pick a time');
      return;
    }

    if (!days.length) {
      if (!confirm('No days selected — this will disable reminders. Continue?')) {
        return;
      }
    }

    const reminder: Reminder = { time, days, window };
    this.saveReminder.emit({ habitId: this.habitId(), reminder });
    this.close();
  }

  protected remove(): void {
    this.saveReminder.emit({ habitId: this.habitId(), reminder: null });
    this.close();
  }

  protected close(): void {
    this.isOpen.set(false);
    this.closeModal.emit();
  }

  open(): void {
    this.isOpen.set(true);
  }
}
