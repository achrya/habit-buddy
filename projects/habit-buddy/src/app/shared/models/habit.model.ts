export interface Habit {
  id: string;
  title: string;
  daysTarget: number;
  categoryId?: string; // Optional - will be assigned automatically
  badge?: HabitBadge | null; // Current badge level
  color: string;
  createdAt: string;
  checkIns: Record<string, string>;
  reminder?: Reminder | null;
}

export interface HabitBadge {
  level: BadgeLevel;
  name: string;
  description: string;
  icon: string;
  daysRequired: number;
  achievedAt?: string;
}

export enum BadgeLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
  MASTER = 'master'
}

export interface Reminder {
  time: string;
  days: number[];
  window: number;
}

export interface HabitStats {
  current: number;
  longest: number;
}

export interface WeeklyTrend {
  labels: string[];
  data: number[];
}

export interface MonthlyTrend {
  labels: string[];
  data: number[];
}

export interface YearlyTrend {
  labels: string[];
  data: number[];
}

export interface HabitCategory {
  value: string;
  label: string;
  days: number;
}
