import { getDb } from '../db/client';
import type { Food, NewCustomFood } from '../types';

function mapFoodRow(row: {
  id: number;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  serving_unit: 'grams' | 'count';
  grams_per_unit: number | null;
  serving_label: string | null;
  is_custom: number;
  created_at: string;
}): Food {
  return {
    id: row.id,
    name: row.name,
    caloriesPer100g: row.calories_per_100g,
    proteinPer100g: row.protein_per_100g,
    carbsPer100g: row.carbs_per_100g,
    fatPer100g: row.fat_per_100g,
    servingUnit: row.serving_unit ?? 'grams',
    gramsPerUnit: row.grams_per_unit,
    servingLabel: row.serving_label,
    isCustom: row.is_custom === 1,
    createdAt: row.created_at,
  };
}

export async function listFoods(query?: string): Promise<Food[]> {
  const db = await getDb();

  if (!query || query.trim().length === 0) {
    const rows = await db.getAllAsync<any>('SELECT * FROM food ORDER BY name ASC LIMIT 12');
    return rows.map(mapFoodRow);
  }

  const rows = await db.getAllAsync<any>(
    'SELECT * FROM food WHERE LOWER(name) LIKE LOWER(?) ORDER BY name ASC LIMIT 25',
    [`%${query.trim()}%`],
  );

  return rows.map(mapFoodRow);
}

export async function getFoodById(foodId: number): Promise<Food | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>('SELECT * FROM food WHERE id = ?', [foodId]);
  return row ? mapFoodRow(row) : null;
}

export async function createCustomFood(input: NewCustomFood): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO food (
      name,
      calories_per_100g,
      protein_per_100g,
      carbs_per_100g,
      fat_per_100g,
      serving_unit,
      grams_per_unit,
      serving_label,
      is_custom
    )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      input.name,
      input.caloriesPer100g,
      input.proteinPer100g,
      input.carbsPer100g,
      input.fatPer100g,
      input.servingUnit,
      input.gramsPerUnit,
      input.servingLabel,
    ],
  );

  return result.lastInsertRowId;
}
