import { StyleSheet, Text, View } from 'react-native';

import { MEAL_LABELS } from '../../constants/meals';
import type { MealType, MealWithItems } from '../../types/meal';

interface MealSectionCardProps {
  mealType: MealType;
  meal: MealWithItems;
}

export function MealSectionCard({ mealType, meal }: MealSectionCardProps) {
  return (
    <View style={styles.mealCard}>
      <Text style={styles.mealTitle}>{MEAL_LABELS[mealType]}</Text>
      <Text style={styles.mealSummary}>
        {meal.totals.calories} kcal • P {meal.totals.proteinG} • C {meal.totals.carbsG} • F {meal.totals.fatG}
      </Text>
      {meal.items.length === 0 ? (
        <Text style={styles.emptyMealText}>No entries yet.</Text>
      ) : (
        meal.items.map((item) => (
          <Text key={item.id} style={styles.mealItemText}>
            {item.food.name} ({item.quantityG}g)
          </Text>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 10,
  },
  mealTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  mealSummary: {
    marginTop: 6,
    fontSize: 13,
    color: '#374151',
  },
  emptyMealText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },
  mealItemText: {
    marginTop: 6,
    fontSize: 13,
    color: '#111827',
  },
});
