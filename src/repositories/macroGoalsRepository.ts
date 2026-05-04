import { DEFAULT_DAILY_GOALS } from '../constants/macros';
import { getDb } from '../db/client';
import type { MacroGoals, UpsertMacroGoalsInput } from '../types';

function mapGoalsRow(row: {
  id: number;
  user_id: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  goal_type: MacroGoals['goalType'];
  updated_at: string;
}): MacroGoals {
  return {
    id: row.id,
    userId: row.user_id,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    goalType: row.goal_type,
    updatedAt: row.updated_at,
  };
}

export async function getMacroGoals(): Promise<MacroGoals | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>('SELECT * FROM macro_goals WHERE id = 1');
  return row ? mapGoalsRow(row) : null;
}

export async function ensureDefaultGoals(): Promise<void> {
  const goals = await getMacroGoals();

  if (goals) {
    return;
  }

  await upsertMacroGoals({
    calories: DEFAULT_DAILY_GOALS.calories,
    proteinG: DEFAULT_DAILY_GOALS.proteinG,
    carbsG: DEFAULT_DAILY_GOALS.carbsG,
    fatG: DEFAULT_DAILY_GOALS.fatG,
  });
}

export async function upsertMacroGoals(input: UpsertMacroGoalsInput): Promise<void> {
  const db = await getDb();
  const existing = await getMacroGoals();
  const goalType = input.goalType ?? existing?.goalType ?? 'maintenance';

  await db.runAsync(
    `INSERT INTO macro_goals (id, user_id, calories, protein_g, carbs_g, fat_g, goal_type)
     VALUES (1, 1, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       calories = excluded.calories,
       protein_g = excluded.protein_g,
       carbs_g = excluded.carbs_g,
       fat_g = excluded.fat_g,
       goal_type = excluded.goal_type,
       updated_at = datetime('now')`,
    [input.calories, input.proteinG, input.carbsG, input.fatG, goalType],
  );
}
