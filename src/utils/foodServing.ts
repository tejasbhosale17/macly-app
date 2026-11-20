import type { Food } from '../types';

function roundToTwo(value: number): number {
  return Number(value.toFixed(2));
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return roundToTwo(value).toString();
}

export function isCountBasedFood(food: Food): boolean {
  return food.servingUnit === 'count' && Number(food.gramsPerUnit) > 0;
}

export function convertQuantityToGrams(food: Food, quantity: number): number {
  if (isCountBasedFood(food) && food.gramsPerUnit) {
    return roundToTwo(quantity * food.gramsPerUnit);
  }

  return roundToTwo(quantity);
}

export function convertGramsToQuantity(food: Food, quantityG: number): number {
  if (isCountBasedFood(food) && food.gramsPerUnit) {
    return roundToTwo(quantityG / food.gramsPerUnit);
  }

  return roundToTwo(quantityG);
}

export function getQuantityInputLabel(food: Food): string {
  if (isCountBasedFood(food)) {
    const label = food.servingLabel?.trim() || 'item';
    return `Quantity (${label}s)`;
  }

  return 'Quantity (grams)';
}

export function getQuantityPreviewLabel(food: Food, quantity: number): string {
  if (isCountBasedFood(food)) {
    return formatServingCount(food, quantity);
  }

  return `${formatNumber(quantity)}g`;
}

export function formatFoodQuantity(food: Food, quantityG: number): string {
  if (isCountBasedFood(food)) {
    return formatServingCount(food, convertGramsToQuantity(food, quantityG));
  }

  return `${formatNumber(quantityG)}g`;
}

function formatServingCount(food: Food, quantity: number): string {
  const label = food.servingLabel?.trim() || 'item';
  const suffix = quantity === 1 ? label : `${label}s`;
  return `${formatNumber(quantity)} ${suffix}`;
}