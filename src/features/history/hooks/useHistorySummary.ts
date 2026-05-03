import { useCallback, useEffect, useMemo, useState } from 'react';

import { getHistory } from '../../../services/logService';
import type { HistoryDay } from '../../../types';

export type SevenDaySummary = {
  daysLogged: number;
  totalCalories: number;
  avgCalories: number;
  avgProteinG: number;
  avgCarbsG: number;
  avgFatG: number;
};

type UseHistorySummaryState = {
  historyDays: HistoryDay[];
  sevenDaySummary: SevenDaySummary;
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
};

const EMPTY_SUMMARY: SevenDaySummary = {
  daysLogged: 0,
  totalCalories: 0,
  avgCalories: 0,
  avgProteinG: 0,
  avgCarbsG: 0,
  avgFatG: 0,
};

function round2(value: number): number {
  return Number(value.toFixed(2));
}

export function useHistorySummary(limit = 30): UseHistorySummaryState {
  const [historyDays, setHistoryDays] = useState<HistoryDay[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const rows = await getHistory(limit);
      setHistoryDays(rows);
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

    return {
      daysLogged,
      totalCalories: round2(totals.calories),
      avgCalories: round2(totals.calories / daysLogged),
      avgProteinG: round2(totals.proteinG / daysLogged),
      avgCarbsG: round2(totals.carbsG / daysLogged),
      avgFatG: round2(totals.fatG / daysLogged),
    };
  }, [historyDays]);

  return {
    historyDays,
    sevenDaySummary,
    isLoading,
    errorMessage,
    refresh,
  };
}
