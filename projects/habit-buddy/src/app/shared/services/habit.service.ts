import { computed, Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Habit, HabitStats, Reminder, WeeklyTrend, MonthlyTrend, YearlyTrend, HabitBadge, BadgeLevel } from '../models/habit.model';
import { BADGE_LEVELS, getBadgeConfigForDays, calculateProgressToNextLevel } from '../config/badge-levels.config';

@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private readonly LS_KEY = 'habitbuddy_v2_local';
  private readonly LAST_TS_KEY = 'habitbuddy_v2_last_ts';
  private readonly COLORS = ['#ff6b6b', '#ffd166', '#06d6a0', '#4d96ff', '#b388eb', '#ffa07a', '#7dd3fc'];
  private readonly DEFAULT_WINDOW_MIN = 120;

  private habitsSubject = new BehaviorSubject<Habit[]>(this.loadHabits());
  public habits$ = this.habitsSubject.asObservable();
  public habits = signal(this.habitsSubject.value);

  public totalCompleted = computed(() => 
    this.habits().reduce((sum, habit) => sum + Object.keys(habit.checkIns || {}).length, 0)
  );

  public averageCompletion = computed(() => {
    const habits = this.habits();
    if (habits.length === 0) return 0;
    const totalCompletion = habits.reduce((sum, habit) => {
      const completed = Object.keys(habit.checkIns || {}).length;
      return sum + (completed / habit.daysTarget * 100);
    }, 0);
    return Math.round(totalCompletion / habits.length);
  });

  public bestCurrentStreak = computed(() => {
    return Math.max(...this.habits().map(habit => this.calcStreaksForHabit(habit).current), 0);
  });

  public bestLongestStreak = computed(() => {
    return Math.max(...this.habits().map(habit => this.calcStreaksForHabit(habit).longest), 0);
  });

  public weeklyTrend = computed((): WeeklyTrend => {
    const labels: string[] = [];
    const data: number[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString(undefined, { weekday: 'short' }));
      
      const key = d.toISOString().slice(0, 10);
      const dayTotal = this.habits().reduce((sum, habit) => 
        sum + ((habit.checkIns && habit.checkIns[key]) ? 1 : 0), 0
      );
      data.push(dayTotal);
    }
    
    return { labels, data };
  });

  public monthlyTrend = computed((): MonthlyTrend => {
    const labels: string[] = [];
    const data: number[] = [];
    
    // Get current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().slice(0, 10);
      labels.push(day.toString());
      
      // Calculate total check-ins for this day
      const dayTotal = this.habits().reduce((sum, habit) => 
        sum + ((habit.checkIns && habit.checkIns[dateStr]) ? 1 : 0), 0
      );
      data.push(dayTotal);
    }
    
    return { labels, data };
  });

  public yearlyTrend = computed((): YearlyTrend => {
    const labels: string[] = [];
    const data: number[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      labels.push(d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }));
      
      // Calculate total check-ins for this month
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      
      let monthTotal = 0;
      for (const habit of this.habits()) {
        if (habit.checkIns) {
          for (const [dateStr, _] of Object.entries(habit.checkIns)) {
            const checkInDate = new Date(dateStr);
            if (checkInDate >= monthStart && checkInDate <= monthEnd) {
              monthTotal++;
            }
          }
        }
      }
      
      data.push(monthTotal);
    }
    
    return { labels, data };
  });

  constructor() {
    this.habits$.subscribe(habits => {
      this.habits.set(habits);
      this.saveHabits(habits);
    });

    // Initialize with sample data if no habits exist
    this.initializeWithSampleDataIfEmpty();
  }

  private loadHabits(): Habit[] {
    try {
      if (typeof window === 'undefined') return [];
      const data = localStorage.getItem(this.LS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveHabits(habits: Habit[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.LS_KEY, JSON.stringify(habits));
  }

  addHabit(title: string, reminder?: Reminder | null): Habit {
    const habit: Habit = {
      id: this.generateId(),
      title: title.trim(),
      daysTarget: 30, // Default 30 days - will be updated based on progress
      color: this.pickColor(this.habits().length),
      createdAt: new Date().toISOString().slice(0, 10),
      checkIns: {},
      reminder: reminder || null,
      badge: null // Will be assigned as user progresses
    };

    const updatedHabits = [habit, ...this.habits()];
    this.habitsSubject.next(updatedHabits);
    return habit;
  }

  private getBadgeForProgress(completedDays: number): HabitBadge | null {
    const badgeConfig = getBadgeConfigForDays(completedDays);
    
    return {
      level: badgeConfig.level,
      name: badgeConfig.name,
      description: badgeConfig.description,
      icon: badgeConfig.icon,
      daysRequired: badgeConfig.daysRequired,
      achievedAt: new Date().toISOString()
    };
  }

  private updateHabitBadge(habit: Habit): Habit {
    const completedDays = Object.keys(habit.checkIns || {}).length;
    const newBadge = this.getBadgeForProgress(completedDays);
    
    // Update daysTarget based on current badge level
    const currentBadgeConfig = getBadgeConfigForDays(completedDays);
    const newDaysTarget = currentBadgeConfig.daysRequired || 3; // Default to 3 for novice

    return {
      ...habit,
      badge: newBadge,
      daysTarget: newDaysTarget
    };
  }

  removeHabit(id: string): void {
    const updatedHabits = this.habits().filter(habit => habit.id !== id);
    this.habitsSubject.next(updatedHabits);
  }

  updateHabitReminder(id: string, reminder: Reminder | null): void {
    const updatedHabits = this.habits().map(habit => 
      habit.id === id ? { ...habit, reminder } : habit
    );
    this.habitsSubject.next(updatedHabits);
  }

  async toggleCheckinToday(habitId: string): Promise<{ success: boolean; message?: string }> {
    const habit = this.habits().find(h => h.id === habitId);
    if (!habit) {
      return { success: false, message: 'Habit not found.' };
    }

    const today = this.getTodayString();
    
    if (habit.checkIns && habit.checkIns[today]) {
      return { success: false, message: 'Already checked in today.' };
    }

    const canCheckIn = this.canCheckIn(habit);
    if (!canCheckIn.ok) {
      return { success: false, message: canCheckIn.msg };
    }

    const success = await this.addCheckin(habitId, today);
    if (success) {
      const hash = await this.generateCheckinHash(habitId, today);
      const updatedHabits = this.habits().map(h => {
        if (h.id === habitId) {
          const updatedHabit = { ...h, checkIns: { ...h.checkIns, [today]: hash } };
          return this.updateHabitBadge(updatedHabit);
        }
        return h;
      });
      this.habitsSubject.next(updatedHabits);
    }

    return { success };
  }

  private canCheckIn(habit: Habit): { ok: boolean; msg?: string } {
    if (this.hasClockTampering()) {
      return { ok: false, msg: 'Clock tampering detected. Check-in disabled.' };
    }

    const today = this.getTodayString();
    if (habit.checkIns && habit.checkIns[today]) {
      return { ok: false, msg: 'Already checked in today.' };
    }

    if (habit.reminder) {
      const now = new Date();
      const minsNow = now.getHours() * 60 + now.getMinutes();
      const target = this.hhmmToMins(habit.reminder.time);
      const window = habit.reminder.window ?? this.DEFAULT_WINDOW_MIN;
      const weekday = now.getDay();

      if (!habit.reminder.days.includes(weekday)) {
        return { ok: false, msg: 'Today is not a scheduled reminder day for this habit.' };
      }

      const diff = Math.min(
        Math.abs(minsNow - target),
        24 * 60 - Math.abs(minsNow - target)
      );

      if (diff > window / 2) {
        return { ok: false, msg: `Check-in allowed only within ${Math.round((window / 60) * 100) / 100}h window around reminder.` };
      }
    }

    return { ok: true };
  }

  private async addCheckin(habitId: string, dateStr: string): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.setItem(this.LAST_TS_KEY, JSON.stringify(Date.now()));
      return true;
    } catch {
      return false;
    }
  }

  private async generateCheckinHash(habitId: string, dateStr: string): Promise<string> {
    const text = `${habitId}|${dateStr}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  calcStreaksForHabit(habit: Habit): HabitStats {
    const days = habit.checkIns ? Object.keys(habit.checkIns).sort() : [];
    if (!days.length) return { current: 0, longest: 0 };

    const checkinSet = new Set(days);
    let longest = 0;

    // Calculate longest streak
    for (const day of days) {
      const prev = this.getPreviousDateString(day);
      if (!checkinSet.has(prev)) {
        let current = 1;
        let next = this.getNextDateString(day);
        while (checkinSet.has(next)) {
          current++;
          next = this.getNextDateString(next);
        }
        longest = Math.max(longest, current);
      }
    }

    // Calculate current streak
    let current = 0;
    let dt = new Date();
    while (true) {
      const key = dt.toISOString().slice(0, 10);
      if (checkinSet.has(key)) {
        current++;
        dt.setDate(dt.getDate() - 1);
      } else {
        break;
      }
    }

    return { current, longest };
  }

  exportHabits(): string {
    return JSON.stringify(this.habits(), null, 2);
  }


  getHabitsWithReminders(): Habit[] {
    return this.habits().filter(habit => habit.reminder);
  }

  /**
   * Update habits list (used by ImportService)
   * @param habits Array of habits to set
   */
  updateHabitsList(habits: Habit[]): void {
    this.habitsSubject.next(habits);
  }

  /**
   * Initialize with sample data if no habits exist
   */
  private initializeWithSampleDataIfEmpty(): void {
    const currentHabits = this.habits();
    if (currentHabits.length === 0) {
      const sampleHabits = this.createSampleHabits();
      this.habitsSubject.next(sampleHabits);
    }
  }

  /**
   * Load sample habits (useful for testing or demo purposes)
   */
  loadSampleHabits(): void {
    const sampleHabits = this.createSampleHabits();
    this.habitsSubject.next(sampleHabits);
  }

  /**
   * Clear all habits (useful for testing)
   */
  clearAllHabits(): void {
    this.habitsSubject.next([]);
  }

  /**
   * Create sample habits for first-time users
   */
  private createSampleHabits(): Habit[] {
    const today = new Date().toISOString().slice(0, 10);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Generate check-ins for current month (random but realistic pattern)
    const generateCurrentMonthCheckIns = (habitIndex: number): Record<string, string> => {
      const checkIns: Record<string, string> = {};
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      // Each habit has different patterns:
      // Habit 0: Daily habit (80% completion)
      // Habit 1: Weekdays only (70% completion)
      // Habit 2: Every other day (60% completion)
      // Habit 3: Weekends only (50% completion)
      // Habit 4: Random pattern (40% completion)
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = date.toISOString().slice(0, 10);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        let shouldCheckIn = false;
        
        switch (habitIndex) {
          case 0: // Daily habit (80% completion)
            shouldCheckIn = Math.random() < 0.8;
            break;
          case 1: // Weekdays only (70% completion)
            shouldCheckIn = dayOfWeek >= 1 && dayOfWeek <= 5 && Math.random() < 0.7;
            break;
          case 2: // Every other day (60% completion)
            shouldCheckIn = day % 2 === 0 && Math.random() < 0.6;
            break;
          case 3: // Weekends only (50% completion)
            shouldCheckIn = (dayOfWeek === 0 || dayOfWeek === 6) && Math.random() < 0.5;
            break;
          case 4: // Random pattern (40% completion)
            shouldCheckIn = Math.random() < 0.4;
            break;
        }
        
        if (shouldCheckIn) {
          checkIns[dateStr] = `sample-hash-${habitIndex}-${day}`;
        }
      }
      
      return checkIns;
    };

    return [
      {
        id: this.generateId(),
        title: 'Morning Meditation',
        daysTarget: 30,
        categoryId: '30',
        color: this.COLORS[0],
        createdAt: today,
        checkIns: generateCurrentMonthCheckIns(0),
        reminder: null
      },
      {
        id: this.generateId(),
        title: 'Drink 8 Glasses of Water',
        daysTarget: 21,
        categoryId: '21',
        color: this.COLORS[1],
        createdAt: today,
        checkIns: generateCurrentMonthCheckIns(1),
        reminder: null
      },
      {
        id: this.generateId(),
        title: 'Exercise for 30 Minutes',
        daysTarget: 30,
        categoryId: '30',
        color: this.COLORS[2],
        createdAt: today,
        checkIns: generateCurrentMonthCheckIns(2),
        reminder: null
      },
      {
        id: this.generateId(),
        title: 'Read for 20 Minutes',
        daysTarget: 50,
        categoryId: '50',
        color: this.COLORS[3],
        createdAt: today,
        checkIns: generateCurrentMonthCheckIns(3),
        reminder: null
      },
      {
        id: this.generateId(),
        title: 'Practice Gratitude',
        daysTarget: 21,
        categoryId: '21',
        color: this.COLORS[4],
        createdAt: today,
        checkIns: generateCurrentMonthCheckIns(4),
        reminder: null
      }
    ];
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).slice(2, 9);
  }

  private pickColor(index: number): string {
    return this.COLORS[index % this.COLORS.length];
  }

  private getTodayString(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private getPreviousDateString(dateStr: string): string {
    const dt = new Date(dateStr);
    dt.setDate(dt.getDate() - 1);
    return dt.toISOString().slice(0, 10);
  }

  private getNextDateString(dateStr: string): string {
    const dt = new Date(dateStr);
    dt.setDate(dt.getDate() + 1);
    return dt.toISOString().slice(0, 10);
  }

  private hasClockTampering(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      const last = JSON.parse(localStorage.getItem(this.LAST_TS_KEY) || '0');
      if (!last) return false;
      const now = Date.now();
      return now + 2000 < last - 120000;
    } catch {
      return false;
    }
  }

  private hhmmToMins(hhmm: string): number {
    const [h, m] = (hhmm || '00:00').split(':').map(Number);
    return h * 60 + m;
  }
}
