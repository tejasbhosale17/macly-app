import { createCustomFood, listFoods } from '../repositories/foodRepository';
import type { DashboardData, Food, GoalType } from '../types';
import { convertQuantityToGrams, formatFoodQuantity } from '../utils/foodServing';
import { getMealSuggestionsFromLLM, parseFoodsWithLLM } from './openaiService';

type ParsedSegment = {
  text: string;
  quantity: number | null;
  unit: string | null;
  foodName: string;
};

export type ParsedFoodEntry = {
  food: Food;
  quantityG: number;
  parsedText: string;
  interpretedAs: string;
};

export type ParseFoodInputResult = {
  matched: ParsedFoodEntry[];
  unmatched: string[];
};

const splitRegex = /,|\+|\band\b|\n/gi;

export async function parseFoodInput(input: string): Promise<ParseFoodInputResult> {
  // Try LLM first
  const llmResults = await parseFoodsWithLLM(input);
  if (llmResults !== null) {
    return resolveLLMResults(llmResults, input);
  }

  // Fallback: local heuristic parser
  return parseLocally(input);
}

async function resolveLLMResults(
  llmFoods: NonNullable<Awaited<ReturnType<typeof parseFoodsWithLLM>>>,
  originalInput: string,
): Promise<ParseFoodInputResult> {
  const matched: ParsedFoodEntry[] = [];
  const unmatched: string[] = [];

  for (const item of llmFoods) {
    // Try to match against existing DB food first
    let food = await findBestFood(item.name);

    // If not in DB, create it as a custom food using LLM-estimated macros
    if (!food) {
      const newId = await createCustomFood({
        name: item.name,
        caloriesPer100g: Math.round(item.calories_per_100g),
        proteinPer100g: Math.round(item.protein_per_100g * 10) / 10,
        carbsPer100g: Math.round(item.carbs_per_100g * 10) / 10,
        fatPer100g: Math.round(item.fat_per_100g * 10) / 10,
        servingUnit: 'grams',
        gramsPerUnit: null,
        servingLabel: null,
      });

      food = {
        id: newId,
        name: item.name,
        caloriesPer100g: Math.round(item.calories_per_100g),
        proteinPer100g: Math.round(item.protein_per_100g * 10) / 10,
        carbsPer100g: Math.round(item.carbs_per_100g * 10) / 10,
        fatPer100g: Math.round(item.fat_per_100g * 10) / 10,
        servingUnit: 'grams',
        gramsPerUnit: null,
        servingLabel: null,
        isCustom: true,
        createdAt: new Date().toISOString(),
      };
    }

    const quantityG = Math.max(1, Math.round(item.quantity_g));
    const isAiEstimated = food.isCustom && food.name.toLowerCase() === item.name.toLowerCase();

    matched.push({
      food,
      quantityG,
      parsedText: originalInput,
      interpretedAs: `${food.name} (${formatFoodQuantity(food, quantityG)})${isAiEstimated ? ' · AI estimated' : ''}`,
    });
  }

  if (matched.length === 0) {
    unmatched.push(originalInput);
  }

  return { matched, unmatched };
}

async function parseLocally(input: string): Promise<ParseFoodInputResult> {
  const chunks = input
    .split(splitRegex)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const matched: ParsedFoodEntry[] = [];
  const unmatched: string[] = [];

  for (const chunk of chunks) {
    const parsed = parseSegment(chunk);
    const food = await findBestFood(parsed.foodName);

    if (!food) {
      unmatched.push(chunk);
      continue;
    }

    const quantityG = resolveQuantityInGrams(food, parsed.quantity, parsed.unit);

    matched.push({
      food,
      quantityG,
      parsedText: chunk,
      interpretedAs: `${food.name} (${formatFoodQuantity(food, quantityG)})`,
    });
  }

  return { matched, unmatched };
}

export async function getMealSuggestions(data: DashboardData): Promise<string[]> {
  const remaining = {
    calories: Math.max(0, data.progress.calories.remaining),
    proteinG: Math.max(0, data.progress.proteinG.remaining),
    carbsG: Math.max(0, data.progress.carbsG.remaining),
    fatG: Math.max(0, data.progress.fatG.remaining),
  };

  if (remaining.calories < 150) {
    return ['You are close to target. Keep the next meal light, hydration-focused, and high in fiber.'];
  }

  // Try LLM suggestions first
  const llmSuggestions = await getMealSuggestionsFromLLM({
    remainingCalories: remaining.calories,
    remainingProteinG: remaining.proteinG,
    remainingCarbsG: remaining.carbsG,
    remainingFatG: remaining.fatG,
    goalType: data.goalType ?? null,
  });

  if (llmSuggestions && llmSuggestions.length > 0) {
    return llmSuggestions.slice(0, 3);
  }

  // Fallback to local heuristics
  const ideas = buildGoalAwareIdeas(data.goalType, remaining);
  return ideas.slice(0, 3);
}

function buildGoalAwareIdeas(
  goalType: GoalType | null,
  remaining: { calories: number; proteinG: number; carbsG: number; fatG: number },
): string[] {
  const dominantMacro =
    remaining.proteinG >= remaining.carbsG && remaining.proteinG >= remaining.fatG
      ? 'protein'
      : remaining.carbsG >= remaining.fatG
        ? 'carbs'
        : 'fat';

  const suggestions: string[] = [];

  if (dominantMacro === 'protein') {
    suggestions.push('High protein meal: chicken breast + curd + small rice portion.');
    suggestions.push('Quick protein meal: paneer scramble + chapati + salad.');
  }

  if (dominantMacro === 'carbs') {
    suggestions.push('Carb-focused meal: rice + dal + curd.');
    suggestions.push('Workout refuel: oats + banana + milk + whey.');
  }

  if (dominantMacro === 'fat') {
    suggestions.push('Healthy fat add-on: chapati + paneer + peanut butter side.');
    suggestions.push('Dense snack: banana + peanut butter + milk shake.');
  }

  if (goalType === 'fat-loss') {
    suggestions.push('Fat loss tip: keep meal volume high with lean protein and lower-fat sides.');
  }

  if (goalType === 'lean-bulk' || goalType === 'muscle-gain') {
    suggestions.push('Bulk tip: include both carbs and protein in every meal window.');
  }

  if (suggestions.length === 0) {
    suggestions.push('Balanced meal: rice + dal + paneer with a fruit on the side.');
  }

  return suggestions;
}

function parseSegment(text: string): ParsedSegment {
  const normalized = text.trim().toLowerCase();

  const prefixMatch = normalized.match(
    /^(\d+(?:\.\d+)?)\s*(kg|gm|g|gram|grams|x|count|piece|pieces|pc|pcs)?\s+(.+)$/i,
  );

  if (prefixMatch) {
    const quantityValue = prefixMatch[1] ?? '0';
    const foodValue = prefixMatch[3] ?? '';

    return {
      text,
      quantity: Number(quantityValue),
      unit: prefixMatch[2] ?? null,
      foodName: foodValue.trim(),
    };
  }

  const suffixMatch = normalized.match(
    /^(.+?)\s+(\d+(?:\.\d+)?)\s*(kg|gm|g|gram|grams|x|count|piece|pieces|pc|pcs)?$/i,
  );

  if (suffixMatch) {
    const quantityValue = suffixMatch[2] ?? '0';
    const foodValue = suffixMatch[1] ?? '';

    return {
      text,
      quantity: Number(quantityValue),
      unit: suffixMatch[3] ?? null,
      foodName: foodValue.trim(),
    };
  }

  return {
    text,
    quantity: null,
    unit: null,
    foodName: normalized,
  };
}

async function findBestFood(rawFoodName: string): Promise<Food | null> {
  const foodName = rawFoodName.trim();

  if (!foodName) {
    return null;
  }

  const candidates = await listFoods(foodName);

  if (candidates.length === 0) {
    const singularName = foodName.endsWith('s') ? foodName.slice(0, -1) : foodName;
    if (singularName !== foodName) {
      const singularCandidates = await listFoods(singularName);
      return pickBestMatch(singularName, singularCandidates);
    }
    return null;
  }

  return pickBestMatch(foodName, candidates);
}

function pickBestMatch(query: string, candidates: Food[]): Food | null {
  if (candidates.length === 0) {
    return null;
  }

  const normalizedQuery = query.trim().toLowerCase();

  const exact = candidates.find((candidate) => candidate.name.trim().toLowerCase() === normalizedQuery);
  if (exact) {
    return exact;
  }

  const startsWith = candidates.find((candidate) =>
    candidate.name.trim().toLowerCase().startsWith(normalizedQuery),
  );
  if (startsWith) {
    return startsWith;
  }

  return candidates[0] ?? null;
}

function resolveQuantityInGrams(food: Food, quantity: number | null, unit: string | null): number {
  if (!quantity || quantity <= 0) {
    if (food.servingUnit === 'count') {
      return convertQuantityToGrams(food, 1);
    }

    return 100;
  }

  const normalizedUnit = (unit ?? '').toLowerCase();

  if (normalizedUnit === 'kg') {
    return quantity * 1000;
  }

  if (normalizedUnit === 'g' || normalizedUnit === 'gm' || normalizedUnit === 'gram' || normalizedUnit === 'grams') {
    return quantity;
  }

  if (
    normalizedUnit === 'x' ||
    normalizedUnit === 'count' ||
    normalizedUnit === 'piece' ||
    normalizedUnit === 'pieces' ||
    normalizedUnit === 'pc' ||
    normalizedUnit === 'pcs'
  ) {
    return convertQuantityToGrams(food, quantity);
  }

  if (food.servingUnit === 'count') {
    return convertQuantityToGrams(food, quantity);
  }

  return quantity;
}