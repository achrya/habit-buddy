import { Injectable, inject } from '@angular/core';
import { HabitService } from './habit.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private habitService = inject(HabitService);
  private reminderIntervalId?: number;

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
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.0001;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      const now = audioContext.currentTime;
      gainNode.gain.linearRampToValueAtTime(0.06, now + 0.01);
      oscillator.start(now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      oscillator.stop(now + 0.5);
    } catch (error) {
      console.warn('Could not play bell sound:', error);
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
      if (localStorage.getItem(lastNotifiedKey)) return;

      const target = this.hhmmToMins(habit.reminder.time);
      const diff = Math.min(
        Math.abs(minsNow - target),
        24 * 60 - Math.abs(minsNow - target)
      );

      const window = habit.reminder.window ?? 120;
      if (diff <= window / 2) {
        this.notify(`Reminder: ${habit.title}`, `Time to ${habit.title}`);
        this.playBell();
        this.triggerConfetti();
        localStorage.setItem(lastNotifiedKey, '1');
      }
    });
  }

  private hhmmToMins(hhmm: string): number {
    const [h, m] = (hhmm || '00:00').split(':').map(Number);
    return h * 60 + m;
  }
}
