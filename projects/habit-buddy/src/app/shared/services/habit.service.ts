import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Habit, Reminder, HabitStats, WeeklyTrend } from '../models/habit.model';

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

  constructor() {
    this.habits$.subscribe(habits => {
      this.habits.set(habits);
      this.saveHabits(habits);
    });
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

  addHabit(title: string, daysTarget: number, categoryId: string): Habit {
    const habit: Habit = {
      id: this.generateId(),
      title: title.trim(),
      daysTarget,
      categoryId,
      color: this.pickColor(this.habits().length),
      createdAt: new Date().toISOString().slice(0, 10),
      checkIns: {},
      reminder: null
    };

    const updatedHabits = [habit, ...this.habits()];
    this.habitsSubject.next(updatedHabits);
    return habit;
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
      const updatedHabits = this.habits().map(h => 
        h.id === habitId 
          ? { ...h, checkIns: { ...h.checkIns, [today]: hash } }
          : h
      );
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
      const window = habit.reminder.window || this.DEFAULT_WINDOW_MIN;
      const weekday = now.getDay();

      if (!habit.reminder.days.includes(weekday)) {
        return { ok: false, msg: 'Today is not a scheduled reminder day for this habit.' };
      }

      const diff = Math.min(
        Math.abs(minsNow - target),
        24 * 60 - Math.abs(minsNow - target)
      );

      if (diff > window / 2) {
        return { ok: false, msg: `Check-in allowed only within ${Math.round(window / 60 * 100) / 100}h window around reminder.` };
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

  importHabits(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (Array.isArray(data)) {
        // Validate that each item has required Habit properties
        const isValidHabitData = data.every(habit => 
          habit && 
          typeof habit.id === 'string' && 
          typeof habit.title === 'string' &&
          typeof habit.daysTarget === 'number' &&
          typeof habit.categoryId === 'string' &&
          typeof habit.color === 'string' &&
          typeof habit.createdAt === 'string' &&
          typeof habit.checkIns === 'object'
        );
        
        if (isValidHabitData) {
          this.habitsSubject.next(data);
          this.saveHabits(data); // Persist imported data to localStorage
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  getHabitsWithReminders(): Habit[] {
    return this.habits().filter(habit => habit.reminder);
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
