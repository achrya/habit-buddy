import { Component, OnInit, computed, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HabitService, NotificationService } from '../../../../shared';
import { Habit, Reminder } from '../../../../shared/models/habit.model';
import { ReminderModalComponent } from '../reminder-modal/reminder-modal.component';
import { LucideAngularModule, Clock, Edit3, Calendar } from 'lucide-angular';

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule, ReminderModalComponent, LucideAngularModule],
  templateUrl: './reminders.component.html',
  styleUrl: './reminders.component.scss'
})
export class RemindersComponent implements OnInit {
  @ViewChild('reminderModal') reminderModal!: ReminderModalComponent;
  
  protected readonly habits = signal<Habit[]>([]);
  
  protected readonly habitsWithReminders = computed(() => 
    this.habitService.getHabitsWithReminders()
  );

  // Reminder modal state
  protected readonly selectedHabitId = signal('');
  protected readonly selectedHabitTitle = signal('');
  protected readonly selectedHabitReminder = signal<Reminder | null>(null);

  private readonly weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(
    private habitService: HabitService,
    private notificationService: NotificationService
  ) {
    // Subscribe to habits changes
    this.habitService.habits$.subscribe(habits => {
      this.habits.set(habits);
    });
  }

  ngOnInit(): void {
    // Check reminders every 30 seconds
    setInterval(() => {
      this.checkReminders();
    }, 30000);
    
    // Check immediately
    this.checkReminders();
  }

  protected getDaysText(days: number[]): string {
    return days.map(d => this.weekdayNames[d]).join(',');
  }

  protected editReminder(habitId: string): void {
    const habit = this.habits().find(h => h.id === habitId);
    if (habit) {
      this.selectedHabitId.set(habitId);
      this.selectedHabitTitle.set(habit.title);
      this.selectedHabitReminder.set(habit.reminder || null);
      this.reminderModal.open();
    }
  }

  protected onSaveReminder(event: { habitId: string; reminder: Reminder | null }): void {
    this.habitService.updateHabitReminder(event.habitId, event.reminder);
    this.onCloseReminderModal();
  }

  protected onCloseReminderModal(): void {
    this.selectedHabitId.set('');
    this.selectedHabitTitle.set('');
    this.selectedHabitReminder.set(null);
  }

  protected get selectedHabitTitleValue(): string {
    return this.selectedHabitTitle();
  }

  protected get selectedHabitIdValue(): string {
    return this.selectedHabitId();
  }

  // Lucide icons
  protected readonly ClockIcon = Clock;
  protected readonly Edit3Icon = Edit3;
  protected readonly CalendarIcon = Calendar;

  private checkReminders(): void {
    this.notificationService.checkReminders(this.habits());
  }
}
