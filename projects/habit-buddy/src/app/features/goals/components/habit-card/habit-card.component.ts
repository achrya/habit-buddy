import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Habit, HabitStats, BadgeLevel } from '../../../../shared/models/habit.model';
import { LucideAngularModule, Clock, Calendar, Trash2, Check, Crown, Trophy, Star, Target, Sprout, Sparkles } from 'lucide-angular';
import { DialogComponent, DialogButton } from '../../../../shared/components/dialog/dialog.component';

@Component({
  selector: 'app-habit-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DialogComponent],
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

  // Dialog state
  protected showDeleteDialog = signal(false);
  protected deleteDialogButtons: DialogButton[] = [
    { label: 'Cancel', action: 'cancel', variant: 'secondary' },
    { label: 'Delete', action: 'confirm', variant: 'danger' }
  ];

  // Computed signals for better performance
  protected readonly completedCount = computed(() => 
    Object.keys(this.habit.checkIns || {}).length
  );

  protected readonly isCheckedToday = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return !!(this.habit.checkIns && this.habit.checkIns[today]);
  });

  // Badge styling methods
  protected getBadgeClasses(): string {
    // If habit has a badge, use its level for styling
    if (this.habit.badge) {
      switch (this.habit.badge.level) {
        case BadgeLevel.BEGINNER:
          return 'bg-green-100 text-green-700 border border-green-200';
        case BadgeLevel.INTERMEDIATE:
          return 'bg-blue-100 text-blue-700 border border-blue-200';
        case BadgeLevel.ADVANCED:
          return 'bg-purple-100 text-purple-700 border border-purple-200';
        case BadgeLevel.EXPERT:
          return 'bg-orange-100 text-orange-700 border border-orange-200';
        case BadgeLevel.MASTER:
          return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
        default:
          return 'bg-gray-100 text-gray-600';
      }
    }
    
    // If no badge, determine styling based on current progress
    const completedDays = this.completedCount();
    
    if (completedDays >= 100) {
      return 'bg-yellow-100 text-yellow-700 border border-yellow-200'; // Master
    } else if (completedDays >= 50) {
      return 'bg-orange-100 text-orange-700 border border-orange-200'; // Expert
    } else if (completedDays >= 21) {
      return 'bg-purple-100 text-purple-700 border border-purple-200'; // Advanced
    } else if (completedDays >= 7) {
      return 'bg-blue-100 text-blue-700 border border-blue-200'; // Intermediate
    } else if (completedDays >= 3) {
      return 'bg-green-100 text-green-700 border border-green-200'; // Beginner
    } else {
      return 'bg-gray-100 text-gray-600'; // New habit
    }
  }

  // Status message and styling
  protected getStatusMessage(): string {
    if (this.isCheckedToday()) {
      const messages = [
        "✅ Completed today!",
        "🎉 Well done today!",
        "⭐ Great job today!",
        "💪 Nailed it today!",
        "🔥 On fire today!"
      ];
      const index = this.habit.id.charCodeAt(0) % messages.length;
      return messages[index];
    } else {
      if (this.stats.current >= 7) {
        return "🔥 Keep the streak alive!";
      } else if (this.stats.current >= 3) {
        return "⚡ Building momentum!";
      } else {
        return "🚀 Ready to check in?";
      }
    }
  }

  protected getStatusClasses(): string {
    if (this.isCheckedToday()) {
      return 'bg-green-50 text-green-700 border border-green-200';
    } else {
      if (this.stats.current >= 7) {
        return 'bg-red-50 text-red-700 border border-red-200';
      } else if (this.stats.current >= 3) {
        return 'bg-orange-50 text-orange-700 border border-orange-200';
      } else {
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      }
    }
  }

  protected getBadgeIcon(): any {
    const iconMap: { [key: string]: any } = {
      'Crown': Crown,
      'Trophy': Trophy,
      'Star': Star,
      'Target': Target,
      'Sprout': Sprout
    };
    
    // If habit has a badge, use its icon
    if (this.habit.badge && this.habit.badge.icon) {
      return iconMap[this.habit.badge.icon] || Sprout;
    }
    
    // If no badge, determine icon based on current progress
    const completedDays = this.completedCount();
    
    if (completedDays >= 100) {
      return Crown; // Master level
    } else if (completedDays >= 50) {
      return Trophy; // Expert level
    } else if (completedDays >= 21) {
      return Star; // Advanced level
    } else if (completedDays >= 7) {
      return Target; // Intermediate level
    } else if (completedDays >= 3) {
      return Sprout; // Beginner level
    } else {
      return Sparkles; // New habit (less than 3 days)
    }
  }

  protected getDaysText(days: number[]): string {
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(d => weekdayNames[d]).join(',');
  }

  protected onCheckin(): void {
    this.checkin.emit();
  }

  protected onRemove(): void {
    this.showDeleteDialog.set(true);
  }

  protected onDeleteDialogClose(): void {
    this.showDeleteDialog.set(false);
  }

  protected onDeleteDialogAction(action: string): void {
    if (action === 'confirm') {
      this.remove.emit();
    }
    this.showDeleteDialog.set(false);
  }

  protected getDeleteMessage(): string {
    return `Are you sure you want to delete "${this.habit.title}"? This action cannot be undone and will remove all progress data.`;
  }

  protected onEditReminder(): void {
    this.editReminder.emit();
  }

  protected onViewCalendar(): void {
    this.viewCalendar.emit();
  }

  // Lucide icons
  protected readonly ClockIcon = Clock;
  protected readonly CalendarIcon = Calendar;
  protected readonly Trash2Icon = Trash2;
  protected readonly CheckIcon = Check;
}