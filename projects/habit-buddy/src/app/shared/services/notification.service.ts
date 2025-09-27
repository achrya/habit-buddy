import { Injectable, inject, signal } from '@angular/core';
import { HabitService } from './habit.service';
import { Habit, Reminder } from '../models/habit.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private habitService = inject(HabitService);
  private reminderIntervalId?: number;

  // Reminder dialog state
  readonly showReminderDialog = signal(false);
  readonly currentReminderHabit = signal<Habit | null>(null);
  readonly currentReminder = signal<Reminder | null>(null);

  constructor() {
    if (typeof window !== 'undefined') {
      this.requestNotificationPermission();
      this.startReminderTicker();
    }
  }

  startReminderTicker(): void {
    if (typeof window === 'undefined') return;
    if (this.reminderIntervalId != null) return; // already started
    // Immediate check
    this.checkReminders(this.habitService.habits());
    // Periodic check every 30s
    this.reminderIntervalId = window.setInterval(() => {
      this.checkReminders(this.habitService.habits());
    }, 30000);
  }

  stopReminderTicker(): void {
    if (this.reminderIntervalId) {
      clearInterval(this.reminderIntervalId);
      this.reminderIntervalId = undefined;
    }
  }

  async requestNotificationPermission(): Promise<void> {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.warn('Could not request notification permission:', error);
      }
    }
  }

  async notify(title: string, body: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && Notification && Notification.permission === 'granted') {
        new Notification(title, { body, silent: true });
      } else if (typeof window !== 'undefined') {
        alert(`${title}\n\n${body}`);
      }
    } catch (error) {
      if (typeof window !== 'undefined') {
        alert(`${title}\n\n${body}`);
      }
    }
  }

  playBell(): void {
    try {
      if (typeof window === 'undefined') return;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // Reminder bell - gentle notification
      gainNode.gain.value = 0.0001;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      const now = audioContext.currentTime;
      gainNode.gain.linearRampToValueAtTime(0.04, now + 0.01); // Softer for reminder
      oscillator.start(now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      oscillator.stop(now + 0.35);
    } catch (error) {
      console.warn('Could not play bell sound:', error);
    }
  }

  playSuccessSound(): void {
    try {
      if (typeof window === 'undefined') return;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a more celebratory sound - ascending notes
      const frequencies = [523, 659, 784, 1047]; // C, E, G, C (C major chord)
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        gainNode.gain.value = 0.0001;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        const now = audioContext.currentTime;
        const startTime = now + (index * 0.1);
        
        gainNode.gain.linearRampToValueAtTime(0.05, startTime + 0.01);
        oscillator.start(startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
        oscillator.stop(startTime + 0.45);
      });
    } catch (error) {
      console.warn('Could not play success sound:', error);
    }
  }

  playSnoozeSound(): void {
    try {
      if (typeof window === 'undefined') return;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 440; // A note - gentle acknowledgment
      gainNode.gain.value = 0.0001;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      const now = audioContext.currentTime;
      gainNode.gain.linearRampToValueAtTime(0.02, now + 0.01); // Very gentle
      oscillator.start(now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      oscillator.stop(now + 0.25);
    } catch (error) {
      console.warn('Could not play snooze sound:', error);
    }
  }

  triggerConfetti(): void {
    try {
      if (typeof window !== 'undefined' && (window as any).confetti) {
        (window as any).confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } catch (error) {
      console.warn('Could not trigger confetti:', error);
    }
  }

  checkReminders(habits: any[]): void {
    if (typeof window === 'undefined') return;
    
    const now = new Date();
    const minsNow = now.getHours() * 60 + now.getMinutes();
    const weekday = now.getDay();

    habits.forEach(habit => {
      if (!habit.reminder) return;
      if (!habit.reminder.days.includes(weekday)) return;

      const lastNotifiedKey = `hb_notified_${habit.id}_${now.toISOString().slice(0, 16)}`;
      const snoozeKey = `hb_snooze_${habit.id}_${now.toISOString().slice(0, 16)}`;
      if (localStorage.getItem(lastNotifiedKey) || localStorage.getItem(snoozeKey)) return;

      const target = this.hhmmToMins(habit.reminder.time);
      const diff = Math.min(
        Math.abs(minsNow - target),
        24 * 60 - Math.abs(minsNow - target)
      );

      const window = habit.reminder.window ?? 120;
      if (diff <= window / 2) {
        // Show reminder dialog instead of just notification
        this.showReminderDialog.set(true);
        this.currentReminderHabit.set(habit);
        this.currentReminder.set(habit.reminder);
        
        // Only play bell sound for reminder (no confetti yet)
        this.playBell();
        localStorage.setItem(lastNotifiedKey, '1');
      }
    });
  }

  private hhmmToMins(hhmm: string): number {
    const [h, m] = (hhmm || '00:00').split(':').map(Number);
    return h * 60 + m;
  }

  // Reminder dialog methods
  closeReminderDialog(): void {
    this.showReminderDialog.set(false);
    this.currentReminderHabit.set(null);
    this.currentReminder.set(null);
  }

  async markHabitAsDone(habitId: string): Promise<void> {
    try {
      const result = await this.habitService.toggleCheckinToday(habitId);
      if (result.success) {
        // Show confetti celebration when habit is successfully completed
        this.triggerConfetti();
        this.playSuccessSound(); // Celebratory success sound
      }
    } catch (error) {
      console.warn('Could not mark habit as done:', error);
    }
  }

  snoozeReminder(habitId: string): void {
    // Set a temporary flag to prevent showing this reminder again for 5 minutes
    const snoozeKey = `hb_snooze_${habitId}_${new Date().toISOString().slice(0, 16)}`;
    localStorage.setItem(snoozeKey, '1');
    
    // Play gentle acknowledgment sound
    this.playSnoozeSound();
    
    // Clear the snooze after 5 minutes
    setTimeout(() => {
      localStorage.removeItem(snoozeKey);
    }, 5 * 60 * 1000);
  }

}
