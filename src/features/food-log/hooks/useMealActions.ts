import { useCallback, useState } from 'react';

import { createMealItem, deleteMealItem, updateMealItem } from '../../../repositories/mealRepository';
import { scaleMacrosByGrams } from '../../../utils/macroCalculations';
import type { Food } from '../../../types';

type MealActionState = {
  isLoading: boolean;
  errorMessage: string | null;
  addFoodToMeal: (mealId: number, food: Food, quantityG: number) => Promise<number>;
  editMealItem: (mealItemId: number, quantityG: number, food: Food) => Promise<void>;
  deleteMealItem: (mealItemId: number) => Promise<void>;
};

export function useMealActions(): MealActionState {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addFoodToMeal = useCallback(async (mealId: number, food: Food, quantityG: number): Promise<number> => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Calculate scaled macros deterministically
      const scaledMacros = scaleMacrosByGrams(
        {
          calories: food.caloriesPer100g,
          proteinG: food.proteinPer100g,
          carbsG: food.carbsPer100g,
          fatG: food.fatPer100g,
        },
        quantityG,
      );

      const itemId = await createMealItem({
        mealId,
        foodId: food.id,
        quantityG,
        calories: scaledMacros.calories,
        proteinG: scaledMacros.proteinG,
        carbsG: scaledMacros.carbsG,
        fatG: scaledMacros.fatG,
      });

      return itemId;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to add food to meal';
      setErrorMessage(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const editMealItem = useCallback(async (mealItemId: number, quantityG: number, food: Food): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Calculate scaled macros deterministically
      const scaledMacros = scaleMacrosByGrams(
        {
          calories: food.caloriesPer100g,
          proteinG: food.proteinPer100g,
          carbsG: food.carbsPer100g,
          fatG: food.fatPer100g,
        },
        quantityG,
      );

      await updateMealItem({
        mealItemId,
        quantityG,
        calories: scaledMacros.calories,
        proteinG: scaledMacros.proteinG,
        carbsG: scaledMacros.carbsG,
        fatG: scaledMacros.fatG,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to edit meal item';
      setErrorMessage(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDeleteMealItem = useCallback(async (mealItemId: number): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      await deleteMealItem(mealItemId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to delete meal item';
      setErrorMessage(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    errorMessage,
    addFoodToMeal,
    editMealItem,
    deleteMealItem: handleDeleteMealItem,
  };
}
