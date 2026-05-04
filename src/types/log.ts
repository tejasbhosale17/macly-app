import type { Macros } from './food';
import type { MealType, MealWithItems } from './meal';
import type { GoalType } from './user';

export type DailyLog = {
  id: number;
  date: string;
  userId: number;
  createdAt: string;
};

export type MacroProgressMetric = {
  consumed: number;
  goal: number;
  percentage: number;
  remaining: number;
};

export type GoalProgress = {
  calories: MacroProgressMetric;
  proteinG: MacroProgressMetric;
  carbsG: MacroProgressMetric;
  fatG: MacroProgressMetric;
};

export type DashboardData = {
  date: string;
  meals: Record<MealType, MealWithItems>;
  totals: Macros;
  progress: GoalProgress;
  goalType: GoalType | null;
};

export type HistoryDay = {
  date: string;
  totals: Macros;
};
