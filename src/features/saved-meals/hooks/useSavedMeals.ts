import { useCallback, useEffect, useState } from 'react';

import {
  applySavedMealToMeal,
  deleteSavedMeal,
  listSavedMeals,
  saveMealFromMealItems,
  type SavedMealWithItems,
} from '../repository/savedMealsRepository';

type UseSavedMealsState = {
  savedMeals: SavedMealWithItems[];
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
  saveCurrentMeal: (name: string, mealId: number, userId?: number) => Promise<number>;
  applySavedMeal: (savedMealId: number, targetMealId: number) => Promise<void>;
  removeSavedMeal: (savedMealId: number) => Promise<void>;
};

export function useSavedMeals(userId = 1): UseSavedMealsState {
  const [savedMeals, setSavedMeals] = useState<SavedMealWithItems[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const meals = await listSavedMeals(userId);
      setSavedMeals(meals);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load saved meals');
      setSavedMeals([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const saveCurrentMeal = useCallback(
    async (name: string, mealId: number, currentUserId?: number): Promise<number> => {
      const createdId = await saveMealFromMealItems({
        name,
        mealId,
        userId: currentUserId ?? userId,
      });
      await refresh();
      return createdId;
    },
    [refresh, userId],
  );

  const applySavedMeal = useCallback(
    async (savedMealId: number, targetMealId: number): Promise<void> => {
      await applySavedMealToMeal({ savedMealId, targetMealId });
      await refresh();
    },
    [refresh],
  );

  const removeSavedMeal = useCallback(
    async (savedMealId: number): Promise<void> => {
      await deleteSavedMeal(savedMealId);
      await refresh();
    },
    [refresh],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    savedMeals,
    isLoading,
    errorMessage,
    refresh,
    saveCurrentMeal,
    applySavedMeal,
    removeSavedMeal,
  };
}
