import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { Ionicons } from '@expo/vector-icons';

import { MEAL_LABELS } from '../../src/constants/meals';
import { getOrCreateDailyLog } from '../../src/repositories/dailyLogRepository';
import { getOrCreateMeal } from '../../src/repositories/mealRepository';
import { useSavedMeals } from '../../src/features/saved-meals/hooks/useSavedMeals';
import type { MealType } from '../../src/types';

function parseMealType(value: string | string[] | undefined): MealType {
  const raw = typeof value === 'string' ? value : 'breakfast';

  if (raw === 'breakfast' || raw === 'lunch' || raw === 'dinner' || raw === 'snacks') {
    return raw;
  }

  return 'breakfast';
}

function parseDate(value: string | string[] | undefined): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  return new Date().toISOString().split('T')[0] ?? '';
}

function parseMealId(value: string | string[] | undefined): number | null {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export default function SavedMealsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const date = parseDate(params.date);
  const mealType = parseMealType(params.mealType);
  const currentMealId = parseMealId(params.mealId);

  const { savedMeals, isLoading, errorMessage, saveCurrentMeal, applySavedMeal, removeSavedMeal } = useSavedMeals();

  const [newSavedMealName, setNewSavedMealName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeSavedMealId, setActiveSavedMealId] = useState<number | null>(null);

  const targetMealLabel = useMemo(() => MEAL_LABELS[mealType], [mealType]);

  const handleSaveCurrentMeal = async () => {
    const trimmedName = newSavedMealName.trim();

    if (!currentMealId) {
      Alert.alert('Unavailable', 'This screen needs mealId to save current meal items.');
      return;
    }

    if (trimmedName.length < 2) {
      Alert.alert('Invalid name', 'Please enter at least 2 characters.');
      return;
    }

    try {
      setIsSaving(true);
      await saveCurrentMeal(trimmedName, currentMealId);
      setNewSavedMealName('');
      Alert.alert('Saved', 'Meal template created successfully.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save meal template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplySavedMeal = async (savedMealId: number) => {
    try {
      setActiveSavedMealId(savedMealId);

      const dailyLog = await getOrCreateDailyLog(date);
      const meal = await getOrCreateMeal(dailyLog.id, mealType);
      await applySavedMeal(savedMealId, meal.id);

      Alert.alert('Added', `Saved meal added to ${targetMealLabel}.`, [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to apply saved meal');
    } finally {
      setActiveSavedMealId(null);
    }
  };

  const handleDeleteSavedMeal = (savedMealId: number) => {
    Alert.alert('Delete saved meal?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setActiveSavedMealId(savedMealId);
            await removeSavedMeal(savedMealId);
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete saved meal');
          } finally {
            setActiveSavedMealId(null);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#0E9F6E" />
          </Pressable>
          <Text style={styles.title}>Saved Meals</Text>
          <View style={styles.rightSpacer} />
        </View>

        <View style={styles.contextCard}>
          <Text style={styles.contextLabel}>Quick add target</Text>
          <Text style={styles.contextValue}>
            {date} • {targetMealLabel}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Save Current Meal</Text>
          <TextInput
            value={newSavedMealName}
            onChangeText={setNewSavedMealName}
            placeholder="Ex: High Protein Breakfast"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            editable={!isSaving}
          />

          <Pressable
            style={[styles.primaryButton, (isSaving || !currentMealId) && styles.disabledButton]}
            disabled={isSaving || !currentMealId}
            onPress={handleSaveCurrentMeal}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Save Items As Meal Template</Text>
            )}
          </Pressable>

          {!currentMealId ? (
            <Text style={styles.hintText}>Open this page from a meal screen to save current meal items.</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Templates</Text>

          {isLoading ? (
            <View style={styles.centerRow}>
              <ActivityIndicator size="small" color="#0E9F6E" />
            </View>
          ) : errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : savedMeals.length === 0 ? (
            <Text style={styles.emptyText}>No saved meals yet.</Text>
          ) : (
            savedMeals.map((savedMeal) => {
              const isBusy = activeSavedMealId === savedMeal.id;

              return (
                <View key={savedMeal.id} style={styles.savedMealCard}>
                  <View style={styles.savedMealHeader}>
                    <Text style={styles.savedMealName}>{savedMeal.name}</Text>
                    <Pressable onPress={() => handleDeleteSavedMeal(savedMeal.id)} disabled={isBusy}>
                      <Ionicons name="trash" size={18} color="#B91C1C" />
                    </Pressable>
                  </View>

                  <Text style={styles.savedMealMeta}>
                    {savedMeal.items.length} items • {savedMeal.totals.calories} kcal • P {savedMeal.totals.proteinG} • C {savedMeal.totals.carbsG} • F {savedMeal.totals.fatG}
                  </Text>

                  <Text style={styles.previewText}>
                    {savedMeal.items.slice(0, 3).map((item) => item.foodName).join(', ')}
                    {savedMeal.items.length > 3 ? '...' : ''}
                  </Text>

                  <Pressable
                    style={[styles.secondaryButton, isBusy && styles.disabledButton]}
                    onPress={() => handleApplySavedMeal(savedMeal.id)}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.secondaryButtonText}>Add To {targetMealLabel}</Text>
                    )}
                  </Pressable>
                </View>
              );
            })
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
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  rightSpacer: {
    width: 24,
  },
  contextCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
    marginBottom: 16,
  },
  contextLabel: {
    fontSize: 12,
    color: '#065F46',
  },
  contextValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#064E3B',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  primaryButton: {
    marginTop: 10,
    backgroundColor: '#0E9F6E',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  hintText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  centerRow: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 13,
  },
  savedMealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 10,
  },
  savedMealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedMealName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  savedMealMeta: {
    marginTop: 6,
    fontSize: 12,
    color: '#374151',
  },
  previewText: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
  },
});
