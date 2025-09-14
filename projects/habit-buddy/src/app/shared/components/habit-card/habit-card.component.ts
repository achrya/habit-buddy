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
