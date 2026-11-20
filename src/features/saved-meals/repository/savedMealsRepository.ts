import { getDb } from '../../../db/client';
import { createMealItem } from '../../../repositories/mealRepository';
import { scaleMacrosByGrams } from '../../../utils/macroCalculations';
import type { Macros } from '../../../types/food';
import type { SavedMeal } from '../../../types/meal';

export type SavedMealItemDetail = {
  id: number;
  savedMealId: number;
  foodId: number;
  quantityG: number;
  foodName: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
};

export type SavedMealWithItems = SavedMeal & {
  items: SavedMealItemDetail[];
  totals: Macros;
};

export async function listSavedMeals(userId = 1): Promise<SavedMealWithItems[]> {
  const db = await getDb();
  const meals = await db.getAllAsync<any>(
    'SELECT id, name, user_id, created_at FROM saved_meal WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
  );

  const result: SavedMealWithItems[] = [];

  for (const mealRow of meals) {
    const items = await db.getAllAsync<any>(
      `SELECT
         smi.id,
         smi.saved_meal_id,
         smi.food_id,
         smi.quantity_g,
         f.name,
         f.calories_per_100g,
         f.protein_per_100g,
         f.carbs_per_100g,
         f.fat_per_100g
       FROM saved_meal_item smi
       INNER JOIN food f ON f.id = smi.food_id
       WHERE smi.saved_meal_id = ?
       ORDER BY smi.id ASC`,
      [mealRow.id],
    );

    const mappedItems: SavedMealItemDetail[] = items.map((item) => ({
      id: item.id,
      savedMealId: item.saved_meal_id,
      foodId: item.food_id,
      quantityG: item.quantity_g,
      foodName: item.name,
      caloriesPer100g: item.calories_per_100g,
      proteinPer100g: item.protein_per_100g,
      carbsPer100g: item.carbs_per_100g,
      fatPer100g: item.fat_per_100g,
    }));

    const totals = mappedItems.reduce<Macros>(
      (acc, item) => {
        const scaled = scaleMacrosByGrams(
          {
            calories: item.caloriesPer100g,
            proteinG: item.proteinPer100g,
            carbsG: item.carbsPer100g,
            fatG: item.fatPer100g,
          },
          item.quantityG,
        );

        return {
          calories: Number((acc.calories + scaled.calories).toFixed(2)),
          proteinG: Number((acc.proteinG + scaled.proteinG).toFixed(2)),
          carbsG: Number((acc.carbsG + scaled.carbsG).toFixed(2)),
          fatG: Number((acc.fatG + scaled.fatG).toFixed(2)),
        };
      },
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    );

    result.push({
      id: mealRow.id,
      name: mealRow.name,
      userId: mealRow.user_id,
      createdAt: mealRow.created_at,
      items: mappedItems,
      totals,
    });
  }

  return result;
}

export async function saveMealFromMealItems(input: {
  userId?: number;
  name: string;
  mealId: number;
}): Promise<number> {
  const db = await getDb();
  const userId = input.userId ?? 1;
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error('Saved meal name is required');
  }

  const mealItems = await db.getAllAsync<any>(
    'SELECT food_id, quantity_g FROM meal_item WHERE meal_id = ? ORDER BY id ASC',
    [input.mealId],
  );

  if (mealItems.length === 0) {
    throw new Error('Cannot save an empty meal');
  }

  const created = await db.runAsync(
    'INSERT INTO saved_meal (name, user_id) VALUES (?, ?)',
    [trimmedName, userId],
  );

  const savedMealId = created.lastInsertRowId;

  for (const item of mealItems) {
    await db.runAsync(
      'INSERT INTO saved_meal_item (saved_meal_id, food_id, quantity_g) VALUES (?, ?, ?)',
      [savedMealId, item.food_id, item.quantity_g],
    );
  }

  return savedMealId;
}

export async function applySavedMealToMeal(input: {
  savedMealId: number;
  targetMealId: number;
}): Promise<void> {
  const db = await getDb();
  const savedItems = await db.getAllAsync<any>(
    `SELECT
       smi.food_id,
       smi.quantity_g,
       f.calories_per_100g,
       f.protein_per_100g,
       f.carbs_per_100g,
       f.fat_per_100g
     FROM saved_meal_item smi
     INNER JOIN food f ON f.id = smi.food_id
     WHERE smi.saved_meal_id = ?
     ORDER BY smi.id ASC`,
    [input.savedMealId],
  );

  if (savedItems.length === 0) {
    throw new Error('Saved meal has no items');
  }

  for (const item of savedItems) {
    const scaled = scaleMacrosByGrams(
      {
        calories: item.calories_per_100g,
        proteinG: item.protein_per_100g,
        carbsG: item.carbs_per_100g,
        fatG: item.fat_per_100g,
      },
      item.quantity_g,
    );

    await createMealItem({
      mealId: input.targetMealId,
      foodId: item.food_id,
      quantityG: item.quantity_g,
      calories: scaled.calories,
      proteinG: scaled.proteinG,
      carbsG: scaled.carbsG,
      fatG: scaled.fatG,
    });
  }
}

export async function deleteSavedMeal(savedMealId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM saved_meal WHERE id = ?', [savedMealId]);
}
