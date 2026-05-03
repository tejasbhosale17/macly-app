import { getDb } from '../db/client';
import type { UpsertUserProfileInput, UserProfile } from '../types';

const DEFAULT_USER_ID = 1;

function mapUserProfileRow(row: {
  id: number;
  name: string;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  gender: UserProfile['gender'];
  activity_level: UserProfile['activityLevel'];
  created_at: string;
  updated_at: string;
}): UserProfile {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    weightKg: row.weight_kg,
    heightCm: row.height_cm,
    gender: row.gender,
    activityLevel: row.activity_level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>('SELECT * FROM user_profile WHERE id = ?', [DEFAULT_USER_ID]);
  return row ? mapUserProfileRow(row) : null;
}

export async function upsertUserProfile(input: UpsertUserProfileInput): Promise<void> {
  const db = await getDb();

  await db.runAsync(
    `INSERT INTO user_profile (id, name, age, weight_kg, height_cm, gender, activity_level)
     VALUES (1, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       age = excluded.age,
       weight_kg = excluded.weight_kg,
       height_cm = excluded.height_cm,
       gender = excluded.gender,
       activity_level = excluded.activity_level,
       updated_at = datetime('now')`,
    [
      input.name,
      input.age ?? null,
      input.weightKg ?? null,
      input.heightCm ?? null,
      input.gender ?? null,
      input.activityLevel ?? null,
    ],
  );
}
