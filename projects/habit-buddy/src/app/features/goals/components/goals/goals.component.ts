import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HabitCardComponent, HabitFormComponent } from '../../../../shared';
import { DialogService } from '../../../../shared/services/dialog.service';
import { Habit, Reminder } from '../../../../shared/models/habit.model';
import { HabitService, NotificationService } from '../../../../shared';
import { ReminderModalComponent } from '../../../reminders/components/reminder-modal/reminder-modal.component';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule, HabitCardComponent, HabitFormComponent, ReminderModalComponent],
  templateUrl: './goals.component.html',
  styleUrl: './goals.component.scss'
})
export class GoalsComponent implements OnInit {
  @ViewChild('reminderModal') reminderModal!: ReminderModalComponent;
  @ViewChild(HabitFormComponent) habitForm!: HabitFormComponent;
  
  protected readonly habits = signal<Habit[]>([]);
  
  // Reminder modal state
  protected readonly selectedHabitId = signal('');
  protected readonly selectedHabitTitle = signal('');
  protected readonly selectedHabitReminder = signal<Reminder | null>(null);
  
  // Form reminder modal state
  protected readonly isFormReminderModalOpen = signal(false);
  protected readonly formHabitTitle = signal('New Habit');
  protected readonly formHabitId = signal('form-reminder');

  private habitService = inject(HabitService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private dialogService = inject(DialogService);

  constructor() {
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

  protected onHabitAdded(habit: { title: string; reminder?: Reminder | null }): void {
    const newHabit = this.habitService.addHabit(habit.title, habit.reminder);
    this.notificationService.playBell();
    this.notificationService.triggerConfetti();
  }

  protected async onCheckin(habitId: string): Promise<void> {
    const result = await this.habitService.toggleCheckinToday(habitId);
    if (result.success) {
      this.notificationService.playBell();
      this.notificationService.triggerConfetti();
    } else if (result.message) {
      this.dialogService.showError(result.message);
    }
  }

  protected onRemoveHabit(habitId: string): void {
    // This is handled by the habit card's dialog component
    this.habitService.removeHabit(habitId);
  }

  protected onEditReminder(habitId: string): void {
    const habit = this.habits().find(h => h.id === habitId);
    if (habit) {
      this.selectedHabitId.set(habitId);
      this.selectedHabitTitle.set(habit.title);
      this.selectedHabitReminder.set(habit.reminder || null);
      this.reminderModal.open();
    }
  }

  protected onViewCalendar(habitId: string): void {
    // Navigate to calendar view with specific habit filter
    this.router.navigate(['/calendar'], { 
      queryParams: { habitId: habitId }
    });
  }

  protected onSaveReminder(event: { habitId: string; reminder: Reminder | null }): void {
    this.habitService.updateHabitReminder(event.habitId, event.reminder);
    this.onCloseReminderModal();
  }

  protected onCloseReminderModal(): void {
    // Modal will handle its own closing
    this.selectedHabitId.set('');
    this.selectedHabitTitle.set('');
    this.selectedHabitReminder.set(null);
  }

  protected onOpenReminderModal(): void {
    this.isFormReminderModalOpen.set(true);
    this.reminderModal.open();
  }

  protected onSaveFormReminder(event: { habitId: string; reminder: Reminder | null }): void {
    // Set the reminder in the habit form
    this.habitForm.setReminder(event.reminder);
    this.onCloseFormReminderModal();
  }

  protected onCloseFormReminderModal(): void {
    this.isFormReminderModalOpen.set(false);
  }

  protected getHabitStats(habit: Habit) {
    return this.habitService.calcStreaksForHabit(habit);
  }

  protected get formHabitTitleValue(): string {
    return this.formHabitTitle();
  }

  protected get formHabitIdValue(): string {
    return this.formHabitId();
  }

  private checkReminders(): void {
    this.notificationService.checkReminders(this.habits());
  }
}
