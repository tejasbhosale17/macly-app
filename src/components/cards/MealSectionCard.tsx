import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MEAL_LABELS } from '../../constants/meals';
import { colors } from '../../theme/colors';
import { formatFoodQuantity } from '../../utils/foodServing';
import type { MealType, MealWithItems } from '../../types/meal';

interface MealSectionCardProps {
  mealType: MealType;
  meal: MealWithItems;
  onAddFood?: () => void;
  onUseSavedMeal?: () => void;
}

export function MealSectionCard({ mealType, meal, onAddFood, onUseSavedMeal }: MealSectionCardProps) {
  return (
    <View style={styles.mealCard}>
      <View style={styles.headerRow}>
        <Text style={styles.mealTitle}>{MEAL_LABELS[mealType]}</Text>
        <View style={styles.actionRow}>
          {onUseSavedMeal ? (
            <Pressable style={styles.secondaryButton} onPress={onUseSavedMeal}>
              <Text style={styles.secondaryButtonText}>Saved</Text>
            </Pressable>
          ) : null}
          {onAddFood ? (
            <Pressable style={styles.primaryButton} onPress={onAddFood}>
              <Text style={styles.primaryButtonText}>Add</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <Text style={styles.mealSummary}>
        {meal.totals.calories} kcal • P {meal.totals.proteinG} • C {meal.totals.carbsG} • F {meal.totals.fatG}
      </Text>
      {meal.items.length === 0 ? (
        <Text style={styles.emptyMealText}>No entries yet.</Text>
      ) : (
        meal.items.map((item) => (
          <Text key={item.id} style={styles.mealItemText}>
            {item.food.name} ({formatFoodQuantity(item.food, item.quantityG)})
          </Text>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mealCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  mealSummary: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyMealText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textMuted,
  },
  mealItemText: {
    marginTop: 6,
    fontSize: 13,
    color: colors.text,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  primaryButtonText: {
    color: '#052E16',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
});
