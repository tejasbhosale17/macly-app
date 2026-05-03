import type { GoalProgress, Macros } from '../types';

export function emptyMacros(): Macros {
  return { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
}

export function scaleMacrosByGrams(per100g: Macros, grams: number): Macros {
  const factor = grams / 100;
  return {
    calories: round2(per100g.calories * factor),
    proteinG: round2(per100g.proteinG * factor),
    carbsG: round2(per100g.carbsG * factor),
    fatG: round2(per100g.fatG * factor),
  };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    calories: round2(a.calories + b.calories),
    proteinG: round2(a.proteinG + b.proteinG),
    carbsG: round2(a.carbsG + b.carbsG),
    fatG: round2(a.fatG + b.fatG),
  };
}

export function calculateMealTotals(items: Macros[]): Macros {
  return items.reduce<Macros>((acc, item) => addMacros(acc, item), emptyMacros());
}

export function calculateDailyTotals(mealTotals: Macros[]): Macros {
  return calculateMealTotals(mealTotals);
}

export function calculateProgressPercentage(consumed: number, goal: number): number {
  if (goal <= 0) {
    return 0;
  }
  return round2(Math.min(100, Math.max(0, (consumed / goal) * 100)));
}

export function calculateRemaining(consumed: number, goal: number): number {
  return round2(Math.max(0, goal - consumed));
}

export function calculateGoalProgress(consumed: Macros, goal: Macros): GoalProgress {
  return {
    calories: metric(consumed.calories, goal.calories),
    proteinG: metric(consumed.proteinG, goal.proteinG),
    carbsG: metric(consumed.carbsG, goal.carbsG),
    fatG: metric(consumed.fatG, goal.fatG),
  };
}

function metric(consumed: number, goal: number) {
  return {
    consumed: round2(consumed),
    goal: round2(goal),
    percentage: calculateProgressPercentage(consumed, goal),
    remaining: calculateRemaining(consumed, goal),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
