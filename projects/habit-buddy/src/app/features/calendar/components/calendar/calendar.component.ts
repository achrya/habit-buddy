import { Component, OnInit, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HabitService, NotificationService } from '../../../../shared';
import { DialogService } from '../../../../shared/services/dialog.service';
import { Habit } from '../../../../shared/models/habit.model';
import { LucideAngularModule, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, Calendar, Target, TrendingUp, Plus, Check, CalendarDays } from 'lucide-angular';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent implements OnInit, OnDestroy {
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

  private habitService = inject(HabitService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private dialogService = inject(DialogService);

  constructor() {
    // Subscribe to habits changes
    this.habitService.habits$.subscribe(habits => {
      this.habits.set(habits);
    });
  }

  ngOnInit(): void {
    // Check for habitId query parameter and set calendar mode
    this.route.queryParams.subscribe(params => {
      const habitId = params['habitId'];
      if (habitId) {
        // Find the habit and set calendar mode to that habit
        const habit = this.habits().find(h => h.id === habitId);
        if (habit) {
          this.setCalendarMode(habitId);
        }
      }
    });

    // Periodic checks are centralized in NotificationService
    this.checkReminders();
  }

  ngOnDestroy(): void {}

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

  private _titleCache = new Map<string, string>();

  protected getShortTitle(title: string): string {
    // Cache the result to prevent unnecessary string operations
    if (this._titleCache.has(title)) {
      return this._titleCache.get(title)!;
    }
    
    const result = title.length > 12 ? title.slice(0, 10) + '...' : title;
    this._titleCache.set(title, result);
    return result;
  }

  protected getTooltipText(habit: Habit, isMobile: boolean = false): string {
    const action = isMobile ? 'Tap' : 'Click';
    return `${habit.title} - ${action} to view individual progress`;
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

  protected goToToday(): void {
    const today = new Date();
    this.calendarYear.set(today.getFullYear());
    this.calendarMonth.set(today.getMonth());
  }

  protected getMonthlyCompletionRate(): number {
    const daysInMonth = new Date(this.calendarYear(), this.calendarMonth() + 1, 0).getDate();
    let totalPossible = 0;
    let totalCompleted = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(this.calendarYear(), this.calendarMonth(), day).toISOString().slice(0, 10);
      const dayCompleted = this.habits().some(habit => habit.checkIns && habit.checkIns[dateStr]);
      if (dayCompleted) totalCompleted++;
      totalPossible++;
    }

    return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  }

  protected getDayStatusClass(dateStr: string): string {
    const today = new Date().toISOString().slice(0, 10);
    const isToday = dateStr === today;
    const isPast = dateStr < today;
    const isFuture = dateStr > today;

    if (isToday) return 'today';
    if (isPast) return 'past';
    if (isFuture) return 'future';
    return 'current';
  }

  protected canToggleDay(dateStr: string): boolean {
    const today = new Date().toISOString().slice(0, 10);
    return dateStr === today;
  }

  protected getDayTooltip(dateStr: string): string {
    const habit = this.getSelectedHabit();
    if (!habit) return '';

    const isChecked = this.isDayChecked(dateStr);
    const today = new Date().toISOString().slice(0, 10);
    
    if (dateStr === today) {
      return isChecked ? `Mark ${habit.title} as not done for today` : `Mark ${habit.title} as done for today`;
    } else if (dateStr < today) {
      return isChecked ? `${habit.title} was completed on this day` : `${habit.title} was not completed on this day`;
    } else {
      return `Future date - ${habit.title} cannot be modified`;
    }
  }

  protected getDayAriaLabel(dateStr: string): string {
    const habit = this.getSelectedHabit();
    if (!habit) return '';

    const isChecked = this.isDayChecked(dateStr);
    const today = new Date().toISOString().slice(0, 10);
    const date = new Date(dateStr);
    const dateLabel = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    
    if (dateStr === today) {
      return isChecked ? `Today, ${dateLabel}: ${habit.title} completed. Click to mark as not done.` : `Today, ${dateLabel}: ${habit.title} not completed. Click to mark as done.`;
    } else if (dateStr < today) {
      return `${dateLabel}: ${habit.title} ${isChecked ? 'completed' : 'not completed'}`;
    } else {
      return `${dateLabel}: Future date, cannot modify ${habit.title}`;
    }
  }

  protected async onDayClick(dateStr: string): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    if (dateStr !== today) {
      this.dialogService.showWarning('Only today can be toggled (no backfill).');
      return;
    }

    const habit = this.getSelectedHabit();
    if (!habit) return;

    const result = await this.habitService.toggleCheckinToday(habit.id);
    if (result.success) {
      this.notificationService.playBell();
      this.notificationService.triggerConfetti();
    } else if (result.message) {
      this.dialogService.showError(result.message);
    }
  }

  private checkReminders(): void {
    this.notificationService.checkReminders(this.habits());
  }

  // Lucide icons
  protected readonly ChevronLeftIcon = ChevronLeft;
  protected readonly ChevronRightIcon = ChevronRight;
  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly CheckCircleIcon = CheckCircle;
  protected readonly CalendarIcon = Calendar;
  protected readonly TargetIcon = Target;
  protected readonly TrendingUpIcon = TrendingUp;
  protected readonly TodayIcon = CalendarDays;
  protected readonly PlusIcon = Plus;
  protected readonly CheckIcon = Check;
}
