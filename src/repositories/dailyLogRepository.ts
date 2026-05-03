import { getDb } from '../db/client';
import type { DailyLog } from '../types';

function mapDailyLogRow(row: {
  id: number;
  date: string;
  user_id: number;
  created_at: string;
}): DailyLog {
  return {
    id: row.id,
    date: row.date,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

export async function getDailyLogByDate(date: string): Promise<DailyLog | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>('SELECT * FROM daily_log WHERE date = ?', [date]);
  return row ? mapDailyLogRow(row) : null;
}

export async function getOrCreateDailyLog(date: string): Promise<DailyLog> {
  const existing = await getDailyLogByDate(date);

  if (existing) {
    return existing;
  }

  const db = await getDb();
  await db.runAsync('INSERT INTO daily_log (date, user_id) VALUES (?, 1)', [date]);
  const created = await getDailyLogByDate(date);

  if (!created) {
    throw new Error('Failed to create daily log');
  }

  return created;
}
