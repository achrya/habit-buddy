import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HabitService, NotificationService } from '../../../../shared';
import { Habit } from '../../../../shared/models/habit.model';

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reminders.component.html',
  styleUrl: './reminders.component.scss'
})
export class RemindersComponent implements OnInit {
  protected readonly habits = signal<Habit[]>([]);
  
  protected readonly habitsWithReminders = computed(() => 
    this.habitService.getHabitsWithReminders()
  );

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
    // This will be handled by a modal service or component
    console.log('Edit reminder for habit:', habitId);
  }

  private checkReminders(): void {
    this.notificationService.checkReminders(this.habits());
  }
}
