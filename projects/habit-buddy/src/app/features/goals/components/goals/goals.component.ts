import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HabitCardComponent, HabitFormComponent } from '../../../../shared';
import { Habit, HabitCategory } from '../../../../shared/models/habit.model';
import { HabitService, NotificationService } from '../../../../shared';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule, HabitCardComponent, HabitFormComponent],
  templateUrl: './goals.component.html',
  styleUrl: './goals.component.scss'
})
export class GoalsComponent implements OnInit {
  protected readonly habits = signal<Habit[]>([]);
  
  protected readonly categories = signal<HabitCategory[]>([
    { value: '7', label: 'Micro (7d)', days: 7 },
    { value: '21', label: 'Beginner (21d)', days: 21 },
    { value: '30', label: 'Starter (30d)', days: 30 },
    { value: '50', label: 'Intermediate (50d)', days: 50 },
    { value: '100', label: 'Pro (100d)', days: 100 }
  ]);

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

  protected onHabitAdded(habit: { title: string; categoryId: string }): void {
    const category = this.categories().find(c => c.value === habit.categoryId);
    if (category) {
      const newHabit = this.habitService.addHabit(habit.title, category.days, habit.categoryId);
      this.notificationService.playBell();
      this.notificationService.triggerConfetti();
    }
  }

  protected async onCheckin(habitId: string): Promise<void> {
    const result = await this.habitService.toggleCheckinToday(habitId);
    if (result.success) {
      this.notificationService.playBell();
      this.notificationService.triggerConfetti();
    } else if (result.message) {
      alert(result.message);
    }
  }

  protected onRemoveHabit(habitId: string): void {
    if (confirm('Remove habit?')) {
      this.habitService.removeHabit(habitId);
    }
  }

  protected onEditReminder(habitId: string): void {
    // This will be handled by a modal service or component
    console.log('Edit reminder for habit:', habitId);
  }

  protected onViewCalendar(habitId: string): void {
    // Navigate to calendar view with specific habit filter
    console.log('View calendar for habit:', habitId);
  }

  protected getHabitStats(habit: Habit) {
    return this.habitService.calcStreaksForHabit(habit);
  }

  private checkReminders(): void {
    this.notificationService.checkReminders(this.habits());
  }
}
