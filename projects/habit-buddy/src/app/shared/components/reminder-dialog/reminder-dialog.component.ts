import { Component, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Clock, CheckCircle, X, Bell } from 'lucide-angular';
import { Habit, Reminder } from '../../models/habit.model';

@Component({
  selector: 'app-reminder-dialog',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './reminder-dialog.component.html',
  styleUrl: './reminder-dialog.component.scss'
})
export class ReminderDialogComponent implements OnChanges {
  @Input() isOpen = signal(false);
  @Input() habit!: Habit | null;
  @Input() reminder!: Reminder | null;
  
  @Output() close = new EventEmitter<void>();
  @Output() markAsDone = new EventEmitter<string>();
  @Output() snooze = new EventEmitter<string>();

  protected readonly ClockIcon = Clock;
  protected readonly CheckCircleIcon = CheckCircle;
  protected readonly XIcon = X;
  protected readonly BellIcon = Bell;

  protected onClose(): void {
    this.close.emit();
  }

  protected onMarkAsDone(): void {
    if (this.habit) {
      this.markAsDone.emit(this.habit.id);
    }
    this.close.emit();
  }

  protected onSnooze(): void {
    if (this.habit) {
      this.snooze.emit(this.habit.id);
    }
    this.close.emit();
  }

  protected getDaysText(days: number[]): string {
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.map(d => weekdayNames[d]).join(', ');
  }

  protected formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Dialog state changes handled automatically
  }
}
