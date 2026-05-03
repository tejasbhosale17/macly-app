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
            <Ionicons name="chevron-back" size={24} color="#0E9F6E" />
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
                  <Text style={styles.itemQuantity}>{item.quantityG}g</Text>
                  <Text style={styles.itemMacros}>
                    {item.calories} kcal • P {item.proteinG}g • C {item.carbsG}g • F {item.fatG}g
                  </Text>
                </View>

                <View style={styles.itemActions}>
                  <Pressable
                    onPress={() => {
                      setEditingItemId(item.id);
                      setEditQuantity(item.quantityG.toString());
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

                    <TextInput
                      style={styles.editInput}
                      placeholder="Quantity (g)"
                      value={editQuantity}
                      onChangeText={setEditQuantity}
                      keyboardType="number-pad"
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
                          handleEditItem(editingItemId, item.food, parseInt(editQuantity, 10))
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

        {/* Add Food Button */}
        <Pressable style={styles.addButton} onPress={() => setShowAddFoodSheet(true)} disabled={isActionLoading}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Food</Text>
        </Pressable>
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
    backgroundColor: '#F7F8FA',
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
    color: '#B91C1C',
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
    color: '#111827',
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  summary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  summaryValue: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 16,
  },
  foodItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#111827',
  },
  itemQuantity: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  itemMacros: {
    marginTop: 4,
    fontSize: 12,
    color: '#374151',
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  editModalLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  editInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  editSaveButton: {
    flex: 1,
    backgroundColor: '#0E9F6E',
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
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#0E9F6E',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
