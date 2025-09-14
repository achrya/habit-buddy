import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HabitService, NotificationService } from '../../../../shared';
import { Habit } from '../../../../shared/models/habit.model';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent implements OnInit {
  protected readonly calendarMode = signal<'all' | string>('all');
  protected readonly calendarYear = signal(new Date().getFullYear());
  protected readonly calendarMonth = signal(new Date().getMonth());
  
  protected readonly habits = signal<Habit[]>([]);

  protected readonly calendarTitle = computed(() => {
    const dt = new Date(this.calendarYear(), this.calendarMonth(), 1);
    const label = dt.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    
    if (this.calendarMode() === 'all') {
      return `All Habits - ${label}`;
    } else {
      const habit = this.getSelectedHabit();
      return `${habit?.title || 'Habit'} - ${label}`;
    }
  });

  protected readonly calendarDays = computed(() => {
    const first = new Date(this.calendarYear(), this.calendarMonth(), 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(this.calendarYear(), this.calendarMonth() + 1, 0).getDate();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push({ day: '', date: '', isEmpty: true });
    }
    
    // Add days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = new Date(this.calendarYear(), this.calendarMonth(), d).toISOString().slice(0, 10);
      days.push({ day: d, date: dateStr, isEmpty: false });
    }
    
    return days;
  });

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

  protected previousMonth(): void {
    if (this.calendarMonth() === 0) {
      this.calendarMonth.set(11);
      this.calendarYear.set(this.calendarYear() - 1);
    } else {
      this.calendarMonth.set(this.calendarMonth() - 1);
    }
  }

  protected nextMonth(): void {
    if (this.calendarMonth() === 11) {
      this.calendarMonth.set(0);
      this.calendarYear.set(this.calendarYear() + 1);
    } else {
      this.calendarMonth.set(this.calendarMonth() + 1);
    }
  }

  protected setCalendarMode(mode: 'all' | string): void {
    this.calendarMode.set(mode);
  }

  protected getShortTitle(title: string): string {
    return title.length > 18 ? title.slice(0, 15) + '...' : title;
  }

  protected getDayDots(dateStr: string) {
    return this.habits()
      .filter(habit => habit.checkIns && habit.checkIns[dateStr])
      .slice(0, 5)
      .map(habit => ({ color: habit.color }));
  }

  protected isDayChecked(dateStr: string): boolean {
    const habit = this.getSelectedHabit();
    return habit ? !!(habit.checkIns && habit.checkIns[dateStr]) : false;
  }

  protected getSelectedHabit(): Habit | undefined {
    if (this.calendarMode() === 'all') return undefined;
    return this.habits().find(h => h.id === this.calendarMode());
  }

  protected async onDayClick(dateStr: string): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    if (dateStr !== today) {
      alert('Only today can be toggled (no backfill).');
      return;
    }

    const habit = this.getSelectedHabit();
    if (!habit) return;

    const result = await this.habitService.toggleCheckinToday(habit.id);
    if (result.success) {
      this.notificationService.playBell();
      this.notificationService.triggerConfetti();
    } else if (result.message) {
      alert(result.message);
    }
  }

  private checkReminders(): void {
    this.notificationService.checkReminders(this.habits());
  }
}
