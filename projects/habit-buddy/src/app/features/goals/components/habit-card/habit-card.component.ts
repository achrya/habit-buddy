import { Component, Input, Output, EventEmitter, signal, computed, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Habit, HabitStats, BadgeLevel } from '../../../../shared/models/habit.model';
import { LucideAngularModule, Clock, Calendar, Trash2, Check, Crown, Trophy, Star, Target, Sprout, Sparkles, Link, RotateCcw, Bell } from 'lucide-angular';
import { BADGE_LEVELS, getBadgeConfig, getBadgeConfigForDays, calculateProgressToNextLevel } from '../../../../shared/config/badge-levels.config';
import { DialogComponent, DialogButton } from '../../../../shared/components/dialog/dialog.component';
import { CircularProgressComponent } from '../../../../shared/components/circular-progress/circular-progress.component';

@Component({
  selector: 'app-habit-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DialogComponent, CircularProgressComponent],
  templateUrl: './habit-card.component.html',
  styleUrl: './habit-card.component.scss'
})
export class HabitCardComponent {
  // Modern signal inputs - automatically reactive
  habit = input.required<Habit>();
  stats = input.required<HabitStats>();
  
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

  // Modern computed signals - automatically reactive to signal inputs
  protected readonly completedCount = computed(() => {
    const habit = this.habit();
    return Object.keys(habit?.checkIns || {}).length;
  });

  protected readonly isCheckedToday = computed(() => {
    const habit = this.habit();
    const today = new Date().toISOString().slice(0, 10);
    return !!(habit?.checkIns && habit.checkIns[today]);
  });

  // Progress calculation for the circular chart
  protected readonly progressPercentage = computed(() => {
    // Calculate percentage based on recent activity (last 14 days)
    const activityData = this.getRecentActivityDays();
    if (activityData.length === 0) {
      // Fallback to badge progress if no activity data
      const completed = this.completedCount();
      return calculateProgressToNextLevel(completed);
    }
    
    // Calculate percentage of completed days in recent activity
    const completedDays = activityData.filter(day => day.status === 'completed').length;
    const totalDays = activityData.length;
    return Math.round((completedDays / totalDays) * 100);
  });

  // Badge level text
  protected readonly badgeLevelText = computed(() => {
    const completed = this.completedCount();
    const badgeConfig = getBadgeConfigForDays(completed);
    return badgeConfig.name;
  });

  // Status text based on completion
  protected readonly statusText = computed(() => {
    if (this.isCheckedToday()) {
      return 'Good Job!';
    }
    return 'On Track';
  });

  // Motivational message
  protected readonly motivationalMessage = computed(() => {
    if (this.isCheckedToday()) {
      return "You're on fire! 🔥";
    }
    const stats = this.stats();
    if (stats.current >= 7) {
      return "Keep the streak alive!";
    } else if (stats.current >= 3) {
      return "Building momentum!";
    }
    return "Ready to check in?";
  });

  // Inspiring tooltip for chart hover
  protected readonly chartTooltip = computed(() => {
    const habit = this.habit();
    const completed = this.completedCount();
    const progress = this.progressPercentage();
    const level = this.badgeLevelText();
    const activityData = this.getRecentActivityDays();
    
    if (activityData.length > 0) {
      // Show recent activity-based messages
      const completedRecent = activityData.filter(day => day.status === 'completed').length;
      const streakBreaks = activityData.filter(day => day.status === 'break').length;
      const totalDays = activityData.length;
      
      const inspiringMessages = [
        `📊 ${progress}% consistency in\nlast ${totalDays} days!`,
        `🎯 ${completedRecent} out of ${totalDays} days\ncompleted recently!`,
        `💪 ${progress}% success rate\nshows great progress!`,
        `🌟 ${completedRecent} completed days\nout of ${totalDays} recent!`,
        `🚀 ${progress}% consistency\nbuilding strong habits!`,
        `✨ ${completedRecent}/${totalDays} recent days\ncompleted successfully!`,
        streakBreaks > 0 ? 
          `⚠️ ${streakBreaks} streak breaks\nbut ${progress}% overall success!` :
          `🔥 No streak breaks!\n${progress}% consistency rate!`,
        `🏆 ${progress}% recent performance\nkeep up the momentum!`
      ];
      
      const messageIndex = habit.id.charCodeAt(0) % inspiringMessages.length;
      return inspiringMessages[messageIndex];
    } else {
      // Fallback to badge-based messages
      const inspiringMessages = [
        `🌟 ${progress}% complete on your\njourney to ${level} level!`,
        `💪 ${completed} days of dedication\nbuilding something amazing!`,
        `🎯 Every day counts - you're\n${progress}% closer to mastery!`,
        `🚀 ${level} level achieved through\n${completed} days of consistency!`
      ];
      
      const messageIndex = habit.id.charCodeAt(0) % inspiringMessages.length;
      return inspiringMessages[messageIndex];
    }
  });

  // Badge styling methods
  protected getBadgeClasses(): string {
    const habit = this.habit();
    const completedDays = this.completedCount();
    
    // Get badge config (either from habit.badge or calculate from days)
    const badgeConfig = habit?.badge ? 
      getBadgeConfig(habit.badge.level) : 
      getBadgeConfigForDays(completedDays);
    
    if (badgeConfig) {
      const { background, text, border } = badgeConfig.colors;
      return `${background} ${text} border ${border}`;
    }
    
    return 'bg-gray-100 text-gray-600';
  }

  // Status message and styling
  // Helper to detect streak break
  private hasRecentStreakBreak(): boolean {
    const habit = this.habit();
    const stats = this.stats();
    
    // If current streak is 0 but longest streak is >= 3, check for recent break
    if (stats.current === 0 && stats.longest >= 3) {
      const checkIns = habit.checkIns || {};
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      
      // Check if there was a check-in in the last 3 days but not today/yesterday
      for (let i = 2; i <= 4; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        if (checkIns[date]) {
          return true; // Recent activity but current streak broken
        }
      }
    }
    
    return false;
  }

  // Generate recent activity data for visualization
  protected getRecentActivityDays(): Array<{date: string, status: string, tooltip: string}> {
    const habit = this.habit();
    const checkIns = habit.checkIns || {};
    const days = [];
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().slice(0, 10);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = date.getDate();
      
      let status = 'missed';
      let tooltip = `${dayName} ${dayNum}: Missed`;
      
      if (checkIns[dateStr]) {
        status = 'completed';
        tooltip = `${dayName} ${dayNum}: Completed ✅`;
      } else if (i === 0) {
        status = 'today';
        tooltip = `Today: ${checkIns[dateStr] ? 'Completed ✅' : 'Not yet completed'}`;
      } else {
        // Check if this is a streak break (had activity before and after)
        const prevDay = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const nextDay = new Date(Date.now() - (i - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        
        if (checkIns[prevDay] && (checkIns[nextDay] || i === 1)) {
          status = 'break';
          tooltip = `${dayName} ${dayNum}: Streak Break ⚠️`;
        }
      }
      
      days.push({ date: dateStr, status, tooltip });
    }
    
    return days;
  }

  protected getStatusMessage(): string {
    if (this.isCheckedToday()) {
      const messages = [
        "✅ Completed today!",
        "🎉 Well done today!",
        "⭐ Great job today!",
        "💪 Nailed it today!",
        "🔥 On fire today!"
      ];
      const habit = this.habit();
      const index = (habit?.id?.charCodeAt(0) ?? 0) % messages.length;
      return messages[index];
    } else {
      const stats = this.stats();
      
      // Check for streak break first
      if (this.hasRecentStreakBreak()) {
        return "⚠️ Streak broken - get back on track!";
      }
      
      if (stats.current >= 7) {
        return "🔥 Keep the streak alive!";
      } else if (stats.current >= 3) {
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
      const stats = this.stats();
      
      // Check for streak break first - show orange
      if (this.hasRecentStreakBreak()) {
        return 'bg-orange-50 text-orange-700 border border-orange-200';
      }
      
      if (stats.current >= 7) {
        return 'bg-red-50 text-red-700 border border-red-200';
      } else if (stats.current >= 3) {
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      } else {
        return 'bg-gray-50 text-gray-700 border border-gray-200';
      }
    }
  }

  protected getBadgeIcon(): any {
    const iconMap: { [key: string]: any } = {
      'Crown': Crown,
      'Trophy': Trophy,
      'Star': Star,
      'Target': Target,
      'Sprout': Sprout,
      'Sparkles': Sparkles
    };
    
    const habit = this.habit();
    const completedDays = this.completedCount();
    
    // Get badge config (either from habit.badge or calculate from days)
    const badgeConfig = habit?.badge ? 
      getBadgeConfig(habit.badge.level) : 
      getBadgeConfigForDays(completedDays);
    
    return iconMap[badgeConfig?.icon || 'Sparkles'] || Sparkles;
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
    const habit = this.habit();
    return `Are you sure you want to delete "${habit?.title || 'this habit'}"? This action cannot be undone and will remove all progress data.`;
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
  protected readonly LinkIcon = Link;
  protected readonly RotateCcwIcon = RotateCcw;
  protected readonly BellIcon = Bell;
}