import { Component, Input, Output, EventEmitter, signal, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Reminder } from '../../../../shared/models/habit.model';
import { LucideAngularModule, Clock, Calendar, Save, Trash2, X } from 'lucide-angular';
import { DialogComponent, DialogButton } from '../../../../shared/components/dialog/dialog.component';
import { DialogService } from '../../../../shared/services/dialog.service';

@Component({
  selector: 'app-reminder-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, DialogComponent],
  templateUrl: './reminder-modal.component.html',
  styleUrl: './reminder-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReminderModalComponent implements OnInit, OnChanges {
  @Input() habitTitle = '';
  @Input() habitId = '';
  @Input() existingReminder: Reminder | null = null;
  @Output() saveReminder = new EventEmitter<{ habitId: string; reminder: Reminder | null }>();
  @Output() closeModal = new EventEmitter<void>();

  private dialogService = inject(DialogService);

  protected readonly isOpen = signal(false);
  protected readonly weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  protected readonly selectedDays = signal<number[]>([1, 2, 3, 4, 5]); // Default to weekdays
  
  protected reminderForm = {
    time: '08:00',
    days: [] as number[],
    window: 120
  };

  // Dialog state
  protected showDeleteDialog = signal(false);
  protected deleteDialogButtons: DialogButton[] = [
    { label: 'Cancel', action: 'cancel', variant: 'secondary' },
    { label: 'Remove Reminder', action: 'confirm', variant: 'danger' }
  ];

  // Lucide icons
  protected readonly ClockIcon = Clock;
  protected readonly CalendarIcon = Calendar;
  protected readonly SaveIcon = Save;
  protected readonly Trash2Icon = Trash2;
  protected readonly XIcon = X;

  ngOnInit(): void {
    this.loadReminderData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['existingReminder']) {
      this.loadReminderData();
    }
  }

  private loadReminderData(): void {
    if (this.existingReminder) {
      this.reminderForm = {
        time: this.existingReminder.time,
        days: [...this.existingReminder.days],
        window: this.existingReminder.window
      };
      this.selectedDays.set([...this.existingReminder.days]);
    } else {
      this.reminderForm = {
        time: '08:00',
        days: [1, 2, 3, 4, 5],
        window: 120
      };
      this.selectedDays.set([1, 2, 3, 4, 5]);
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
    const window = Math.max(5, Math.min(1440, parseInt(this.reminderForm.window.toString(), 10) || 120));
    const days = [...this.selectedDays()];

    if (!time || !this.isValidTime(time)) {
      this.dialogService.showError('Please enter a valid time');
      return;
    }

    if (!days.length) {
      // Show warning but allow saving (will disable reminders)
      this.dialogService.showWarning('No days selected. This will disable reminders for this habit.');
    }

    const reminder: Reminder = { time, days, window };
    this.saveReminder.emit({ habitId: this.habitId, reminder });
    this.close();
  }

  private isValidTime(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  protected remove(): void {
    this.showDeleteDialog.set(true);
  }

  protected onDeleteDialogClose(): void {
    this.showDeleteDialog.set(false);
  }

  protected onDeleteDialogAction(action: string): void {
    if (action === 'confirm') {
      this.saveReminder.emit({ habitId: this.habitId, reminder: null });
      this.close();
    }
    this.showDeleteDialog.set(false);
  }

  protected getDeleteMessage(): string {
    return `Are you sure you want to remove the reminder for "${this.habitTitle}"? This will disable all notifications for this habit.`;
  }

  protected close(): void {
    this.isOpen.set(false);
    this.closeModal.emit();
  }

  open(): void {
    this.loadReminderData(); // Refresh data when opening
    this.isOpen.set(true);
  }
}
