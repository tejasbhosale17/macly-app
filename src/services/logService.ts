import { MEAL_TYPES } from '../constants/meals';
import { getDb } from '../db/client';
import { getFoodById } from '../repositories/foodRepository';
import { getOrCreateDailyLog } from '../repositories/dailyLogRepository';
import {
  createMealItem,
  deleteMealItem,
  ensureMealsForDay,
  getMealItemById,
  getOrCreateMeal,
  listMealItemsForDay,
  updateMealItem,
} from '../repositories/mealRepository';
import { getMacroGoals } from '../repositories/macroGoalsRepository';
import type { DashboardData, HistoryDay, Macros, MealItemWithFood, MealType } from '../types';
import {
  calculateDailyTotals,
  calculateGoalProgress,
  calculateMealTotals,
  emptyMacros,
  scaleMacrosByGrams,
} from '../utils/macroCalculations';

export async function getDashboardData(date: string): Promise<DashboardData> {
  const dailyLog = await getOrCreateDailyLog(date);
  await ensureMealsForDay(dailyLog.id);

  const items = await listMealItemsForDay(dailyLog.id);

  const itemsByMeal: Record<MealType, MealItemWithFood[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
  };

  for (const item of items) {
    itemsByMeal[item.mealType].push(item);
  }

  const meals = {
    breakfast: {
      meal: await getOrCreateMeal(dailyLog.id, 'breakfast'),
      items: itemsByMeal.breakfast,
      totals: calculateMealTotals(itemsByMeal.breakfast.map(toMacros)),
    },
    lunch: {
      meal: await getOrCreateMeal(dailyLog.id, 'lunch'),
      items: itemsByMeal.lunch,
      totals: calculateMealTotals(itemsByMeal.lunch.map(toMacros)),
    },
    dinner: {
      meal: await getOrCreateMeal(dailyLog.id, 'dinner'),
      items: itemsByMeal.dinner,
      totals: calculateMealTotals(itemsByMeal.dinner.map(toMacros)),
    },
    snacks: {
      meal: await getOrCreateMeal(dailyLog.id, 'snacks'),
      items: itemsByMeal.snacks,
      totals: calculateMealTotals(itemsByMeal.snacks.map(toMacros)),
    },
  };

  const totals = calculateDailyTotals(MEAL_TYPES.map((mealType) => meals[mealType].totals));
  const goals = await getMacroGoals();
  const goalValues: Macros = goals
    ? {
        calories: goals.calories,
        proteinG: goals.proteinG,
        carbsG: goals.carbsG,
        fatG: goals.fatG,
      }
    : emptyMacros();

  return {
    date,
    meals,
    totals,
    progress: calculateGoalProgress(totals, goalValues),
    goalType: goals?.goalType ?? null,
  };
}

export async function createFoodLogEntry(input: {
  date: string;
  mealType: MealType;
  foodId: number;
  quantityG: number;
}): Promise<void> {
  const food = await getFoodById(input.foodId);

  if (!food) {
    throw new Error('Food not found');
  }

  const scaled = scaleMacrosByGrams(
    {
      calories: food.caloriesPer100g,
      proteinG: food.proteinPer100g,
      carbsG: food.carbsPer100g,
      fatG: food.fatPer100g,
    },
    input.quantityG,
  );

  const dailyLog = await getOrCreateDailyLog(input.date);
  const meal = await getOrCreateMeal(dailyLog.id, input.mealType);

  await createMealItem({
    mealId: meal.id,
    foodId: input.foodId,
    quantityG: input.quantityG,
    calories: scaled.calories,
    proteinG: scaled.proteinG,
    carbsG: scaled.carbsG,
    fatG: scaled.fatG,
  });
}

export async function updateFoodLogEntry(input: {
  mealItemId: number;
  quantityG: number;
}): Promise<void> {
  const mealItem = await getMealItemById(input.mealItemId);

  if (!mealItem) {
    throw new Error('Meal item not found');
  }

  const food = await getFoodById(mealItem.foodId);

  if (!food) {
    throw new Error('Food not found for meal item');
  }

  const scaled = scaleMacrosByGrams(
    {
      calories: food.caloriesPer100g,
      proteinG: food.proteinPer100g,
      carbsG: food.carbsPer100g,
      fatG: food.fatPer100g,
    },
    input.quantityG,
  );

  await updateMealItem({
    mealItemId: input.mealItemId,
    quantityG: input.quantityG,
    calories: scaled.calories,
    proteinG: scaled.proteinG,
    carbsG: scaled.carbsG,
    fatG: scaled.fatG,
  });
}

export async function deleteFoodLogEntry(mealItemId: number): Promise<void> {
  await deleteMealItem(mealItemId);
}

export async function getHistory(limit = 30): Promise<HistoryDay[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT
      dl.date as date,
      ROUND(SUM(mi.calories), 2) as calories,
      ROUND(SUM(mi.protein_g), 2) as protein_g,
      ROUND(SUM(mi.carbs_g), 2) as carbs_g,
      ROUND(SUM(mi.fat_g), 2) as fat_g
     FROM daily_log dl
     INNER JOIN meal m ON m.daily_log_id = dl.id
     INNER JOIN meal_item mi ON mi.meal_id = m.id
     GROUP BY dl.date
     ORDER BY dl.date DESC
     LIMIT ?`,
    [limit],
  );

  return rows.map((row) => ({
    date: row.date,
    totals: {
      calories: row.calories ?? 0,
      proteinG: row.protein_g ?? 0,
      carbsG: row.carbs_g ?? 0,
      fatG: row.fat_g ?? 0,
    },
  }));
}

function toMacros(item: MealItemWithFood): Macros {
  return {
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
  };
}
