import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, OnDestroy, computed } from '@angular/core';
import { ChartComponent } from '../../../../shared';
import { Habit, WeeklyTrend, MonthlyTrend, YearlyTrend } from '../../../../shared/models/habit.model';
import { HabitService, NotificationService } from '../../../../shared';

export type ViewType = 'weekly' | 'monthly' | 'yearly';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, ChartComponent],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss'
})
export class StatsComponent implements OnInit, OnDestroy {
  protected readonly habits = signal<Habit[]>([]);
  protected readonly currentView = signal<ViewType>('weekly');

  constructor(
    protected readonly habitService: HabitService,
    private notificationService: NotificationService
  ) {
    // Subscribe to habits changes
    this.habitService.habits$.subscribe(habits => {
      this.habits.set(habits);
    });
  }

  protected getCurrentTrend(): WeeklyTrend | MonthlyTrend | YearlyTrend {
    switch (this.currentView()) {
      case 'weekly':
        return this.habitService.weeklyTrend();
      case 'monthly':
        return this.habitService.monthlyTrend();
      case 'yearly':
        return this.habitService.yearlyTrend();
      default:
        return this.habitService.weeklyTrend();
    }
  }

  protected switchView(view: ViewType): void {
    this.currentView.set(view);
  }

  ngOnInit(): void {
    // Periodic checks are centralized in NotificationService
    this.checkReminders();
  }

  ngOnDestroy(): void {}

  private checkReminders(): void {
    this.notificationService.checkReminders(this.habits());
  }

  // Comprehensive Statistics Methods
  protected getTotalDays(): number {
    const habits = this.habits();
    if (habits.length === 0) return 0;
    
    const allDates = new Set<string>();
    habits.forEach(habit => {
      if (habit.createdAt) {
        const startDate = new Date(habit.createdAt);
        const today = new Date();
        const current = new Date(startDate);
        
        while (current <= today) {
          allDates.add(current.toISOString().slice(0, 10));
          current.setDate(current.getDate() + 1);
        }
      }
    });
    
    return allDates.size;
  }

  protected getCompletionRate(): number {
    const habits = this.habits();
    if (habits.length === 0) return 0;
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    let totalPossible = 0;
    let totalCompleted = 0;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      
      habits.forEach(habit => {
        if (habit.createdAt && date >= new Date(habit.createdAt)) {
          totalPossible++;
          if (habit.checkIns && habit.checkIns[dateStr]) {
            totalCompleted++;
          }
        }
      });
    }
    
    return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  }

  protected getActiveStreaks(): number {
    return this.habits().filter(habit => {
      const stats = this.habitService.calcStreaksForHabit(habit);
      return stats.current > 0;
    }).length;
  }

  protected getAverageStreak(): number {
    const habits = this.habits();
    if (habits.length === 0) return 0;
    
    const totalStreaks = habits.reduce((sum, habit) => {
      const stats = this.habitService.calcStreaksForHabit(habit);
      return sum + stats.longest;
    }, 0);
    
    return Math.round(totalStreaks / habits.length);
  }

  protected getConsistencyScore(): number {
    const habits = this.habits();
    if (habits.length === 0) return 0;
    
    const consistencyScores = habits.map(habit => {
      const stats = this.habitService.calcStreaksForHabit(habit);
      const totalDays = this.getDaysSinceCreation(habit);
      if (totalDays === 0) return 0;
      return Math.round((stats.total / totalDays) * 100);
    });
    
    return Math.round(consistencyScores.reduce((sum, score) => sum + score, 0) / habits.length);
  }

  protected getTotalStreakBreaks(): number {
    return this.habits().reduce((total, habit) => {
      const stats = this.habitService.calcStreaksForHabit(habit);
      return total + (stats.breaks || 0);
    }, 0);
  }

  protected getMostProductiveDay(): string {
    const habits = this.habits();
    if (habits.length === 0) return 'N/A';
    
    const dayCounts: { [key: string]: number } = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    habits.forEach(habit => {
      if (habit.checkIns) {
        Object.keys(habit.checkIns).forEach(dateStr => {
          const day = new Date(dateStr).getDay();
          dayCounts[dayNames[day]] = (dayCounts[dayNames[day]] || 0) + 1;
        });
      }
    });
    
    const mostProductive = Object.keys(dayCounts).reduce((a, b) => 
      dayCounts[a] > dayCounts[b] ? a : b, 'Monday'
    );
    
    return mostProductive;
  }

  protected getTopPerformingHabits(): Habit[] {
    return [...this.habits()].sort((a, b) => {
      const rateA = this.getHabitCompletionRate(a);
      const rateB = this.getHabitCompletionRate(b);
      return rateB - rateA;
    });
  }

  protected getHabitCompletionRate(habit: Habit): number {
    const stats = this.habitService.calcStreaksForHabit(habit);
    const totalDays = this.getDaysSinceCreation(habit);
    if (totalDays === 0) return 0;
    return Math.round((stats.total / totalDays) * 100);
  }

  protected getHabitCurrentStreak(habit: Habit): number {
    const stats = this.habitService.calcStreaksForHabit(habit);
    return stats.current;
  }

  protected getWeeklyHeatmap(): number[][] {
    const weeks: number[][] = [];
    const today = new Date();
    
    for (let week = 11; week >= 0; week--) {
      const weekData: number[] = [];
      for (let day = 6; day >= 0; day--) {
        const date = new Date(today);
        date.setDate(date.getDate() - (week * 7 + day));
        const dateStr = date.toISOString().slice(0, 10);
        
        const dayTotal = this.habits().reduce((sum, habit) => 
          sum + ((habit.checkIns && habit.checkIns[dateStr]) ? 1 : 0), 0
        );
        
        weekData.push(dayTotal);
      }
      weeks.push(weekData);
    }
    
    return weeks;
  }

  protected getHeatmapColor(dayCount: number): string {
    if (dayCount === 0) return 'bg-slate-100';
    if (dayCount <= 2) return 'bg-green-200';
    if (dayCount <= 4) return 'bg-green-300';
    if (dayCount <= 6) return 'bg-green-400';
    return 'bg-green-500';
  }

  protected getWeeklyAverage(): number {
    const trend = this.habitService.weeklyTrend();
    const total = trend.data.reduce((sum, value) => sum + value, 0);
    return Math.round(total / trend.data.length * 10) / 10;
  }

  protected getMonthlyAverage(): number {
    const trend = this.habitService.monthlyTrend();
    const total = trend.data.reduce((sum, value) => sum + value, 0);
    return Math.round(total / trend.data.length * 10) / 10;
  }

  protected getWeeklyTrend(): WeeklyTrend {
    return this.habitService.weeklyTrend();
  }

  protected getMonthlyTrend(): MonthlyTrend {
    return this.habitService.monthlyTrend();
  }

  protected getYearlyTrend(): YearlyTrend {
    return this.habitService.yearlyTrend();
  }

  protected getYearlyTotal(): number {
    const trend = this.habitService.yearlyTrend();
    return trend.data.reduce((sum, value) => sum + value, 0);
  }

  protected getKeyInsights(): string[] {
    const insights: string[] = [];
    const habits = this.habits();
    
    if (habits.length === 0) {
      insights.push('Start creating habits to see insights here!');
      return insights;
    }
    
    const avgCompletion = this.habitService.averageCompletion();
    if (avgCompletion >= 80) {
      insights.push(`Excellent! You're maintaining ${avgCompletion}% average completion rate.`);
    } else if (avgCompletion >= 60) {
      insights.push(`Good progress! You're at ${avgCompletion}% completion rate.`);
    } else {
      insights.push(`You're at ${avgCompletion}% completion rate. Try to be more consistent!`);
    }
    
    const bestStreak = this.habitService.bestCurrentStreak();
    if (bestStreak >= 30) {
      insights.push(`Amazing! You have a ${bestStreak}-day streak going.`);
    } else if (bestStreak >= 7) {
      insights.push(`Great! You have a ${bestStreak}-day streak. Keep it up!`);
    }
    
    const mostProductive = this.getMostProductiveDay();
    insights.push(`${mostProductive}s are your most productive days.`);
    
    const activeStreaks = this.getActiveStreaks();
    if (activeStreaks === habits.length) {
      insights.push('All your habits have active streaks! 🎉');
    } else {
      insights.push(`${activeStreaks} out of ${habits.length} habits have active streaks.`);
    }
    
    return insights;
  }

  protected getRecentAchievements(): Array<{title: string, date: string}> {
    const achievements: Array<{title: string, date: string}> = [];
    const habits = this.habits();
    
    habits.forEach(habit => {
      const stats = this.habitService.calcStreaksForHabit(habit);
      
      // Check for milestone achievements
      if (stats.longest >= 100) {
        achievements.push({
          title: `100+ day streak in ${habit.title}`,
          date: 'All time'
        });
      } else if (stats.longest >= 30) {
        achievements.push({
          title: `30+ day streak in ${habit.title}`,
          date: 'All time'
        });
      }
      
      if (stats.current >= 7 && stats.current < 30) {
        achievements.push({
          title: `7+ day current streak in ${habit.title}`,
          date: 'Current'
        });
      }
    });
    
    // Add completion achievements
    const avgCompletion = this.habitService.averageCompletion();
    if (avgCompletion >= 90) {
      achievements.push({
        title: '90%+ Overall Completion Rate',
        date: 'Current'
      });
    }
    
    return achievements.slice(0, 5); // Limit to 5 most recent
  }

  protected getCurrentYear(): number {
    return new Date().getFullYear();
  }

  private getDaysSinceCreation(habit: Habit): number {
    if (!habit.createdAt) return 0;
    const created = new Date(habit.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
