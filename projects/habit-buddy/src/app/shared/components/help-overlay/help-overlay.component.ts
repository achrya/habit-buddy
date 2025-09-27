import { Component, Input, Output, EventEmitter, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, HelpCircle, X, Trophy, ArrowRight, Sprout, Target, Star, Crown, Sparkles, Settings } from 'lucide-angular';
import { HabitService } from '../../services/habit.service';
import { Habit } from '../../models/habit.model';
import { BADGE_LEVELS, BadgeConfig } from '../../config/badge-levels.config';
import { RouterModule } from '@angular/router';

interface BadgeLevel extends BadgeConfig {
  achieved: boolean;
  currentDays: number;
  progressPercentage: number;
}

@Component({
  selector: 'app-help-overlay',
  imports: [CommonModule, LucideAngularModule, RouterModule],
  templateUrl: './help-overlay.component.html',
  styleUrls: ['./help-overlay.component.scss']
})
export class HelpOverlayComponent {
  @Input({ required: true }) isOpen = false;
  @Output() close = new EventEmitter<void>();

  private habitService = inject(HabitService);

  // Icons
  protected readonly HelpCircleIcon = HelpCircle;
  protected readonly XIcon = X;
  protected readonly TrophyIcon = Trophy;
  protected readonly ArrowRightIcon = ArrowRight;
  protected readonly SettingsIcon = Settings;

  // Badge system guide - using centralized config
  protected readonly badgeSystemGuide = computed((): BadgeLevel[] => {
    const habits = this.habitService.habits();

    // Calculate best completed days across all habits
    const bestCompletedDays = habits.length > 0 ? 
      Math.max(...habits.map((habit: Habit) => Object.keys(habit.checkIns || {}).length)) : 0;

    return BADGE_LEVELS.map(badgeConfig => {
      const achieved = bestCompletedDays >= badgeConfig.daysRequired;
      const currentDays = Math.min(bestCompletedDays, badgeConfig.daysRequired);
      const progressPercentage = badgeConfig.daysRequired > 0 ? 
        (currentDays / badgeConfig.daysRequired) * 100 : 100;

      return {
        ...badgeConfig, // Spread all config properties
        achieved,
        currentDays,
        progressPercentage: Math.min(progressPercentage, 100)
      };
    });
  });

  protected onClose(): void {
    this.close.emit();
  }

  protected getFilterIcon(iconName: string): any {
    const iconMap: { [key: string]: any } = {
      'Sparkles': Sparkles,
      'Sprout': Sprout,
      'Target': Target,
      'Star': Star,
      'Trophy': Trophy,
      'Crown': Crown
    };
    return iconMap[iconName] || HelpCircle;
  }

}
