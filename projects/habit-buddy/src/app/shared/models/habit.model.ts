export interface Habit {
  id: string;
  title: string;
  daysTarget: number;
  categoryId: string;
  color: string;
  createdAt: string;
  checkIns: Record<string, string>;
  reminder?: Reminder | null;
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

export interface HabitCategory {
  value: string;
  label: string;
  days: number;
}
