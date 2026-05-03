import type { Food, Macros } from './food';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export type Meal = {
  id: number;
  dailyLogId: number;
  mealType: MealType;
  createdAt: string;
};

export type MealItem = {
  id: number;
  mealId: number;
  foodId: number;
  quantityG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  createdAt: string;
};

export type MealItemWithFood = MealItem & {
  mealType: MealType;
  food: Food;
};

export type MealWithItems = {
  meal: Meal;
  items: MealItemWithFood[];
  totals: Macros;
};

export type SavedMeal = {
  id: number;
  name: string;
  userId: number;
  createdAt: string;
};

export type SavedMealItem = {
  id: number;
  savedMealId: number;
  foodId: number;
  quantityG: number;
};
