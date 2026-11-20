export type Macros = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type ServingUnit = 'grams' | 'count';

export type Food = {
  id: number;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingUnit: ServingUnit;
  gramsPerUnit: number | null;
  servingLabel: string | null;
  isCustom: boolean;
  createdAt: string;
};

export type NewCustomFood = Omit<Food, 'id' | 'createdAt' | 'isCustom'>;

export type SeedFoodInput = {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingUnit?: ServingUnit;
  gramsPerUnit?: number | null;
  servingLabel?: string | null;
};
