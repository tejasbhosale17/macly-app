import type { SeedFoodInput } from '../types';

export const SEED_FOODS: SeedFoodInput[] = [
  // ── Grains & Staples ──────────────────────────────────────────
  { name: 'Rice', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28.2, fatPer100g: 0.3 },
  { name: 'Brown Rice', caloriesPer100g: 123, proteinPer100g: 2.6, carbsPer100g: 25.6, fatPer100g: 0.9 },
  { name: 'Chapati', caloriesPer100g: 297, proteinPer100g: 9.6, carbsPer100g: 46.4, fatPer100g: 7.5 },
  { name: 'Roti', caloriesPer100g: 297, proteinPer100g: 9.6, carbsPer100g: 46.4, fatPer100g: 7.5 },
  { name: 'Paratha', caloriesPer100g: 326, proteinPer100g: 7.8, carbsPer100g: 44, fatPer100g: 13 },
  { name: 'Bread', caloriesPer100g: 265, proteinPer100g: 9, carbsPer100g: 49, fatPer100g: 3.2 },
  { name: 'White Bread', caloriesPer100g: 265, proteinPer100g: 9, carbsPer100g: 49, fatPer100g: 3.2 },
  { name: 'Brown Bread', caloriesPer100g: 247, proteinPer100g: 10, carbsPer100g: 43, fatPer100g: 3.5 },
  { name: 'Oats', caloriesPer100g: 389, proteinPer100g: 16.9, carbsPer100g: 66.3, fatPer100g: 6.9 },
  { name: 'Poha', caloriesPer100g: 333, proteinPer100g: 7, carbsPer100g: 71, fatPer100g: 1.8 },
  { name: 'Upma', caloriesPer100g: 130, proteinPer100g: 3.5, carbsPer100g: 18, fatPer100g: 5 },
  { name: 'Idli', caloriesPer100g: 58, proteinPer100g: 2, carbsPer100g: 11.5, fatPer100g: 0.4 },
  { name: 'Dosa', caloriesPer100g: 168, proteinPer100g: 3.9, carbsPer100g: 23, fatPer100g: 7 },
  { name: 'Pasta', caloriesPer100g: 158, proteinPer100g: 5.8, carbsPer100g: 31, fatPer100g: 0.9 },
  { name: 'Noodles', caloriesPer100g: 138, proteinPer100g: 4.5, carbsPer100g: 25, fatPer100g: 2.1 },
  { name: 'Quinoa', caloriesPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21.3, fatPer100g: 1.9 },

  // ── Pulses & Legumes ──────────────────────────────────────────
  { name: 'Toor Dal', caloriesPer100g: 343, proteinPer100g: 22.3, carbsPer100g: 62.7, fatPer100g: 1.7 },
  { name: 'Moong Dal', caloriesPer100g: 347, proteinPer100g: 24, carbsPer100g: 63, fatPer100g: 1.2 },
  { name: 'Masoor Dal', caloriesPer100g: 352, proteinPer100g: 24.6, carbsPer100g: 63, fatPer100g: 1 },
  { name: 'Chana Dal', caloriesPer100g: 364, proteinPer100g: 22, carbsPer100g: 61, fatPer100g: 5 },
  { name: 'Dal', caloriesPer100g: 116, proteinPer100g: 7.6, carbsPer100g: 20, fatPer100g: 0.4 },
  { name: 'Rajma', caloriesPer100g: 127, proteinPer100g: 8.7, carbsPer100g: 22.8, fatPer100g: 0.5 },
  { name: 'Chickpeas', caloriesPer100g: 164, proteinPer100g: 8.9, carbsPer100g: 27.4, fatPer100g: 2.6 },
  { name: 'Chhole', caloriesPer100g: 164, proteinPer100g: 8.9, carbsPer100g: 27.4, fatPer100g: 2.6 },
  { name: 'Black Beans', caloriesPer100g: 132, proteinPer100g: 8.9, carbsPer100g: 24, fatPer100g: 0.5 },

  // ── Proteins ──────────────────────────────────────────────────
  {
    name: 'Egg',
    caloriesPer100g: 155,
    proteinPer100g: 13,
    carbsPer100g: 1.1,
    fatPer100g: 11,
    servingUnit: 'count',
    gramsPerUnit: 50,
    servingLabel: 'egg',
  },
  {
    name: 'Egg White',
    caloriesPer100g: 52,
    proteinPer100g: 11,
    carbsPer100g: 0.7,
    fatPer100g: 0.2,
    servingUnit: 'count',
    gramsPerUnit: 30,
    servingLabel: 'white',
  },
  { name: 'Chicken Breast', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
  { name: 'Chicken Thigh', caloriesPer100g: 209, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 11 },
  { name: 'Chicken', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
  { name: 'Mutton', caloriesPer100g: 294, proteinPer100g: 25, carbsPer100g: 0, fatPer100g: 21 },
  { name: 'Fish', caloriesPer100g: 136, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 6 },
  { name: 'Tuna', caloriesPer100g: 132, proteinPer100g: 29, carbsPer100g: 0, fatPer100g: 1 },
  { name: 'Salmon', caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13 },
  { name: 'Paneer', caloriesPer100g: 265, proteinPer100g: 18.3, carbsPer100g: 1.2, fatPer100g: 20.8 },
  { name: 'Tofu', caloriesPer100g: 76, proteinPer100g: 8, carbsPer100g: 1.9, fatPer100g: 4.8 },
  { name: 'Whey Protein', caloriesPer100g: 400, proteinPer100g: 80, carbsPer100g: 8, fatPer100g: 7 },
  { name: 'Soya Chunks', caloriesPer100g: 345, proteinPer100g: 54, carbsPer100g: 33, fatPer100g: 0.5 },

  // ── Dairy ─────────────────────────────────────────────────────
  { name: 'Milk', caloriesPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.8, fatPer100g: 3.3 },
  { name: 'Curd', caloriesPer100g: 61, proteinPer100g: 3.5, carbsPer100g: 4.7, fatPer100g: 3.3 },
  { name: 'Greek Yogurt', caloriesPer100g: 100, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 5 },
  { name: 'Buttermilk', caloriesPer100g: 40, proteinPer100g: 3.3, carbsPer100g: 5, fatPer100g: 1 },
  { name: 'Cheese', caloriesPer100g: 402, proteinPer100g: 25, carbsPer100g: 1.3, fatPer100g: 33 },
  { name: 'Cottage Cheese', caloriesPer100g: 98, proteinPer100g: 11, carbsPer100g: 3.4, fatPer100g: 4.3 },

  // ── Vegetables ────────────────────────────────────────────────
  { name: 'Spinach', caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4 },
  { name: 'Broccoli', caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4 },
  { name: 'Potato', caloriesPer100g: 77, proteinPer100g: 2, carbsPer100g: 17, fatPer100g: 0.1 },
  { name: 'Sweet Potato', caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1 },
  { name: 'Tomato', caloriesPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2 },
  { name: 'Onion', caloriesPer100g: 40, proteinPer100g: 1.1, carbsPer100g: 9.3, fatPer100g: 0.1 },
  { name: 'Carrot', caloriesPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 10, fatPer100g: 0.2 },
  { name: 'Cauliflower', caloriesPer100g: 25, proteinPer100g: 2, carbsPer100g: 5, fatPer100g: 0.3 },
  { name: 'Cucumber', caloriesPer100g: 16, proteinPer100g: 0.7, carbsPer100g: 3.6, fatPer100g: 0.1 },

  // ── Fruits ────────────────────────────────────────────────────
  { name: 'Banana', caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 22.8, fatPer100g: 0.3 },
  { name: 'Apple', caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2 },
  { name: 'Orange', caloriesPer100g: 47, proteinPer100g: 0.9, carbsPer100g: 12, fatPer100g: 0.1 },
  { name: 'Mango', caloriesPer100g: 60, proteinPer100g: 0.8, carbsPer100g: 15, fatPer100g: 0.4 },
  { name: 'Papaya', caloriesPer100g: 43, proteinPer100g: 0.5, carbsPer100g: 11, fatPer100g: 0.3 },
  { name: 'Watermelon', caloriesPer100g: 30, proteinPer100g: 0.6, carbsPer100g: 7.6, fatPer100g: 0.2 },
  { name: 'Grapes', caloriesPer100g: 69, proteinPer100g: 0.7, carbsPer100g: 18, fatPer100g: 0.2 },
  { name: 'Strawberry', caloriesPer100g: 32, proteinPer100g: 0.7, carbsPer100g: 7.7, fatPer100g: 0.3 },

  // ── Fats & Spreads ────────────────────────────────────────────
  { name: 'Peanut Butter', caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50 },
  { name: 'Almond Butter', caloriesPer100g: 614, proteinPer100g: 21, carbsPer100g: 19, fatPer100g: 56 },
  { name: 'Almonds', caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50 },
  { name: 'Walnuts', caloriesPer100g: 654, proteinPer100g: 15, carbsPer100g: 14, fatPer100g: 65 },
  { name: 'Cashews', caloriesPer100g: 553, proteinPer100g: 18, carbsPer100g: 30, fatPer100g: 44 },
  { name: 'Ghee', caloriesPer100g: 900, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100 },
  { name: 'Olive Oil', caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100 },
  { name: 'Butter', caloriesPer100g: 717, proteinPer100g: 0.9, carbsPer100g: 0.1, fatPer100g: 81 },
  { name: 'Avocado', caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15 },

  // ── Snacks & Others ───────────────────────────────────────────
  { name: 'Samosa', caloriesPer100g: 308, proteinPer100g: 6, carbsPer100g: 36, fatPer100g: 16 },
  { name: 'Vada', caloriesPer100g: 297, proteinPer100g: 8, carbsPer100g: 30, fatPer100g: 16 },
  { name: 'Puri', caloriesPer100g: 335, proteinPer100g: 7, carbsPer100g: 43, fatPer100g: 15 },
  { name: 'Dark Chocolate', caloriesPer100g: 546, proteinPer100g: 5, carbsPer100g: 60, fatPer100g: 31 },
  { name: 'Protein Bar', caloriesPer100g: 390, proteinPer100g: 30, carbsPer100g: 40, fatPer100g: 10 },
  { name: 'Rice Cake', caloriesPer100g: 387, proteinPer100g: 7.3, carbsPer100g: 81, fatPer100g: 2.8 },
];

