import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AddFoodSheet } from '../../src/features/food-log/components/AddFoodSheet';
import { MEAL_LABELS } from '../../src/constants/meals';
import { getOrCreateDailyLog } from '../../src/repositories/dailyLogRepository';
import { getOrCreateMeal } from '../../src/repositories/mealRepository';
import { useDashboardData } from '../../src/hooks/useDashboardData';
import { useMealActions } from '../../src/features/food-log/hooks/useMealActions';
import { getDashboardData } from '../../src/services/logService';
import {
  getMealSuggestions,
  parseFoodInput,
  type ParsedFoodEntry,
} from '../../src/services/aiNutritionService';
import { colors } from '../../src/theme/colors';
import {
  convertGramsToQuantity,
  convertQuantityToGrams,
  formatFoodQuantity,
  getQuantityInputLabel,
} from '../../src/utils/foodServing';
import type { Food, MealType } from '../../src/types';

export default function AddFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const dateParam = params.date as string | undefined;
  const date: string = (dateParam || new Date().toISOString().split('T')[0]) as string;
  const mealType = (params.mealType as MealType) || 'breakfast';

  const { data, isLoading, refresh } = useDashboardData(date);
  const { addFoodToMeal, editMealItem, deleteMealItem, isLoading: isActionLoading } = useMealActions();

  const [showAddFoodSheet, setShowAddFoodSheet] = useState<boolean>(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [aiInput, setAiInput] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiMatchedItems, setAiMatchedItems] = useState<ParsedFoodEntry[]>([]);
  const [aiUnmatchedItems, setAiUnmatchedItems] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleAddFood = async (food: Food, quantityG: number) => {
    try {
      // Get or create daily log and meal
      const dailyLog = await getOrCreateDailyLog(date);
      const meal = await getOrCreateMeal(dailyLog.id, mealType);

      // Add food to meal
      await addFoodToMeal(meal.id, food, quantityG);

      // Refresh dashboard
      await refresh();
      setShowAddFoodSheet(false);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add food');
    }
  };

  const handleEditItem = async (itemId: number, food: Food, newQuantity: number) => {
    try {
      await editMealItem(itemId, newQuantity, food);
      await refresh();
      setEditingItemId(null);
      setEditQuantity('');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to edit item');
    }
  };

  const handleDeleteItem = (itemId: number) => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      {
        text: 'Cancel',
        onPress: () => {},
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMealItem(itemId);
            await refresh();
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const handleAiParseAndAdd = async () => {
    if (!aiInput.trim()) {
      return;
    }

    try {
      setIsAiLoading(true);

      const parsed = await parseFoodInput(aiInput);

      if (parsed.matched.length === 0) {
        setAiMatchedItems([]);
        setAiUnmatchedItems(parsed.unmatched);
        Alert.alert('No items recognized', 'Try inputs like: 3 eggs and 150g rice');
        return;
      }

      const dailyLog = await getOrCreateDailyLog(date);
      const mealEntity = await getOrCreateMeal(dailyLog.id, mealType);

      for (const entry of parsed.matched) {
        await addFoodToMeal(mealEntity.id, entry.food, entry.quantityG);
      }

      await refresh();
      const latestDashboard = await getDashboardData(date);

      setAiMatchedItems(parsed.matched);
      setAiUnmatchedItems(parsed.unmatched);
      setAiSuggestions(await getMealSuggestions(latestDashboard));
      setAiInput('');
    } catch (error) {
      Alert.alert('AI Add Failed', error instanceof Error ? error.message : 'Unable to process AI food input');
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0E9F6E" />
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load meal data</Text>
        </View>
      </SafeAreaView>
    );
  }

  const meal = data.meals[mealType];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.accent} />
          </Pressable>
          <Text style={styles.title}>{MEAL_LABELS[mealType]}</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.date}>{date}</Text>

        {/* Meal Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Total Macros</Text>
          <Text style={styles.summaryValue}>
            {meal.totals.calories} kcal • P {meal.totals.proteinG}g • C {meal.totals.carbsG}g • F {meal.totals.fatG}g
          </Text>
        </View>

        <View style={styles.aiCard}>
          <Text style={styles.aiTitle}>AI Quick Add</Text>
          <Text style={styles.aiHint}>Try: 3 eggs and 150g rice</Text>
          <TextInput
            style={styles.aiInput}
            value={aiInput}
            onChangeText={setAiInput}
            placeholder="Type meal items in plain English"
            placeholderTextColor={colors.textMuted}
            editable={!isAiLoading}
          />

          <Pressable
            style={[styles.aiButton, isAiLoading && styles.aiButtonDisabled]}
            onPress={handleAiParseAndAdd}
            disabled={isAiLoading}
          >
            {isAiLoading ? (
              <ActivityIndicator size="small" color="#052E16" />
            ) : (
              <Text style={styles.aiButtonText}>Parse And Add</Text>
            )}
          </Pressable>

          {aiMatchedItems.length > 0 ? (
            <View style={styles.aiResultSection}>
              <Text style={styles.aiResultTitle}>Added</Text>
              {aiMatchedItems.map((item) => (
                <Text key={`${item.food.id}-${item.parsedText}`} style={styles.aiResultText}>
                  • {item.interpretedAs}
                </Text>
              ))}
            </View>
          ) : null}

          {aiUnmatchedItems.length > 0 ? (
            <View style={styles.aiResultSection}>
              <Text style={styles.aiResultTitle}>Couldn&apos;t Match</Text>
              {aiUnmatchedItems.map((item) => (
                <Text key={item} style={styles.aiResultTextMuted}>
                  • {item}
                </Text>
              ))}
            </View>
          ) : null}

          {aiSuggestions.length > 0 ? (
            <View style={styles.aiResultSection}>
              <Text style={styles.aiResultTitle}>Next Meal Suggestions</Text>
              {aiSuggestions.map((suggestion, index) => (
                <Text key={`${index}-${suggestion}`} style={styles.aiResultText}>
                  • {suggestion}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        {/* Food Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>

          {meal.items.length === 0 ? (
            <Text style={styles.emptyText}>No items added yet</Text>
          ) : (
            meal.items.map((item) => (
              <View key={item.id} style={styles.foodItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.food.name}</Text>
                  <Text style={styles.itemQuantity}>{formatFoodQuantity(item.food, item.quantityG)}</Text>
                  <Text style={styles.itemMacros}>
                    {item.calories} kcal • P {item.proteinG}g • C {item.carbsG}g • F {item.fatG}g
                  </Text>
                </View>

                <View style={styles.itemActions}>
                  <Pressable
                    onPress={() => {
                      setEditingItemId(item.id);
                      setEditQuantity(convertGramsToQuantity(item.food, item.quantityG).toString());
                    }}
                    disabled={isActionLoading}
                  >
                    <Ionicons name="pencil" size={20} color="#0E9F6E" />
                  </Pressable>
                  <Pressable onPress={() => handleDeleteItem(item.id)} disabled={isActionLoading}>
                    <Ionicons name="trash" size={20} color="#B91C1C" />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Edit Modal */}
        {editingItemId && (
          <View style={styles.editModal}>
            <View style={styles.editModalContent}>
              <Text style={styles.editModalTitle}>Edit Quantity</Text>

              {(() => {
                const item = meal.items.find((i) => i.id === editingItemId);
                if (!item) return null;

                return (
                  <>
                    <Text style={styles.editModalLabel}>{item.food.name}</Text>

                    <Text style={styles.editModalLabel}>{getQuantityInputLabel(item.food)}</Text>

                    <TextInput
                      style={styles.editInput}
                      placeholder={item.food.servingUnit === 'count' ? '1' : '100'}
                      value={editQuantity}
                      onChangeText={setEditQuantity}
                      keyboardType="decimal-pad"
                      autoFocus
                    />

                    <View style={styles.editActions}>
                      <Pressable
                        style={styles.editCancelButton}
                        onPress={() => {
                          setEditingItemId(null);
                          setEditQuantity('');
                        }}
                      >
                        <Text style={styles.editCancelButtonText}>Cancel</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.editSaveButton, isActionLoading && styles.editSaveButtonDisabled]}
                        onPress={() =>
                          handleEditItem(
                            editingItemId,
                            item.food,
                            convertQuantityToGrams(item.food, Number(editQuantity)),
                          )
                        }
                        disabled={isActionLoading}
                      >
                        {isActionLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.editSaveButtonText}>Save</Text>
                        )}
                      </Pressable>
                    </View>
                  </>
                );
              })()}
            </View>
          </View>
        )}

        <View style={styles.actionButtons}>
          <Pressable style={styles.addButton} onPress={() => setShowAddFoodSheet(true)} disabled={isActionLoading}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Food</Text>
          </Pressable>

          <Pressable
            style={styles.savedMealsButton}
            disabled={isActionLoading}
            onPress={() =>
              router.push({
                pathname: '/meals/saved',
                params: {
                  date,
                  mealType,
                  mealId: String(meal.meal.id),
                },
              })
            }
          >
            <Ionicons name="bookmark" size={18} color="#111827" />
            <Text style={styles.savedMealsButtonText}>Use Saved Meal</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Add Food Sheet Modal */}
      <AddFoodSheet
        visible={showAddFoodSheet}
        onClose={() => setShowAddFoodSheet(false)}
        onAddFood={handleAddFood}
        mealTypeLabel={MEAL_LABELS[mealType]}
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.danger,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  date: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
  },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  summaryValue: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  aiCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 16,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  aiHint: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
  },
  aiInput: {
    marginTop: 10,
    backgroundColor: colors.input,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  aiButton: {
    marginTop: 10,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  aiButtonDisabled: {
    opacity: 0.5,
  },
  aiButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#052E16',
  },
  aiResultSection: {
    marginTop: 10,
  },
  aiResultTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  aiResultText: {
    fontSize: 12,
    color: colors.text,
    marginBottom: 2,
  },
  aiResultTextMuted: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },
  foodItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  itemQuantity: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
  },
  itemMacros: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 12,
  },
  editModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  editModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  editModalLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 12,
  },
  editInput: {
    backgroundColor: colors.input,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editCancelButton: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  editSaveButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editSaveButtonDisabled: {
    opacity: 0.5,
  },
  editSaveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#052E16',
  },
  actionButtons: {
    marginTop: 12,
    gap: 8,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#052E16',
  },
  savedMealsButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 11,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  savedMealsButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});
