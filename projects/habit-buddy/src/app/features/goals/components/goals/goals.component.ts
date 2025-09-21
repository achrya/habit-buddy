import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, ViewChild, inject, computed, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HabitCardComponent } from '../habit-card/habit-card.component';
import { HabitFormComponent } from '../habit-form/habit-form.component';
import { DialogService } from '../../../../shared/services/dialog.service';
import { Habit, Reminder, BadgeLevel } from '../../../../shared/models/habit.model';
import { HabitService, NotificationService } from '../../../../shared';
import { ReminderModalComponent } from '../../../reminders/components/reminder-modal/reminder-modal.component';
import { LucideAngularModule, Grid3X3, Sprout, Target, Star, Trophy, Crown, Flame, Bell, Sparkles, CheckCircle, ChevronDown, Filter, Info, ArrowRight, HelpCircle, Plus } from 'lucide-angular';
import { HelpOverlayComponent } from '../../../../shared/components/help-overlay/help-overlay.component';
import { getBadgeFilterOptions, BADGE_LEVELS, getBadgeConfigForDays } from '../../../../shared/config/badge-levels.config';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule, HabitCardComponent, HabitFormComponent, ReminderModalComponent, LucideAngularModule, HelpOverlayComponent],
  templateUrl: './goals.component.html',
  styleUrl: './goals.component.scss'
})
export class GoalsComponent implements OnInit, OnDestroy {
  @ViewChild('reminderModal') reminderModal!: ReminderModalComponent;
  @ViewChild(HabitFormComponent) habitForm!: HabitFormComponent;
  
  protected readonly habits = signal<Habit[]>([]);
  
  // Filter state
  protected readonly activeFilter = signal<string>('all');
  protected readonly showFilters = signal<boolean>(false);
  
  // Help overlay state
  protected readonly showHelpOverlay = signal<boolean>(false);
  
  // Mobile form dialog state
  protected readonly showMobileFormDialog = signal<boolean>(false);
  

  // Other filter options (Status, features, etc.)
  protected readonly otherFilterOptions = [
    { value: 'active', label: 'Active Streaks', count: 0, icon: 'Flame' },
    { value: 'with-reminders', label: 'With Reminders', count: 0, icon: 'Bell' },
    { value: 'recent', label: 'Recent (7 days)', count: 0, icon: 'Sparkles' },
    { value: 'completed-today', label: 'Done Today', count: 0, icon: 'CheckCircle' }
  ];
  
  // Computed filtered habits
  protected readonly filteredHabits = computed(() => {
    const filter = this.activeFilter();
    const allHabits = this.habits();
    
    switch (filter) {
      case 'all':
        return allHabits;
      case 'active':
        return allHabits.filter(habit => {
          const stats = this.getHabitStats(habit);
          return stats.current > 0;
        });
      case 'novice':
        return allHabits.filter(habit => habit.badge?.level === BadgeLevel.NOVICE);
      case 'beginner':
        return allHabits.filter(habit => habit.badge?.level === BadgeLevel.BEGINNER);
      case 'intermediate':
        return allHabits.filter(habit => habit.badge?.level === BadgeLevel.INTERMEDIATE);
      case 'advanced':
        return allHabits.filter(habit => habit.badge?.level === BadgeLevel.ADVANCED);
      case 'expert':
        return allHabits.filter(habit => habit.badge?.level === BadgeLevel.EXPERT);
      case 'master':
        return allHabits.filter(habit => habit.badge?.level === BadgeLevel.MASTER);
      case 'with-reminders':
        return allHabits.filter(habit => habit.reminder !== null);
      case 'recent':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return allHabits.filter(habit => {
          const createdDate = new Date(habit.createdAt);
          return createdDate >= sevenDaysAgo;
        });
      case 'completed-today':
        const today = new Date().toISOString().slice(0, 10);
        return allHabits.filter(habit => habit.checkIns && habit.checkIns[today]);
      default:
        return allHabits;
    }
  });
  
  // Computed values for better performance
  protected readonly hasHabits = computed(() => this.habits().length > 0);
  protected readonly hasFilteredHabits = computed(() => this.filteredHabits().length > 0);
  
  // Computed batch filter options with counts

  // Computed other filter options with counts
  protected readonly otherFilterOptionsWithCounts = computed(() => {
    const allHabits = this.habits();
    
    return this.otherFilterOptions.map(option => {
      let count = 0;
      
      switch (option.value) {
        case 'active':
          count = allHabits.filter(habit => {
            const stats = this.getHabitStats(habit);
            return stats.current > 0;
          }).length;
          break;
        case 'with-reminders':
          count = allHabits.filter(habit => habit.reminder !== null).length;
          break;
        case 'recent':
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          count = allHabits.filter(habit => {
            const createdDate = new Date(habit.createdAt);
            return createdDate >= sevenDaysAgo;
          }).length;
          break;
        case 'completed-today':
          const today = new Date().toISOString().slice(0, 10);
          count = allHabits.filter(habit => habit.checkIns && habit.checkIns[today]).length;
          break;
      }
      
      return { ...option, count };
    });
  });

  // Computed active filter label
  protected readonly activeFilterLabel = computed(() => {
    const currentFilter = this.activeFilter();
    
    // Check badge levels first
    if (currentFilter === 'all') return 'All Goals';
    const badge = this.badgeLevelsConfig.find(b => b.level === currentFilter);
    if (badge) return badge.name;
    
    // Check other filter options
    const otherOption = this.otherFilterOptionsWithCounts().find(option => option.value === currentFilter);
    return otherOption?.label || 'Active';
  });

  // Computed active filter count
  protected readonly activeFilterCount = computed(() => {
    const currentFilter = this.activeFilter();
    
    // Check badge levels first
    if (currentFilter === 'all') return this.getTotalHabitsCount();
    if (this.badgeLevelsConfig.find(b => b.level === currentFilter)) {
      return this.getBadgeFilterCount(currentFilter);
    }
    
    // Check other filter options
    const otherOption = this.otherFilterOptionsWithCounts().find(option => option.value === currentFilter);
    return otherOption?.count || 0;
  });


  
  // Simplified reminder modal state
  protected readonly selectedHabit = signal<Habit | null>(null);
  
  // Interval management
  private reminderCheckInterval?: number;

  private habitService = inject(HabitService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private dialogService = inject(DialogService);

  constructor() {
    // Subscribe to habits changes
    this.habitService.habits$.subscribe(habits => {
      this.habits.set(habits);
    });
  }

  ngOnInit(): void {
    // Only set interval in browser environment
    if (typeof window !== 'undefined') {
      this.reminderCheckInterval = window.setInterval(() => {
        this.checkReminders();
      }, 30000);
    }
    
    // Check immediately
    this.checkReminders();
  }

  ngOnDestroy(): void {
    // Clean up interval to prevent memory leaks
    if (this.reminderCheckInterval) {
      clearInterval(this.reminderCheckInterval);
    }
  }

  protected onHabitAdded(habit: { title: string; reminder?: Reminder | null }): void {
    const newHabit = this.habitService.addHabit(habit.title, habit.reminder);
    this.notificationService.playBell();
    this.notificationService.triggerConfetti();
  }

  protected async onCheckin(habitId: string): Promise<void> {
    const result = await this.habitService.toggleCheckinToday(habitId);
    if (result.success) {
      this.notificationService.playBell();
      this.notificationService.triggerConfetti();
    } else if (result.message) {
      this.dialogService.showError(result.message);
    }
  }

  protected onRemoveHabit(habitId: string): void {
    // This is handled by the habit card's dialog component
    this.habitService.removeHabit(habitId);
  }

  protected onEditReminder(habitId: string): void {
    const habit = this.habits().find(h => h.id === habitId);
    if (habit) {
      this.selectedHabit.set(habit);
      this.reminderModal.open();
    }
  }

  protected onViewCalendar(habitId: string): void {
    // Navigate to calendar view with specific habit filter
    this.router.navigate(['/calendar'], { 
      queryParams: { habitId: habitId }
    });
  }

  protected onSaveReminder(event: { habitId: string; reminder: Reminder | null }): void {
    if (event.habitId === 'form') {
      // Handle form reminder
      this.habitForm.setReminder(event.reminder);
    } else {
      // Handle existing habit reminder
      this.habitService.updateHabitReminder(event.habitId, event.reminder);
    }
    this.selectedHabit.set(null);
  }

  protected onOpenReminderModal(): void {
    // Create a temporary habit object for form reminder
    this.selectedHabit.set({
      id: 'form',
      title: 'New Habit',
      reminder: null
    } as Habit);
    this.reminderModal.open();
  }

  protected getHabitStats(habit: Habit) {
    return this.habitService.calcStreaksForHabit(habit);
  }

  protected onFilterChange(filterValue: string): void {
    this.activeFilter.set(filterValue);
    this.showFilters.set(false); // Close dropdown after selection
  }

  protected toggleFilters(): void {
    this.showFilters.set(!this.showFilters());
  }

  protected toggleHelpOverlay(): void {
    this.showHelpOverlay.set(!this.showHelpOverlay());
  }
  
  // Mobile form dialog methods
  protected openMobileFormDialog(): void {
    this.showMobileFormDialog.set(true);
  }
  
  protected closeMobileFormDialog(): void {
    this.showMobileFormDialog.set(false);
  }
  
  protected onMobileHabitAdded(habit: { title: string; reminder?: Reminder | null }): void {
    this.onHabitAdded(habit);
    this.closeMobileFormDialog();
  }


  protected getFilterIcon(iconName: string): any {
    const iconMap: { [key: string]: any } = {
      'Grid3X3': Grid3X3,
      'Sparkles': Sparkles,
      'Sprout': Sprout,
      'Target': Target,
      'Star': Star,
      'Trophy': Trophy,
      'Crown': Crown,
      'Flame': Flame,
      'Bell': Bell,
      'CheckCircle': CheckCircle,
      'target': Target  // Add lowercase version for compatibility
    };
    
    const icon = iconMap[iconName];
    if (!icon) {
      console.warn(`Icon '${iconName}' not found in iconMap. Available icons:`, Object.keys(iconMap));
      return Target; // Fallback to Target icon
    }
    return icon;
  }

  // Create a tracking key that changes when checkIns change
  protected getHabitTrackingKey(habit: Habit): string {
    const checkInsHash = JSON.stringify(habit.checkIns || {});
    return `${habit.id}-${checkInsHash.slice(0, 10)}`; // Include checkIns in tracking
  }


  // Icon references
  protected readonly ChevronDownIcon = ChevronDown;
  protected readonly FilterIcon = Filter;
  protected readonly HelpCircleIcon = HelpCircle;
  protected readonly PlusIcon = Plus;

  // Badge levels configuration
  protected readonly badgeLevelsConfig = BADGE_LEVELS;

  // Helper methods for legend-filter section
  protected getTotalHabitsCount(): number {
    return this.habits().length;
  }

  protected getBadgeFilterCount(level: string): number {
    return this.habits().filter(habit => {
      const stats = this.habitService.calcStreaksForHabit(habit);
      const badgeConfig = getBadgeConfigForDays(stats.current);
      return badgeConfig.level === level;
    }).length;
  }

  private checkReminders(): void {
    this.notificationService.checkReminders(this.habits());
  }
}
