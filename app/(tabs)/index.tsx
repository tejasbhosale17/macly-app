import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { MacroRingCard } from '../../src/components/cards/MacroRingCard';
import { SwipeableItemRow } from '../../src/features/food-log/components/SwipeableItemRow';
import { MEAL_LABELS, MEAL_TYPES } from '../../src/constants/meals';
import { EditItemSheet } from '../../src/features/food-log/components/EditItemSheet';
import { useDashboardData } from '../../src/hooks/useDashboardData';
import { getOrCreateDailyLog } from '../../src/repositories/dailyLogRepository';
import { getOrCreateMeal } from '../../src/repositories/mealRepository';
import { getDashboardData } from '../../src/services/logService';
import {
  getMealSuggestions,
  parseFoodInput,
} from '../../src/services/aiNutritionService';
import { useMealActions } from '../../src/features/food-log/hooks/useMealActions';
import { colors } from '../../src/theme/colors';
import { getGoalTypeLabel } from '../../src/utils/goalCalculator';
import { getTodayDateString } from '../../src/utils/dateUtils';
import { formatFoodQuantity } from '../../src/utils/foodServing';
import type { MealItemWithFood, MealType } from '../../src/types';

export default function DashboardScreen() {
  const today = getTodayDateString();
  const router = useRouter();
  const { data, isLoading, errorMessage, refresh } = useDashboardData(today);
  const { addFoodToMeal, deleteMealItem, editMealItem } = useMealActions();

  const [quickAddText, setQuickAddText] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [isAdding, setIsAdding] = useState(false);
  const [expandedMealType, setExpandedMealType] = useState<MealType | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [unmatchedItems, setUnmatchedItems] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<MealItemWithFood | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadSuggestions = useCallback(async () => {
    try {
      const latest = await getDashboardData(today);
      const s = await getMealSuggestions(latest);
      setSuggestions(s);
    } catch {
      // non-critical, ignore
    }
  }, [today]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      loadSuggestions();
    }, [refresh, loadSuggestions]),
  );

  const handleQuickAdd = async () => {
    if (!quickAddText.trim()) return;

    try {
      setIsAdding(true);
      setUnmatchedItems([]);
      const parsed = await parseFoodInput(quickAddText.trim());

      if (parsed.matched.length === 0) {
        setUnmatchedItems(parsed.unmatched.length > 0 ? parsed.unmatched : [quickAddText.trim()]);
        return;
      }

      const dailyLog = await getOrCreateDailyLog(today);
      const meal = await getOrCreateMeal(dailyLog.id, selectedMealType);

      for (const entry of parsed.matched) {
        await addFoodToMeal(meal.id, entry.food, entry.quantityG);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refresh();
      const latest = await getDashboardData(today);
      setSuggestions(await getMealSuggestions(latest));
      setQuickAddText('');

      if (parsed.unmatched.length > 0) {
        setUnmatchedItems(parsed.unmatched);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add food');
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditSave = async (newQuantityG: number) => {
    if (!editingItem) return;
    try {
      setIsSavingEdit(true);
      await editMealItem(editingItem.id, newQuantityG, editingItem.food);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setEditingItem(null);
      await refresh();
      const latest = await getDashboardData(today);
      setSuggestions(await getMealSuggestions(latest));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update item');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteItem = (itemId: number, foodName: string) => {
    Alert.alert('Remove item', `Remove ${foodName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteMealItem(itemId);
            await refresh();
            const latest = await getDashboardData(today);
            setSuggestions(await getMealSuggestions(latest));
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to remove item');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!data || errorMessage) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorMessage ?? 'Dashboard unavailable'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const mealsWithItems = MEAL_TYPES.filter(
    (mealType) => (data.meals[mealType]?.items?.length ?? 0) > 0,
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Text style={styles.title}>Macly</Text>
        <Text style={styles.subtitle}>Today&apos;s Progress</Text>

        {data.goalType ? (
          <View style={styles.goalBadge}>
            <Text style={styles.goalBadgeLabel}>Current Goal</Text>
            <Text style={styles.goalBadgeValue}>{getGoalTypeLabel(data.goalType)}</Text>
          </View>
        ) : null}

        {/* Macro summary ring */}
        <MacroRingCard metric={data.progress.calories} unit="kcal" />

        <View style={styles.row}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Protein</Text>
            <Text style={styles.metricValue}>{data.progress.proteinG.consumed}g</Text>
            <Text style={styles.metricHint}>{data.progress.proteinG.remaining}g left</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Carbs</Text>
            <Text style={styles.metricValue}>{data.progress.carbsG.consumed}g</Text>
            <Text style={styles.metricHint}>{data.progress.carbsG.remaining}g left</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Fat</Text>
            <Text style={styles.metricValue}>{data.progress.fatG.consumed}g</Text>
            <Text style={styles.metricHint}>{data.progress.fatG.remaining}g left</Text>
          </View>
        </View>

        {/* Quick Add */}
        <View style={styles.quickAddCard}>
          <Text style={styles.sectionTitle}>Log Food</Text>

          <TextInput
            style={styles.quickAddInput}
            value={quickAddText}
            onChangeText={(t) => { setQuickAddText(t); setUnmatchedItems([]); }}
            placeholder="What did you eat? e.g. 2 eggs and 150g oats"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Unmatched items inline warning */}
          {unmatchedItems.length > 0 ? (
            <View style={styles.unmatchedBox}>
              <Text style={styles.unmatchedTitle}>Could not identify:</Text>
              {unmatchedItems.map((item, i) => (
                <Text key={i} style={styles.unmatchedItem}>• {item}</Text>
              ))}
              <Text style={styles.unmatchedHint}>Try adding an OpenAI key or use exact food names.</Text>
            </View>
          ) : null}

          {/* Meal type pill selector */}
          <View style={styles.pillRow}>
            {MEAL_TYPES.map((mealType) => (
              <Pressable
                key={mealType}
                style={[styles.pill, selectedMealType === mealType && styles.pillActive]}
                onPress={() => setSelectedMealType(mealType)}
              >
                <Text style={[styles.pillText, selectedMealType === mealType && styles.pillTextActive]}>
                  {MEAL_LABELS[mealType]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [styles.addButton, (pressed || isAdding) && styles.addButtonPressed]}
            onPress={handleQuickAdd}
            disabled={isAdding || !quickAddText.trim()}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text style={styles.addButtonText}>Add to {MEAL_LABELS[selectedMealType]}</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.savedMealBtn, pressed && styles.savedMealBtnPressed]}
            onPress={() =>
              router.push({
                pathname: '/meals/saved',
                params: {
                  date: today,
                  mealType: selectedMealType,
                  mealId: data?.meals[selectedMealType]?.meal.id
                    ? String(data.meals[selectedMealType].meal.id)
                    : '',
                },
              })
            }
          >
            <Text style={styles.savedMealBtnText}>🔖 Use Saved Meal</Text>
          </Pressable>
        </View>

        {/* Today's logged meals */}
        {mealsWithItems.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today&apos;s Meals</Text>
            {mealsWithItems.map((mealType) => {
              const mealData = data.meals[mealType];
              const isExpanded = expandedMealType === mealType;

              return (
                <View key={mealType} style={styles.mealCard}>
                  {/* Meal header — tap to expand */}
                  <Pressable
                    style={({ pressed }) => [styles.mealCardHeader, pressed && styles.mealCardHeaderPressed]}
                    onPress={() => setExpandedMealType(isExpanded ? null : mealType)}
                  >
                    <Text style={styles.mealCardTitle}>{MEAL_LABELS[mealType]}</Text>
                    <View style={styles.mealCardMeta}>
                      <Text style={styles.mealCardCals}>{Math.round(mealData.totals.calories)} kcal</Text>
                      <Text style={styles.mealCardChevron}>{isExpanded ? '▲' : '▼'}</Text>
                    </View>
                  </Pressable>

                  {/* Macro pills */}
                  <View style={styles.mealMacroRow}>
                    <Text style={styles.mealMacroPill}>P {Math.round(mealData.totals.proteinG)}g</Text>
                    <Text style={styles.mealMacroPill}>C {Math.round(mealData.totals.carbsG)}g</Text>
                    <Text style={styles.mealMacroPill}>F {Math.round(mealData.totals.fatG)}g</Text>
                  </View>

                  {/* Save as template */}
                  {isExpanded && (
                    <Pressable
                      style={({ pressed }) => [styles.saveTemplateBtn, pressed && styles.saveTemplateBtnPressed]}
                      onPress={() =>
                        router.push({
                          pathname: '/meals/saved',
                          params: {
                            date: today,
                            mealType,
                            mealId: String(mealData.meal.id),
                          },
                        })
                      }
                    >
                      <Text style={styles.saveTemplateBtnText}>🔖 Save as Template</Text>
                    </Pressable>
                  )}

                  {/* Expanded food items — swipe left to edit/delete */}
                  {isExpanded && (
                    <View style={styles.itemList}>
                      {mealData.items.map((item) => (
                        <SwipeableItemRow
                          key={item.id}
                          onEdit={() => setEditingItem(item)}
                          onDelete={() => handleDeleteItem(item.id, item.food.name)}
                        >
                          <View style={styles.itemRow}>
                            <View style={styles.itemLeft}>
                              <Text style={styles.itemName}>{item.food.name}</Text>
                              <Text style={styles.itemQty}>{formatFoodQuantity(item.food, item.quantityG)}</Text>
                            </View>
                            <View style={styles.itemRight}>
                              <Text style={styles.itemCals}>{Math.round(item.calories)} kcal</Text>
                              <Text style={styles.itemMacros}>
                                P{Math.round(item.proteinG)}  C{Math.round(item.carbsG)}  F{Math.round(item.fatG)}
                              </Text>
                            </View>
                          </View>
                        </SwipeableItemRow>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          /* Empty state */
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🥗</Text>
            <Text style={styles.emptyTitle}>Nothing logged yet</Text>
            <Text style={styles.emptyHint}>Type what you ate above and tap "Add" to start tracking your macros.</Text>
          </View>
        )}

        {/* Meal suggestions */}
        {suggestions.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What to Eat Next</Text>
            {suggestions.map((suggestion, index) => (
              <View key={index} style={styles.suggestionRow}>
                <Text style={styles.suggestionBullet}>•</Text>
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <EditItemSheet
        item={editingItem}
        isSaving={isSavingEdit}
        onSave={handleEditSave}
        onClose={() => setEditingItem(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.danger },

  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: 4, marginBottom: 12, fontSize: 16, color: colors.textMuted },

  goalBadge: {
    backgroundColor: colors.accentMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  goalBadgeLabel: { fontSize: 12, color: colors.accentText },
  goalBadgeValue: { marginTop: 4, fontSize: 18, fontWeight: '700', color: colors.text },

  row: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  metricBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  metricLabel: { fontSize: 12, color: colors.textMuted },
  metricValue: { marginTop: 4, fontSize: 20, fontWeight: '700', color: colors.text },
  metricHint: { marginTop: 4, fontSize: 12, color: colors.textMuted },

  quickAddCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 16,
  },
  quickAddInput: {
    backgroundColor: colors.input,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 15,
    padding: 12,
    marginTop: 12,
    minHeight: 80,
  },
  unmatchedBox: {
    marginTop: 10,
    backgroundColor: '#1c1208',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7c4a00',
    padding: 12,
  },
  unmatchedTitle: { fontSize: 13, fontWeight: '600', color: '#f59e0b', marginBottom: 4 },
  unmatchedItem: { fontSize: 13, color: '#fcd34d', marginBottom: 2 },
  unmatchedHint: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  pillRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  pillActive: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  pillText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  pillTextActive: { color: colors.accent },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
  },
  addButtonPressed: { opacity: 0.75 },
  addButtonText: { color: colors.background, fontWeight: '700', fontSize: 15 },

  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 10 },

  mealCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  mealCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealCardHeaderPressed: { opacity: 0.7 },
  mealCardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  mealCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealCardCals: { fontSize: 15, fontWeight: '700', color: colors.accent },
  mealCardChevron: { fontSize: 10, color: colors.textMuted },
  mealMacroRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  mealMacroPill: {
    fontSize: 12,
    color: colors.textMuted,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  itemList: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    gap: 8,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemLeft: { flex: 1 },
  itemName: { fontSize: 14, color: colors.text, fontWeight: '500' },
  itemQty: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  itemRight: { alignItems: 'flex-end', marginLeft: 8 },
  itemCals: { fontSize: 14, fontWeight: '600', color: colors.text },
  itemMacros: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  deleteBtn: {
    marginLeft: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnPressed: { backgroundColor: '#3b0f0f', borderColor: colors.danger },
  deleteBtnText: { fontSize: 11, color: colors.danger, fontWeight: '700' },
  editBtn: {
    marginLeft: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnPressed: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  editBtnText: { fontSize: 13, color: colors.textMuted },
  suggestionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 12,
  },
  suggestionBullet: { color: colors.accent, fontSize: 16, lineHeight: 20 },
  suggestionText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptyHint: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  savedMealBtn: {
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  savedMealBtnPressed: { backgroundColor: colors.pressed },
  savedMealBtnText: { color: colors.textMuted, fontWeight: '600', fontSize: 14 },

  saveTemplateBtn: {
    marginTop: 10,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  saveTemplateBtnPressed: { backgroundColor: colors.pressed },
  saveTemplateBtnText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
});
