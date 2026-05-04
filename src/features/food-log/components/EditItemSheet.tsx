import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors } from '../../../theme/colors';
import {
  convertGramsToQuantity,
  convertQuantityToGrams,
  getQuantityInputLabel,
  isCountBasedFood,
} from '../../../utils/foodServing';
import { scaleMacrosByGrams } from '../../../utils/macroCalculations';
import type { MealItemWithFood } from '../../../types';

type Props = {
  item: MealItemWithFood | null;
  isSaving: boolean;
  onSave: (newQuantityG: number) => void;
  onClose: () => void;
};

export function EditItemSheet({ item, isSaving, onSave, onClose }: Props) {
  const [rawInput, setRawInput] = useState('');

  // Reset input when item changes
  useEffect(() => {
    if (item) {
      const displayQty = convertGramsToQuantity(item.food, item.quantityG);
      setRawInput(String(displayQty));
    }
  }, [item]);

  if (!item) return null;

  const displayQty = parseFloat(rawInput) || 0;
  const quantityG = convertQuantityToGrams(item.food, displayQty);
  const isCount = isCountBasedFood(item.food);

  const preview =
    quantityG > 0
      ? scaleMacrosByGrams(
          {
            calories: item.food.caloriesPer100g,
            proteinG: item.food.proteinPer100g,
            carbsG: item.food.carbsPer100g,
            fatG: item.food.fatPer100g,
          },
          quantityG,
        )
      : null;

  const canSave = displayQty > 0 && !isSaving;

  return (
    <Modal
      visible={item !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetWrapper}
      >
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Food name */}
          <Text style={styles.foodName}>{item.food.name}</Text>
          <Text style={styles.foodHint}>
            {item.food.caloriesPer100g} kcal · {item.food.proteinPer100g}g P ·{' '}
            {item.food.carbsPer100g}g C · {item.food.fatPer100g}g F per 100g
          </Text>

          {/* Quantity input */}
          <Text style={styles.inputLabel}>{getQuantityInputLabel(item.food)}</Text>
          <TextInput
            style={styles.input}
            value={rawInput}
            onChangeText={setRawInput}
            keyboardType="decimal-pad"
            selectTextOnFocus
            placeholderTextColor={colors.textMuted}
            placeholder={isCount ? '1' : '100'}
          />

          {/* Live macro preview */}
          {preview && quantityG > 0 ? (
            <View style={styles.previewRow}>
              <View style={styles.previewCell}>
                <Text style={styles.previewValue}>{Math.round(preview.calories)}</Text>
                <Text style={styles.previewLabel}>kcal</Text>
              </View>
              <View style={styles.previewCell}>
                <Text style={styles.previewValue}>{Math.round(preview.proteinG)}g</Text>
                <Text style={styles.previewLabel}>protein</Text>
              </View>
              <View style={styles.previewCell}>
                <Text style={styles.previewValue}>{Math.round(preview.carbsG)}g</Text>
                <Text style={styles.previewLabel}>carbs</Text>
              </View>
              <View style={styles.previewCell}>
                <Text style={styles.previewValue}>{Math.round(preview.fatG)}g</Text>
                <Text style={styles.previewLabel}>fat</Text>
              </View>
            </View>
          ) : null}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
              onPress={onClose}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                (!canSave || pressed) && styles.btnPressed,
              ]}
              onPress={() => canSave && onSave(quantityG)}
              disabled={!canSave}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    padding: 24,
    paddingBottom: 36,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 20,
  },

  foodName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  foodHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 20,
  },

  inputLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.input,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    padding: 14,
    marginBottom: 16,
  },

  previewRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  previewCell: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  previewLabel: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textMuted,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 15,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  saveBtnText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 15,
  },
  btnPressed: {
    opacity: 0.7,
  },
});
