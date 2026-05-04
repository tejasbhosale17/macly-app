import { useCallback, useEffect, useMemo, useState } from 'react';

import { getMacroGoals } from '../../../repositories/macroGoalsRepository';
import { getHistory } from '../../../services/logService';
import { getTodayDateString } from '../../../utils/dateUtils';
import type { HistoryDay } from '../../../types';

export type SevenDaySummary = {
  daysLogged: number;
  goalHitDays: number;
  totalCalories: number;
  avgCalories: number;
  avgProteinG: number;
  avgCarbsG: number;
  avgFatG: number;
};

type UseHistorySummaryState = {
  historyDays: HistoryDay[];
  sevenDaySummary: SevenDaySummary;
  calorieGoal: number;
  streak: number;
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
};

const EMPTY_SUMMARY: SevenDaySummary = {
  daysLogged: 0,
  goalHitDays: 0,
  totalCalories: 0,
  avgCalories: 0,
  avgProteinG: 0,
  avgCarbsG: 0,
  avgFatG: 0,
};

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function prevDay(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  const d = new Date(parts[0]!, parts[1]! - 1, parts[2]! - 1);
  return d.toISOString().slice(0, 10);
}

function computeStreak(days: HistoryDay[], today: string): number {
  const dateSet = new Set(days.filter((d) => d.totals.calories > 0).map((d) => d.date));
  let current = today;
  if (!dateSet.has(current)) {
    current = prevDay(current);
    if (!dateSet.has(current)) return 0;
  }
  let streak = 0;
  while (dateSet.has(current)) {
    streak++;
    current = prevDay(current);
  }
  return streak;
}

export function useHistorySummary(limit = 30): UseHistorySummaryState {
  const [historyDays, setHistoryDays] = useState<HistoryDay[]>([]);
  const [calorieGoal, setCalorieGoal] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [rows, goals] = await Promise.all([getHistory(limit), getMacroGoals()]);
      setHistoryDays(rows);

      const goalCals = goals?.calories ?? 0;
      setCalorieGoal(goalCals);
      setStreak(computeStreak(rows, getTodayDateString()));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load history');
      setHistoryDays([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sevenDaySummary = useMemo<SevenDaySummary>(() => {
    if (historyDays.length === 0) {
      return EMPTY_SUMMARY;
    }

    const lastSeven = historyDays.slice(0, 7);
    const daysLogged = lastSeven.length;

    if (daysLogged === 0) {
      return EMPTY_SUMMARY;
    }

    const totals = lastSeven.reduce(
      (acc, day) => {
        acc.calories += day.totals.calories;
        acc.proteinG += day.totals.proteinG;
        acc.carbsG += day.totals.carbsG;
        acc.fatG += day.totals.fatG;
        return acc;
      },
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    );

    const goalHitDays =
      calorieGoal > 0 ? lastSeven.filter((d) => d.totals.calories >= calorieGoal * 0.9).length : 0;

    return {
      daysLogged,
      goalHitDays,
      totalCalories: round2(totals.calories),
      avgCalories: round2(totals.calories / daysLogged),
      avgProteinG: round2(totals.proteinG / daysLogged),
      avgCarbsG: round2(totals.carbsG / daysLogged),
      avgFatG: round2(totals.fatG / daysLogged),
    };
  }, [historyDays, calorieGoal]);

  return {
    historyDays,
    sevenDaySummary,
    calorieGoal,
    streak,
    isLoading,
    errorMessage,
    refresh,
  };
}
