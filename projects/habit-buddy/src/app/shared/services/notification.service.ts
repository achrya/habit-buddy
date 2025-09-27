import { Injectable, inject, signal } from '@angular/core';
import { HabitService } from './habit.service';
import { TimezoneService } from './timezone.service';
import { Habit, Reminder } from '../models/habit.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private habitService = inject(HabitService);
  private timezoneService = inject(TimezoneService);
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
      console.log('playSuccessSound called');
      if (typeof window === 'undefined') {
        console.warn('Window is undefined, cannot play sound');
        return;
      }
      
      console.log('Creating audio context...');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a more celebratory sound - ascending notes
      const frequencies = [523, 659, 784, 1047]; // C, E, G, C (C major chord)
      
      console.log('Playing success sound with frequencies:', frequencies);
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
      console.log('Success sound started');
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
      console.log('triggerConfetti called');
      if (typeof window !== 'undefined' && (window as any).confetti) {
        console.log('Confetti library found, triggering...');
        (window as any).confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
        console.log('Confetti triggered successfully');
      } else {
        console.warn('Confetti library not found or window undefined');
      }
    } catch (error) {
      console.warn('Could not trigger confetti:', error);
    }
  }

  checkReminders(habits: any[]): void {
    if (typeof window === 'undefined') return;
    
    const now = this.timezoneService.getCurrentDate();
    const minsNow = this.timezoneService.getCurrentTimeInMinutes();
    const weekday = this.timezoneService.getCurrentWeekday();
    const today = this.timezoneService.getTodayString();

    // Don't show new reminder if dialog is already open
    if (this.showReminderDialog()) return;

    habits.forEach(habit => {
      if (!habit.reminder) return;
      if (!habit.reminder.days.includes(weekday)) return;

      // Check if habit is already completed today - no need to remind!
      if (habit.checkIns && habit.checkIns[today]) return;

      // Use date-only key to prevent showing multiple times per day
      const lastNotifiedKey = `hb_notified_${habit.id}_${today}`;
      if (localStorage.getItem(lastNotifiedKey)) return;
      
      // Check if habit is snoozed
      const snoozeKey = `hb_snooze_${habit.id}_until`;
      const snoozeUntil = localStorage.getItem(snoozeKey);
      if (snoozeUntil && Date.now() < parseInt(snoozeUntil)) return;

      const target = this.timezoneService.timeStringToMinutes(habit.reminder.time);
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
        // Don't set localStorage here - let dialog close handle it
        return; // Exit early to prevent multiple dialogs
      }
    });
  }


  // Reminder dialog methods
  closeReminderDialog(): void {
    const habit = this.currentReminderHabit();
    if (habit) {
      // Mark this reminder as shown for today (date only, not time)
      const today = this.timezoneService.getTodayString();
      const lastNotifiedKey = `hb_notified_${habit.id}_${today}`;
      localStorage.setItem(lastNotifiedKey, '1');
    }
    
    this.showReminderDialog.set(false);
    this.currentReminderHabit.set(null);
    this.currentReminder.set(null);
  }

  async markHabitAsDone(habitId: string): Promise<void> {
    try {
      console.log('markHabitAsDone called for habit:', habitId);
      const result = await this.habitService.toggleCheckinToday(habitId);
      console.log('toggleCheckinToday result:', result);
      
      if (result.success) {
        console.log('Habit marked as done successfully, triggering effects...');
        // Show confetti celebration when habit is successfully completed
        this.triggerConfetti();
        this.playSuccessSound(); // Celebratory success sound
        console.log('Effects triggered');
      } else {
        console.log('Habit not marked as done, reason:', result.message);
      }
    } catch (error) {
      console.warn('Could not mark habit as done:', error);
    }
  }

  snoozeReminder(habitId: string): void {
    // Set a temporary flag to prevent showing this reminder again for 5 minutes
    const now = this.timezoneService.getCurrentDate();
    const snoozeUntil = now.getTime() + (5 * 60 * 1000); // 5 minutes from now
    const snoozeKey = `hb_snooze_${habitId}_until`;
    localStorage.setItem(snoozeKey, snoozeUntil.toString());
    
    // Play gentle acknowledgment sound
    this.playSnoozeSound();
  }


}
