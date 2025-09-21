import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, HelpCircle, X, Trophy, ArrowRight, Sprout, Target, Star, Crown, Sparkles } from 'lucide-angular';
import { HabitService } from '../../services/habit.service';
import { Habit } from '../../models/habit.model';
import { BADGE_LEVELS, BadgeConfig } from '../../config/badge-levels.config';

interface BadgeLevel extends BadgeConfig {
  achieved: boolean;
  currentDays: number;
  progressPercentage: number;
}

@Component({
  selector: 'app-help-overlay',
  imports: [CommonModule, LucideAngularModule],
  template: `
    <!-- Help Overlay -->
    @if (isOpen) {
      <div class="help-overlay fixed inset-0 z-50 flex items-center justify-end">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
             (click)="onClose()"></div>
        
        <!-- Help Panel -->
        <div class="help-panel relative w-full max-w-md lg:max-w-2xl h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
          <!-- Header -->
          <div class="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <lucide-icon [img]="HelpCircleIcon" size="20" class="text-blue-600"></lucide-icon>
              <h2 class="text-lg font-semibold text-slate-800">Help & Guide</h2>
            </div>
            <button
              type="button"
              (click)="onClose()"
              class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <lucide-icon [img]="XIcon" size="20"></lucide-icon>
            </button>
          </div>

          <!-- Content -->
          <div class="p-4 space-y-6">
            <!-- Badge System Guide Section -->
            <div class="help-section">
              <div class="flex items-center gap-2 mb-4">
                <lucide-icon [img]="TrophyIcon" size="18" class="text-blue-600"></lucide-icon>
                <h3 class="text-md font-semibold text-slate-800">Badge System</h3>
              </div>
              
              <div class="space-y-4">
                <!-- Badge Progression Path -->
                <!-- Desktop Horizontal Layout -->
                <div class="hidden lg:flex items-center justify-center gap-1 mb-4">
                  @for (badge of badgeSystemGuide(); track badge.level; let i = $index) {
                    <div class="flex items-center gap-1">
                      <!-- Badge Card -->
                      <div class="badge-guide-card flex flex-col items-center p-2 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-all duration-200 min-w-[70px] max-w-[80px]"
                           [class.bg-gradient-to-br]="badge.achieved"
                           [class.from-yellow-50]="badge.achieved"
                           [class.to-orange-50]="badge.achieved"
                           [class.border-yellow-300]="badge.achieved">
                        
                        <!-- Badge Icon -->
                        <div class="badge-icon mb-2 p-2 rounded-full {{ badge.colors.background }}"
                             [class]="badge.colors.text">
                          <lucide-icon [img]="getFilterIcon(badge.icon)" size="18"></lucide-icon>
                        </div>
                        
                        <!-- Badge Info -->
                        <div class="text-center">
                          <h4 class="text-sm font-semibold text-slate-800 mb-1 leading-tight">{{ badge.name }}</h4>
                          <p class="text-xs text-slate-600 mb-1">{{ badge.daysRequired === 0 ? '0-6' : badge.daysRequired + '+' }} days</p>
                          
                          <!-- Progress Status -->
                          <div class="text-xs">
                            @if (badge.achieved) {
                              <span class="text-green-600 font-medium">✓</span>
                            } @else {
                              <span class="text-slate-500">{{ badge.currentDays }}/{{ badge.daysRequired }}</span>
                            }
                          </div>
                        </div>
                      </div>
                      
                      <!-- Connecting Arrow -->
                      @if (i < badgeSystemGuide().length - 1) {
                        <div class="flex items-center mx-0.5">
                          <lucide-icon [img]="ArrowRightIcon" size="12" class="text-slate-400"></lucide-icon>
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- Mobile Vertical Layout -->
                <div class="lg:hidden space-y-3 mb-4">
                  @for (badge of badgeSystemGuide(); track badge.level; let i = $index) {
                    <div class="flex items-center gap-3">
                      <!-- Step Number -->
                      <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                        {{ i + 1 }}
                      </div>
                      
                      <!-- Badge Card -->
                      <div class="badge-guide-card flex-1 flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-all duration-200"
                           [class.bg-gradient-to-r]="badge.achieved"
                           [class.from-yellow-50]="badge.achieved"
                           [class.to-orange-50]="badge.achieved"
                           [class.border-yellow-300]="badge.achieved">
                        
                        <!-- Badge Icon -->
                        <div class="badge-icon p-2 rounded-full flex-shrink-0 {{ badge.colors.background }}"
                             [class]="badge.colors.text">
                          <lucide-icon [img]="getFilterIcon(badge.icon)" size="20"></lucide-icon>
                        </div>
                        
                        <!-- Badge Info -->
                        <div class="flex-1">
                          <h4 class="text-sm font-semibold text-slate-800 mb-1">{{ badge.name }}</h4>
                          <p class="text-xs text-slate-600 mb-1">{{ badge.daysRequired === 0 ? '0-6' : badge.daysRequired + '+' }} days</p>
                          
                          <!-- Progress Status -->
                          <div class="text-xs">
                            @if (badge.achieved) {
                              <span class="text-green-600 font-medium">✓ Achieved</span>
                            } @else {
                              <span class="text-slate-500">{{ badge.currentDays }}/{{ badge.daysRequired }}</span>
                            }
                          </div>
                        </div>
                        
                        <!-- Progress Bar -->
                        <div class="w-12 h-2 bg-slate-200 rounded-full overflow-hidden flex-shrink-0">
                          <div class="h-full bg-blue-500 rounded-full transition-all duration-500"
                               [style.width.%]="badge.progressPercentage"></div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
                
                <!-- Explanation -->
                <div class="bg-blue-50 rounded-lg p-4">
                  <h4 class="text-sm font-semibold text-blue-800 mb-2">How to Earn Badges</h4>
                  <ul class="text-sm text-blue-700 space-y-1">
                    <li>• Complete habits consistently to build streaks</li>
                    <li>• Each badge requires a specific number of consecutive days</li>
                    <li>• Your longest streak determines your current badge level</li>
                    <li>• Higher badges unlock as you progress through the levels</li>
                  </ul>
                </div>

                <!-- Tips -->
                <div class="bg-green-50 rounded-lg p-4">
                  <h4 class="text-sm font-semibold text-green-800 mb-2">💡 Pro Tips</h4>
                  <ul class="text-sm text-green-700 space-y-1">
                    <li>• Start with small, achievable habits</li>
                    <li>• Use reminders to stay consistent</li>
                    <li>• Don't worry if you miss a day - just restart your streak</li>
                    <li>• Focus on building the habit, not just the streak</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Future sections can be added here -->
            <div class="help-section">
              <div class="text-center text-slate-500 text-sm py-8">
                <p>More help sections coming soon!</p>
                <p class="text-xs mt-1">Filtering, Statistics, and more guides.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
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
