import type { ActivityLevel, Gender, GoalType } from '../types';

export interface AnthropometricInput {
  gender: Gender;
  ageYears: number;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
}

export interface MacroGoalSuggestion {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  tdee: number;
}

/**
 * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor equation
 * This is calories burned at rest (no activity)
 */
function calculateBMR(input: AnthropometricInput): number {
  const { gender, ageYears, weightKg, heightCm } = input;

  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
  }

  // female, other
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
}

/**
 * Get activity multiplier based on activity level
 * Applied to BMR to get TDEE (Total Daily Energy Expenditure)
 */
function getActivityMultiplier(activityLevel: ActivityLevel): number {
  const multipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2, // Little or no exercise
    light: 1.375, // 1-3 days/week light exercise
    moderate: 1.55, // 3-5 days/week moderate exercise
    active: 1.725, // 6-7 days/week intensive exercise
    very_active: 1.9, // 2x per day training
  };

  return multipliers[activityLevel];
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 */
function calculateTDEE(input: AnthropometricInput): number {
  const bmr = calculateBMR(input);
  const activityMultiplier = getActivityMultiplier(input.activityLevel);
  return Math.round(bmr * activityMultiplier);
}

/**
 * Get macro distribution percentages based on goal type
 * Returns { proteinPercent, carbsPercent, fatPercent }
 */
function getMacroDistribution(goalType: GoalType): {
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
} {
  const distributions: Record<
    GoalType,
    { proteinPercent: number; carbsPercent: number; fatPercent: number }
  > = {
    'fat-loss': {
      proteinPercent: 0.3, // 30% - preserves muscle during deficit
      carbsPercent: 0.45, // 45%
      fatPercent: 0.25, // 25%
    },
    maintenance: {
      proteinPercent: 0.25, // 25%
      carbsPercent: 0.5, // 50%
      fatPercent: 0.25, // 25%
    },
    'lean-bulk': {
      proteinPercent: 0.3, // 30%
      carbsPercent: 0.5, // 50%
      fatPercent: 0.2, // 20%
    },
    'muscle-gain': {
      proteinPercent: 0.3, // 30%
      carbsPercent: 0.5, // 50%
      fatPercent: 0.2, // 20%
    },
  };

  return distributions[goalType];
}

/**
 * Apply calorie adjustment for goal type
 * Fat loss: -500 cal/day (~0.5kg/week)
 * Maintenance: No change
 * Lean bulk: +300 cal/day (~0.3kg/week)
 * Muscle gain: +500 cal/day (~0.5kg/week)
 */
function applyGoalAdjustment(tdee: number, goalType: GoalType): number {
  const adjustments: Record<GoalType, number> = {
    'fat-loss': -500,
    maintenance: 0,
    'lean-bulk': 300,
    'muscle-gain': 500,
  };

  return Math.max(1200, tdee + adjustments[goalType]); // Never below 1200 cal minimum
}

/**
 * Calculate macro goals based on anthropometrics and goal type
 */
export function calculateMacroGoals(
  input: AnthropometricInput,
  goalType: GoalType,
): MacroGoalSuggestion {
  const tdee = calculateTDEE(input);
  const adjustedCalories = applyGoalAdjustment(tdee, goalType);
  const distribution = getMacroDistribution(goalType);

  // Calculate grams from percentages
  // Carbs and protein: 4 cal/g, Fat: 9 cal/g
  const proteinG = Math.round((adjustedCalories * distribution.proteinPercent) / 4);
  const carbsG = Math.round((adjustedCalories * distribution.carbsPercent) / 4);
  const fatG = Math.round((adjustedCalories * distribution.fatPercent) / 9);

  return {
    calories: adjustedCalories,
    proteinG,
    carbsG,
    fatG,
    tdee,
  };
}

/**
 * Get human-readable descriptions of goal types
 */
export function getGoalTypeLabel(goalType: GoalType): string {
  const labels: Record<GoalType, string> = {
    'fat-loss': 'Fat Loss',
    maintenance: 'Maintenance',
    'lean-bulk': 'Lean Bulk',
    'muscle-gain': 'Muscle Gain',
  };
  return labels[goalType];
}

/**
 * Get goal description with calorie adjustment info
 */
export function getGoalDescription(goalType: GoalType): string {
  const descriptions: Record<GoalType, string> = {
    'fat-loss': 'Lose weight (~0.5kg/week) while preserving muscle',
    maintenance: 'Maintain current weight and muscle',
    'lean-bulk': 'Gain lean weight (~0.3kg/week) with minimal fat',
    'muscle-gain': 'Build muscle (~0.5kg/week) with some fat gain',
  };
  return descriptions[goalType];
}
