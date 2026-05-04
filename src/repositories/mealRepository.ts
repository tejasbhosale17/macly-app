import { MEAL_TYPES } from '../constants/meals';
import { getDb } from '../db/client';
import type { Meal, MealItemWithFood, MealType } from '../types';

function mapMealRow(row: {
  id: number;
  daily_log_id: number;
  meal_type: MealType;
  created_at: string;
}): Meal {
  return {
    id: row.id,
    dailyLogId: row.daily_log_id,
    mealType: row.meal_type,
    createdAt: row.created_at,
  };
}

export async function getOrCreateMeal(dailyLogId: number, mealType: MealType): Promise<Meal> {
  const db = await getDb();
  const existing = await db.getFirstAsync<any>(
    'SELECT * FROM meal WHERE daily_log_id = ? AND meal_type = ?',
    [dailyLogId, mealType],
  );

  if (existing) {
    return mapMealRow(existing);
  }

  await db.runAsync('INSERT INTO meal (daily_log_id, meal_type) VALUES (?, ?)', [dailyLogId, mealType]);
  const created = await db.getFirstAsync<any>(
    'SELECT * FROM meal WHERE daily_log_id = ? AND meal_type = ?',
    [dailyLogId, mealType],
  );

  if (!created) {
    throw new Error('Failed to create meal');
  }

  return mapMealRow(created);
}

export async function ensureMealsForDay(dailyLogId: number): Promise<void> {
  for (const mealType of MEAL_TYPES) {
    await getOrCreateMeal(dailyLogId, mealType);
  }
}

export async function listMealItemsForDay(dailyLogId: number): Promise<MealItemWithFood[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT
       mi.id,
       mi.meal_id,
       mi.food_id,
       mi.quantity_g,
       mi.calories,
       mi.protein_g,
       mi.carbs_g,
       mi.fat_g,
       mi.created_at,
       m.meal_type,
       f.name,
       f.calories_per_100g,
       f.protein_per_100g,
       f.carbs_per_100g,
       f.fat_per_100g,
      f.serving_unit,
      f.grams_per_unit,
      f.serving_label,
       f.is_custom,
       f.created_at as food_created_at
     FROM meal_item mi
     INNER JOIN meal m ON m.id = mi.meal_id
     INNER JOIN food f ON f.id = mi.food_id
     WHERE m.daily_log_id = ?
     ORDER BY m.meal_type, mi.created_at ASC`,
    [dailyLogId],
  );

  return rows.map((row) => ({
    id: row.id,
    mealId: row.meal_id,
    mealType: row.meal_type,
    foodId: row.food_id,
    quantityG: row.quantity_g,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    createdAt: row.created_at,
    food: {
      id: row.food_id,
      name: row.name,
      caloriesPer100g: row.calories_per_100g,
      proteinPer100g: row.protein_per_100g,
      carbsPer100g: row.carbs_per_100g,
      fatPer100g: row.fat_per_100g,
      servingUnit: row.serving_unit ?? 'grams',
      gramsPerUnit: row.grams_per_unit,
      servingLabel: row.serving_label,
      isCustom: row.is_custom === 1,
      createdAt: row.food_created_at,
    },
  }));
}

export async function createMealItem(input: {
  mealId: number;
  foodId: number;
  quantityG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO meal_item (meal_id, food_id, quantity_g, calories, protein_g, carbs_g, fat_g)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.mealId,
      input.foodId,
      input.quantityG,
      input.calories,
      input.proteinG,
      input.carbsG,
      input.fatG,
    ],
  );

  return result.lastInsertRowId;
}

export async function updateMealItem(input: {
  mealItemId: number;
  quantityG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE meal_item
     SET quantity_g = ?, calories = ?, protein_g = ?, carbs_g = ?, fat_g = ?
     WHERE id = ?`,
    [
      input.quantityG,
      input.calories,
      input.proteinG,
      input.carbsG,
      input.fatG,
      input.mealItemId,
    ],
  );
}

export async function deleteMealItem(mealItemId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM meal_item WHERE id = ?', [mealItemId]);
}

export async function getMealItemById(mealItemId: number): Promise<{
  id: number;
  foodId: number;
  quantityG: number;
} | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    'SELECT id, food_id, quantity_g FROM meal_item WHERE id = ?',
    [mealItemId],
  );

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    foodId: row.food_id,
    quantityG: row.quantity_g,
  };
}
