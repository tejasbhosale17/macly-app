import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { MEAL_LABELS, MEAL_TYPES } from '../../src/constants/meals';
import { useDashboardData } from '../../src/hooks/useDashboardData';
import { useFoods } from '../../src/hooks/useFoods';
import { useHistory } from '../../src/hooks/useHistory';
import {
  createFoodLogEntry,
  deleteFoodLogEntry,
  updateFoodLogEntry,
} from '../../src/services/logService';
import type { MealType } from '../../src/types';
import { getTodayDateString } from '../../src/utils/dateUtils';

function toPositiveNumber(value: string): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function HistoryScreen() {
  const today = getTodayDateString();
  const { data: dashboard, refresh: refreshDashboard } = useDashboardData(today);
  const { history, refresh: refreshHistory } = useHistory(14);

  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [foodQuery, setFoodQuery] = useState<string>('');
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
  const [gramsInput, setGramsInput] = useState<string>('100');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { foods } = useFoods(foodQuery);

  const selectedFoodName = useMemo(() => {
    if (!selectedFoodId) {
      return 'None selected';
    }

    const found = foods.find((food) => food.id === selectedFoodId);
    return found ? found.name : `Food #${selectedFoodId}`;
  }, [foods, selectedFoodId]);

  useFocusEffect(
    useCallback(() => {
      refreshDashboard();
      refreshHistory();
    }, [refreshDashboard, refreshHistory]),
  );

  async function onAddEntry() {
    const grams = toPositiveNumber(gramsInput);

    if (!grams || !selectedFoodId) {
      setErrorMessage('Select a food and valid grams first.');
      return;
    }

    try {
      setErrorMessage(null);
      await createFoodLogEntry({
        date: today,
        mealType: selectedMealType,
        foodId: selectedFoodId,
        quantityG: grams,
      });
      setGramsInput('100');
      await refreshDashboard();
      await refreshHistory();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add entry');
    }
  }

  async function onAdjustItem(itemId: number, nextQuantity: number) {
    if (nextQuantity <= 0) {
      await onDeleteItem(itemId);
      return;
    }

    await updateFoodLogEntry({
      mealItemId: itemId,
      quantityG: nextQuantity,
    });
    await refreshDashboard();
    await refreshHistory();
  }

  async function onDeleteItem(itemId: number) {
    await deleteFoodLogEntry(itemId);
    await refreshDashboard();
    await refreshHistory();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Food Log</Text>
        <Text style={styles.subtitle}>Create, edit, and delete meal entries for today.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>1) Select meal</Text>
          <View style={styles.pillRow}>
            {MEAL_TYPES.map((mealType) => (
              <Pressable
                key={mealType}
                style={[
                  styles.pill,
                  selectedMealType === mealType ? styles.pillActive : undefined,
                ]}
                onPress={() => setSelectedMealType(mealType)}
              >
                <Text
                  style={[
                    styles.pillText,
                    selectedMealType === mealType ? styles.pillTextActive : undefined,
                  ]}
                >
                  {MEAL_LABELS[mealType]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.cardTitle}>2) Search food</Text>
          <TextInput
            value={foodQuery}
            onChangeText={setFoodQuery}
            placeholder="Type food name"
            style={styles.input}
          />
          <View style={styles.foodList}>
            {foods.slice(0, 8).map((food) => (
              <Pressable
                key={food.id}
                style={[styles.foodItem, selectedFoodId === food.id ? styles.foodItemActive : undefined]}
                onPress={() => setSelectedFoodId(food.id)}
              >
                <Text style={styles.foodName}>{food.name}</Text>
                <Text style={styles.foodMeta}>{food.caloriesPer100g} kcal/100g</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.selectedFoodText}>Selected: {selectedFoodName}</Text>

          <Text style={styles.cardTitle}>3) Enter quantity (grams)</Text>
          <TextInput
            value={gramsInput}
            onChangeText={setGramsInput}
            keyboardType="numeric"
            style={styles.input}
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <Pressable style={styles.primaryButton} onPress={onAddEntry}>
            <Text style={styles.primaryButtonText}>Add Entry</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today&apos;s Entries</Text>
          {dashboard
            ? MEAL_TYPES.map((mealType) => {
                const meal = dashboard.meals[mealType];
                return (
                  <View key={mealType} style={styles.mealBlock}>
                    <Text style={styles.mealHeading}>{MEAL_LABELS[mealType]}</Text>
                    {meal.items.length === 0 ? (
                      <Text style={styles.emptyText}>No items</Text>
                    ) : (
                      meal.items.map((item) => (
                        <View key={item.id} style={styles.entryRow}>
                          <View style={styles.entryInfo}>
                            <Text style={styles.entryName}>{item.food.name}</Text>
                            <Text style={styles.entryMeta}>
                              {item.quantityG}g • {item.calories} kcal
                            </Text>
                          </View>
                          <View style={styles.entryActions}>
                            <Pressable
                              style={styles.smallButton}
                              onPress={() => onAdjustItem(item.id, item.quantityG - 10)}
                            >
                              <Text style={styles.smallButtonText}>-10g</Text>
                            </Pressable>
                            <Pressable
                              style={styles.smallButton}
                              onPress={() => onAdjustItem(item.id, item.quantityG + 10)}
                            >
                              <Text style={styles.smallButtonText}>+10g</Text>
                            </Pressable>
                            <Pressable style={styles.deleteButton} onPress={() => onDeleteItem(item.id)}>
                              <Text style={styles.deleteButtonText}>Delete</Text>
                            </Pressable>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                );
              })
            : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Days</Text>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>No history yet.</Text>
          ) : (
            history.map((day) => (
              <View key={day.date} style={styles.historyRow}>
                <Text style={styles.historyDate}>{day.date}</Text>
                <Text style={styles.historyMeta}>
                  {day.totals.calories} kcal • P {day.totals.proteinG} • C {day.totals.carbsG} • F {day.totals.fatG}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 10,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  pillActive: {
    backgroundColor: '#0E9F6E',
    borderColor: '#0E9F6E',
  },
  pillText: {
    fontSize: 13,
    color: '#374151',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  foodList: {
    marginBottom: 8,
  },
  foodItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  foodItemActive: {
    borderColor: '#0E9F6E',
    backgroundColor: '#ECFDF5',
  },
  foodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  foodMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  selectedFoodText: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 10,
  },
  errorText: {
    color: '#B91C1C',
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#0E9F6E',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mealBlock: {
    marginBottom: 10,
  },
  mealHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
  },
  entryRow: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryInfo: {
    flex: 1,
    paddingRight: 8,
  },
  entryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  entryMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  entryActions: {
    flexDirection: 'row',
    gap: 6,
  },
  smallButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  smallButtonText: {
    fontSize: 12,
    color: '#374151',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '600',
  },
  historyRow: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  historyMeta: {
    fontSize: 14,
    color: '#374151',
  },
});
