import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ChartComponent } from '../../../../shared';
import { Habit, WeeklyTrend, MonthlyTrend, YearlyTrend } from '../../../../shared/models/habit.model';
import { HabitService, NotificationService } from '../../../../shared';

export type ViewType = 'weekly' | 'monthly' | 'yearly';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, ChartComponent],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss'
})
export class StatsComponent implements OnInit {
  protected readonly habits = signal<Habit[]>([]);
  protected readonly currentView = signal<ViewType>('weekly');

  constructor(
    protected readonly habitService: HabitService,
    private notificationService: NotificationService
  ) {
    // Subscribe to habits changes
    this.habitService.habits$.subscribe(habits => {
      this.habits.set(habits);
    });
  }

  protected getCurrentTrend(): WeeklyTrend | MonthlyTrend | YearlyTrend {
    switch (this.currentView()) {
      case 'weekly':
        return this.habitService.weeklyTrend();
      case 'monthly':
        return this.habitService.monthlyTrend();
      case 'yearly':
        return this.habitService.yearlyTrend();
      default:
        return this.habitService.weeklyTrend();
    }
  }

  protected switchView(view: ViewType): void {
    this.currentView.set(view);
  }

  ngOnInit(): void {
    // Check reminders every 30 seconds
    setInterval(() => {
      this.checkReminders();
    }, 30000);
    
    // Check immediately
    this.checkReminders();
  }

  private checkReminders(): void {
    this.notificationService.checkReminders(this.habits());
  }
}
