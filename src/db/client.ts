import * as SQLite from 'expo-sqlite';

import { SCHEMA_SQL } from './schema';
import { SEED_FOODS } from './seed';

const DB_NAME = 'macly.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  return dbPromise;
}

export async function initDatabase(): Promise<void> {
  const db = await getDb();
  await db.execAsync(SCHEMA_SQL);
  await runMigrations(db);
  await seedFoodsIfNeeded(db);
  await applyFoodMetadataPatches(db);
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const foodColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(food)');
  const foodColumnNames = new Set(foodColumns.map((column) => column.name));

  if (!foodColumnNames.has('serving_unit')) {
    await db.execAsync("ALTER TABLE food ADD COLUMN serving_unit TEXT NOT NULL DEFAULT 'grams';");
  }

  if (!foodColumnNames.has('grams_per_unit')) {
    await db.execAsync('ALTER TABLE food ADD COLUMN grams_per_unit REAL;');
  }

  if (!foodColumnNames.has('serving_label')) {
    await db.execAsync('ALTER TABLE food ADD COLUMN serving_label TEXT;');
  }

  const goalColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(macro_goals)');
  const goalColumnNames = new Set(goalColumns.map((column) => column.name));

  if (!goalColumnNames.has('goal_type')) {
    await db.execAsync("ALTER TABLE macro_goals ADD COLUMN goal_type TEXT NOT NULL DEFAULT 'maintenance';");
  }
}

async function seedFoodsIfNeeded(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM food');
  const count = row?.count ?? 0;

  if (count > 0) {
    return;
  }

  for (const food of SEED_FOODS) {
    await db.runAsync(
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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        food.name,
        food.caloriesPer100g,
        food.proteinPer100g,
        food.carbsPer100g,
        food.fatPer100g,
        food.servingUnit ?? 'grams',
        food.gramsPerUnit ?? null,
        food.servingLabel ?? null,
      ],
    );
  }
}

async function applyFoodMetadataPatches(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.runAsync(
    `UPDATE food
     SET serving_unit = 'count', grams_per_unit = 50, serving_label = 'egg'
     WHERE LOWER(name) = 'egg'`,
  );
}
