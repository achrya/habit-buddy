import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ChartComponent } from '../../../../shared';
import { Habit } from '../../../../shared/models/habit.model';
import { HabitService, NotificationService } from '../../../../shared';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, ChartComponent],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss'
})
export class StatsComponent implements OnInit {
  protected readonly habits = signal<Habit[]>([]);

  constructor(
    protected readonly habitService: HabitService,
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

  private checkReminders(): void {
    this.notificationService.checkReminders(this.habits());
  }
}
