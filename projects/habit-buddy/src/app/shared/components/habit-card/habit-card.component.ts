import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Habit, HabitStats } from '../../models/habit.model';

@Component({
  selector: 'app-habit-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './habit-card.component.html',
  styleUrl: './habit-card.component.scss'
})
export class HabitCardComponent {
  @Input() habit!: Habit;
  @Input() stats!: HabitStats;
  @Output() checkin = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();
  @Output() editReminder = new EventEmitter<void>();
  @Output() viewCalendar = new EventEmitter<void>();

  protected get completedCount(): number {
    return Object.keys(this.habit.checkIns || {}).length;
  }

  protected get isCheckedToday(): boolean {
    const today = new Date().toISOString().slice(0, 10);
    return !!(this.habit.checkIns && this.habit.checkIns[today]);
  }

  protected get completionPercentage(): number {
    return Math.round((this.completedCount / this.habit.daysTarget) * 100);
  }

  protected get daysRemaining(): number {
    return Math.max(0, this.habit.daysTarget - this.completedCount);
  }

  protected get isOnTrack(): boolean {
    const daysSinceStart = Math.ceil((Date.now() - new Date(this.habit.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const expectedProgress = Math.min(daysSinceStart, this.habit.daysTarget);
    return this.completedCount >= expectedProgress * 0.8; // 80% of expected progress
  }

  protected get milestoneStatus(): string {
    const percentage = this.completionPercentage;
    if (percentage >= 100) return '🎉 Completed!';
    if (percentage >= 75) return '🔥 Almost there!';
    if (percentage >= 50) return '💪 Halfway there!';
    if (percentage >= 25) return '🌟 Getting started!';
    return '🚀 Just beginning!';
  }

  protected get streakStatus(): string {
    if (this.stats.current >= 7) return `🔥 ${this.stats.current} day streak!`;
    if (this.stats.current >= 3) return `⚡ ${this.stats.current} day streak`;
    if (this.stats.current > 0) return `✨ ${this.stats.current} day streak`;
    return '💤 No streak yet';
  }

  protected getProgressDots(): { completed: boolean }[] {
    const dots = [];
    const maxDots = Math.min(this.habit.daysTarget, 10); // Max 10 dots for readability
    const completedDots = Math.round((this.completedCount / this.habit.daysTarget) * maxDots);
    
    for (let i = 0; i < maxDots; i++) {
      dots.push({ completed: i < completedDots });
    }
    
    return dots;
  }

  protected getDaysText(days: number[]): string {
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(d => weekdayNames[d]).join(',');
  }

  protected onCheckin(): void {
    this.checkin.emit();
  }

  protected onRemove(): void {
    this.remove.emit();
  }

  protected onEditReminder(): void {
    this.editReminder.emit();
  }

  protected onViewCalendar(): void {
    this.viewCalendar.emit();
  }
}
