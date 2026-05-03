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
  await seedFoodsIfNeeded(db);
}

async function seedFoodsIfNeeded(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM food');
  const count = row?.count ?? 0;

  if (count > 0) {
    return;
  }

  for (const food of SEED_FOODS) {
    await db.runAsync(
      `INSERT INTO food (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, is_custom)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [
        food.name,
        food.caloriesPer100g,
        food.proteinPer100g,
        food.carbsPer100g,
        food.fatPer100g,
      ],
    );
  }
}
