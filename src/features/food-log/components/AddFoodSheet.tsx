import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { FoodSearchList } from './FoodSearchList';
import { useFoodSearch } from '../hooks/useFoodSearch';
import { createCustomFood, getFoodById } from '../../../repositories/foodRepository';
import { colors } from '../../../theme/colors';
import {
  convertQuantityToGrams,
  getQuantityInputLabel,
  getQuantityPreviewLabel,
  isCountBasedFood,
} from '../../../utils/foodServing';
import { scaleMacrosByGrams } from '../../../utils/macroCalculations';
import type { Food, ServingUnit } from '../../../types/food';

interface AddFoodSheetProps {
  visible: boolean;
  onClose: () => void;
  onAddFood: (food: Food, quantityG: number) => Promise<void>;
  mealTypeLabel: string;
}

type CustomFoodForm = {
  name: string;
  caloriesPer100g: string;
  proteinPer100g: string;
  carbsPer100g: string;
  fatPer100g: string;
  servingUnit: ServingUnit;
  gramsPerUnit: string;
  servingLabel: string;
};

const initialCustomFoodForm: CustomFoodForm = {
  name: '',
  caloriesPer100g: '',
  proteinPer100g: '',
  carbsPer100g: '',
  fatPer100g: '',
  servingUnit: 'grams',
  gramsPerUnit: '50',
  servingLabel: 'item',
};

function parsePositiveNumber(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function AddFoodSheet({ visible, onClose, onAddFood, mealTypeLabel }: AddFoodSheetProps) {
  const { query, foods, isLoading, setQuery } = useFoodSearch();
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantityG, setQuantityG] = useState<string>('100');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [mode, setMode] = useState<'search' | 'custom'>('search');
  const [customFoodForm, setCustomFoodForm] = useState<CustomFoodForm>(initialCustomFoodForm);
  const [customFoodError, setCustomFoodError] = useState<string | null>(null);

  const enteredQuantity = useMemo(() => Number(quantityG), [quantityG]);

  const selectedFoodMacros = selectedFood
    ? scaleMacrosByGrams(
        {
          calories: selectedFood.caloriesPer100g,
          proteinG: selectedFood.proteinPer100g,
          carbsG: selectedFood.carbsPer100g,
          fatG: selectedFood.fatPer100g,
        },
        convertQuantityToGrams(selectedFood, enteredQuantity || 0),
      )
    : null;

  const handleAddFood = async () => {
    if (!selectedFood || !quantityG) {
      return;
    }

    const parsedQuantity = parsePositiveNumber(quantityG);
    if (!parsedQuantity) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddFood(selectedFood, convertQuantityToGrams(selectedFood, parsedQuantity));
      // Reset form
      setSelectedFood(null);
      setQuantityG('100');
      setQuery('');
      setMode('search');
      onClose();
    } catch {
      // Error is handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCustomFood = async () => {
    const name = customFoodForm.name.trim();
    const caloriesPer100g = parsePositiveNumber(customFoodForm.caloriesPer100g);
    const proteinPer100g = parsePositiveNumber(customFoodForm.proteinPer100g);
    const carbsPer100g = parsePositiveNumber(customFoodForm.carbsPer100g);
    const fatPer100g = parsePositiveNumber(customFoodForm.fatPer100g);

    if (!name || !caloriesPer100g || !proteinPer100g || !carbsPer100g || !fatPer100g) {
      setCustomFoodError('Enter a name and valid macros for the custom food.');
      return;
    }

    const gramsPerUnit =
      customFoodForm.servingUnit === 'count'
        ? parsePositiveNumber(customFoodForm.gramsPerUnit)
        : null;

    if (customFoodForm.servingUnit === 'count' && !gramsPerUnit) {
      setCustomFoodError('Enter how many grams one serving weighs.');
      return;
    }

    try {
      setIsSubmitting(true);
      setCustomFoodError(null);

      const foodId = await createCustomFood({
        name,
        caloriesPer100g,
        proteinPer100g,
        carbsPer100g,
        fatPer100g,
        servingUnit: customFoodForm.servingUnit,
        gramsPerUnit,
        servingLabel:
          customFoodForm.servingUnit === 'count'
            ? customFoodForm.servingLabel.trim() || 'item'
            : null,
      });

      const createdFood = await getFoodById(foodId);
      if (!createdFood) {
        throw new Error('Failed to load custom food');
      }

      setSelectedFood(createdFood);
      setQuantityG(createdFood.servingUnit === 'count' ? '1' : '100');
      setMode('search');
      setCustomFoodForm(initialCustomFoodForm);
      setQuery(createdFood.name);
    } catch (error) {
      setCustomFoodError(error instanceof Error ? error.message : 'Failed to create custom food');
    } finally {
      setIsSubmitting(false);
    }
  };

  const emptyMessage =
    query.trim().length < 2
      ? 'Type at least 2 characters to search foods.'
      : 'No foods found. Create a custom one below.';

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
            <Pressable onPress={() => setMode((current) => (current === 'search' ? 'custom' : 'search'))}>
              <Text style={styles.modeToggle}>{mode === 'search' ? 'Custom' : 'Back'}</Text>
            </Pressable>
          </View>

          {/* Search Section */}
          {!selectedFood ? (
            mode === 'search' ? (
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

                <FoodSearchList
                  foods={foods}
                  isLoading={isLoading}
                  onSelectFood={(food) => {
                    setSelectedFood(food);
                    setQuantityG(food.servingUnit === 'count' ? '1' : '100');
                  }}
                  emptyMessage={emptyMessage}
                />

                <Pressable style={styles.customFoodButton} onPress={() => setMode('custom')}>
                  <Text style={styles.customFoodButtonText}>Create Custom Food</Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.customFormCard}>
                <Text style={styles.customFormTitle}>Create Custom Food</Text>

                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.quantityInput}
                  placeholder="Ex: Greek Yogurt Bowl"
                  value={customFoodForm.name}
                  onChangeText={(value) => {
                    setCustomFoodForm((prev) => ({ ...prev, name: value }));
                    setCustomFoodError(null);
                  }}
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.label}>Calories per 100g</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={customFoodForm.caloriesPer100g}
                  onChangeText={(value) => setCustomFoodForm((prev) => ({ ...prev, caloriesPer100g: value }))}
                  keyboardType="decimal-pad"
                  placeholder="120"
                  placeholderTextColor="#9CA3AF"
                />

                <View style={styles.macroRow}>
                  <View style={styles.macroInputBox}>
                    <Text style={styles.label}>Protein</Text>
                    <TextInput
                      style={styles.quantityInput}
                      value={customFoodForm.proteinPer100g}
                      onChangeText={(value) => setCustomFoodForm((prev) => ({ ...prev, proteinPer100g: value }))}
                      keyboardType="decimal-pad"
                      placeholder="10"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={styles.macroInputBox}>
                    <Text style={styles.label}>Carbs</Text>
                    <TextInput
                      style={styles.quantityInput}
                      value={customFoodForm.carbsPer100g}
                      onChangeText={(value) => setCustomFoodForm((prev) => ({ ...prev, carbsPer100g: value }))}
                      keyboardType="decimal-pad"
                      placeholder="15"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <Text style={styles.label}>Fat</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={customFoodForm.fatPer100g}
                  onChangeText={(value) => setCustomFoodForm((prev) => ({ ...prev, fatPer100g: value }))}
                  keyboardType="decimal-pad"
                  placeholder="5"
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.label}>Quantity style</Text>
                <View style={styles.segmentRow}>
                  {(['grams', 'count'] as ServingUnit[]).map((unit) => (
                    <Pressable
                      key={unit}
                      style={[
                        styles.segmentButton,
                        customFoodForm.servingUnit === unit && styles.segmentButtonActive,
                      ]}
                      onPress={() =>
                        setCustomFoodForm((prev) => ({
                          ...prev,
                          servingUnit: unit,
                          servingLabel: unit === 'count' ? prev.servingLabel : 'item',
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.segmentButtonText,
                          customFoodForm.servingUnit === unit && styles.segmentButtonTextActive,
                        ]}
                      >
                        {unit === 'grams' ? 'Grams' : 'Count'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {customFoodForm.servingUnit === 'count' ? (
                  <>
                    <Text style={styles.label}>Serving label</Text>
                    <TextInput
                      style={styles.quantityInput}
                      value={customFoodForm.servingLabel}
                      onChangeText={(value) => setCustomFoodForm((prev) => ({ ...prev, servingLabel: value }))}
                      placeholder="egg"
                      placeholderTextColor="#9CA3AF"
                    />

                    <Text style={styles.label}>Grams per serving</Text>
                    <TextInput
                      style={styles.quantityInput}
                      value={customFoodForm.gramsPerUnit}
                      onChangeText={(value) => setCustomFoodForm((prev) => ({ ...prev, gramsPerUnit: value }))}
                      keyboardType="decimal-pad"
                      placeholder="50"
                      placeholderTextColor="#9CA3AF"
                    />
                  </>
                ) : null}

                {customFoodError ? <Text style={styles.errorText}>{customFoodError}</Text> : null}

                <Pressable
                  style={[styles.addButton, isSubmitting && styles.addButtonDisabled]}
                  onPress={handleCreateCustomFood}
                  disabled={isSubmitting}
                >
                  <Text style={styles.addButtonText}>{isSubmitting ? 'Creating...' : 'Create Food'}</Text>
                </Pressable>
              </View>
            )
          ) : (
            <>
              {/* Selected Food Display */}
              <View style={styles.selectedFoodCard}>
                <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
                <Text style={styles.selectedFoodMacros}>
                  Per 100g: {selectedFood.caloriesPer100g} kcal • P {selectedFood.proteinPer100g}g • C {selectedFood.carbsPer100g}g • F {selectedFood.fatPer100g}g
                </Text>
                {isCountBasedFood(selectedFood) ? (
                  <Text style={styles.selectedFoodHint}>
                    1 {selectedFood.servingLabel ?? 'item'} = {selectedFood.gramsPerUnit}g
                  </Text>
                ) : null}

                <Pressable style={styles.changeButton} onPress={() => setSelectedFood(null)}>
                  <Text style={styles.changeButtonText}>Change Food</Text>
                </Pressable>
              </View>

              {/* Quantity Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{getQuantityInputLabel(selectedFood)}</Text>
                <TextInput
                  style={styles.quantityInput}
                  placeholder={selectedFood.servingUnit === 'count' ? '1' : '100'}
                  value={quantityG}
                  onChangeText={setQuantityG}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#9CA3AF"
                  editable={!isSubmitting}
                />
              </View>

              {/* Calculated Macros */}
              {selectedFoodMacros && (
                <View style={styles.calculatedMacros}>
                  <Text style={styles.calculatedTitle}>For {getQuantityPreviewLabel(selectedFood, enteredQuantity || 0)}:</Text>
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
    backgroundColor: colors.background,
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
  modeToggle: {
    fontSize: 15,
    color: colors.accent,
    fontWeight: '600',
  },
  cancelButton: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  searchInput: {
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
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  selectedFoodCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  selectedFoodName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  selectedFoodMacros: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
  },
  selectedFoodHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
  },
  changeButton: {
    paddingVertical: 8,
  },
  changeButtonText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  customFormCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  customFormTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.danger,
  },
  customFoodButton: {
    marginTop: 16,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  customFoodButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  segmentButton: {
    flex: 1,
    backgroundColor: colors.input,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  segmentButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  segmentButtonTextActive: {
    color: colors.accentText,
  },
  macroInputBox: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  quantityInput: {
    backgroundColor: colors.input,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  calculatedMacros: {
    backgroundColor: colors.accentMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F5132',
    padding: 16,
    marginBottom: 20,
  },
  calculatedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accentText,
    marginBottom: 12,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  macroBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accentText,
  },
  addButton: {
    backgroundColor: colors.accent,
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
    color: '#052E16',
  },
});
