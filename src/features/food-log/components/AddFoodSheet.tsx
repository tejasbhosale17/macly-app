import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { FoodSearchList } from './FoodSearchList';
import { useFoodSearch } from '../hooks/useFoodSearch';
import { scaleMacrosByGrams } from '../../../utils/macroCalculations';
import type { Food } from '../../../types/food';

interface AddFoodSheetProps {
  visible: boolean;
  onClose: () => void;
  onAddFood: (food: Food, quantityG: number) => Promise<void>;
  mealTypeLabel: string;
}

export function AddFoodSheet({ visible, onClose, onAddFood, mealTypeLabel }: AddFoodSheetProps) {
  const { query, foods, isLoading, setQuery } = useFoodSearch();
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantityG, setQuantityG] = useState<string>('100');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedFoodMacros = selectedFood
    ? scaleMacrosByGrams(
        {
          calories: selectedFood.caloriesPer100g,
          proteinG: selectedFood.proteinPer100g,
          carbsG: selectedFood.carbsPer100g,
          fatG: selectedFood.fatPer100g,
        },
        parseInt(quantityG, 10) || 0,
      )
    : null;

  const handleAddFood = async () => {
    if (!selectedFood || !quantityG) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddFood(selectedFood, parseInt(quantityG, 10));
      // Reset form
      setSelectedFood(null);
      setQuantityG('100');
      setQuery('');
      onClose();
    } catch {
      // Error is handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </Pressable>
            <Text style={styles.title}>Add Food to {mealTypeLabel}</Text>
            <View style={{ width: 50 }} />
          </View>

          {/* Search Section */}
          {!selectedFood ? (
            <>
              <TextInput
                style={styles.searchInput}
                placeholder="Search foods..."
                value={query}
                onChangeText={setQuery}
                placeholderTextColor="#9CA3AF"
                editable={!isSubmitting}
              />

              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#0E9F6E" />
                </View>
              )}

              <FoodSearchList foods={foods} isLoading={isLoading} onSelectFood={setSelectedFood} />
            </>
          ) : (
            <>
              {/* Selected Food Display */}
              <View style={styles.selectedFoodCard}>
                <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
                <Text style={styles.selectedFoodMacros}>
                  Per 100g: {selectedFood.caloriesPer100g} kcal • P {selectedFood.proteinPer100g}g • C {selectedFood.carbsPer100g}g • F {selectedFood.fatPer100g}g
                </Text>

                <Pressable style={styles.changeButton} onPress={() => setSelectedFood(null)}>
                  <Text style={styles.changeButtonText}>Change Food</Text>
                </Pressable>
              </View>

              {/* Quantity Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quantity (grams)</Text>
                <TextInput
                  style={styles.quantityInput}
                  placeholder="100"
                  value={quantityG}
                  onChangeText={setQuantityG}
                  keyboardType="number-pad"
                  placeholderTextColor="#9CA3AF"
                  editable={!isSubmitting}
                />
              </View>

              {/* Calculated Macros */}
              {selectedFoodMacros && (
                <View style={styles.calculatedMacros}>
                  <Text style={styles.calculatedTitle}>For {quantityG}g:</Text>
                  <View style={styles.macroRow}>
                    <View style={styles.macroBox}>
                      <Text style={styles.macroLabel}>Calories</Text>
                      <Text style={styles.macroValue}>{selectedFoodMacros.calories}</Text>
                    </View>
                    <View style={styles.macroBox}>
                      <Text style={styles.macroLabel}>Protein</Text>
                      <Text style={styles.macroValue}>{selectedFoodMacros.proteinG}g</Text>
                    </View>
                  </View>
                  <View style={styles.macroRow}>
                    <View style={styles.macroBox}>
                      <Text style={styles.macroLabel}>Carbs</Text>
                      <Text style={styles.macroValue}>{selectedFoodMacros.carbsG}g</Text>
                    </View>
                    <View style={styles.macroBox}>
                      <Text style={styles.macroLabel}>Fat</Text>
                      <Text style={styles.macroValue}>{selectedFoodMacros.fatG}g</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Add Button */}
              <Pressable
                style={[styles.addButton, isSubmitting && styles.addButtonDisabled]}
                onPress={handleAddFood}
                disabled={isSubmitting || !quantityG}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.addButtonText}>Add to {mealTypeLabel}</Text>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cancelButton: {
    fontSize: 16,
    color: '#0E9F6E',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  selectedFoodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },
  selectedFoodName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  selectedFoodMacros: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  changeButton: {
    paddingVertical: 8,
  },
  changeButtonText: {
    fontSize: 14,
    color: '#0E9F6E',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  quantityInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  calculatedMacros: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 16,
    marginBottom: 20,
  },
  calculatedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 12,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  macroBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
  },
  addButton: {
    backgroundColor: '#0E9F6E',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
