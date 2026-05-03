import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DEFAULT_DAILY_GOALS } from '../../src/constants/macros';
import { getMacroGoals, upsertMacroGoals } from '../../src/repositories/macroGoalsRepository';
import { getUserProfile, upsertUserProfile } from '../../src/repositories/userProfileRepository';

type GoalForm = {
  calories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
};

function isPositiveNumber(value: string): boolean {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

export default function SettingsScreen() {
  const [name, setName] = useState<string>('');
  const [goals, setGoals] = useState<GoalForm>({
    calories: String(DEFAULT_DAILY_GOALS.calories),
    proteinG: String(DEFAULT_DAILY_GOALS.proteinG),
    carbsG: String(DEFAULT_DAILY_GOALS.carbsG),
    fatG: String(DEFAULT_DAILY_GOALS.fatG),
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saved, setSaved] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [user, macroGoals] = await Promise.all([getUserProfile(), getMacroGoals()]);

      if (user) {
        setName(user.name);
      }

      if (macroGoals) {
        setGoals({
          calories: String(macroGoals.calories),
          proteinG: String(macroGoals.proteinG),
          carbsG: String(macroGoals.carbsG),
          fatG: String(macroGoals.fatG),
        });
      }

      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isFormValid = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      isPositiveNumber(goals.calories) &&
      isPositiveNumber(goals.proteinG) &&
      isPositiveNumber(goals.carbsG) &&
      isPositiveNumber(goals.fatG)
    );
  }, [goals, name]);

  function updateGoal<K extends keyof GoalForm>(key: K, value: string): void {
    setGoals((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setErrorMessage(null);
  }

  async function onSave(): Promise<void> {
    if (!isFormValid) {
      return;
    }

    try {
      await Promise.all([
        upsertUserProfile({ name: name.trim() }),
        upsertMacroGoals({
          calories: Number(goals.calories),
          proteinG: Number(goals.proteinG),
          carbsG: Number(goals.carbsG),
          fatG: Number(goals.fatG),
        }),
      ]);

      setSaved(true);
      setErrorMessage(null);
    } catch (error) {
      setSaved(false);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save settings');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Profile and daily macro goals</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>

        {isLoading ? <Text style={styles.helpText}>Loading current settings...</Text> : null}

        <View style={styles.section}>
          <Text style={styles.label}>Daily Calories</Text>
          <TextInput
            value={goals.calories}
            onChangeText={(value) => updateGoal('calories', value)}
            keyboardType="numeric"
            style={styles.input}
            returnKeyType="done"
          />

          <Text style={styles.label}>Protein (g)</Text>
          <TextInput
            value={goals.proteinG}
            onChangeText={(value) => updateGoal('proteinG', value)}
            keyboardType="numeric"
            style={styles.input}
            returnKeyType="done"
          />

          <Text style={styles.label}>Carbs (g)</Text>
          <TextInput
            value={goals.carbsG}
            onChangeText={(value) => updateGoal('carbsG', value)}
            keyboardType="numeric"
            style={styles.input}
            returnKeyType="done"
          />

          <Text style={styles.label}>Fat (g)</Text>
          <TextInput
            value={goals.fatG}
            onChangeText={(value) => updateGoal('fatG', value)}
            keyboardType="numeric"
            style={styles.input}
            returnKeyType="done"
          />
        </View>

        <Pressable
          style={[styles.saveButton, !isFormValid && styles.saveButtonDisabled]}
          onPress={() => {
            void onSave();
          }}
          disabled={!isFormValid}
        >
          <Text style={styles.saveButtonText}>Save Goals</Text>
        </Pressable>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {saved ? <Text style={styles.savedText}>Saved locally.</Text> : null}
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
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#0E9F6E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  helpText: {
    marginBottom: 10,
    fontSize: 13,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: '#B91C1C',
    textAlign: 'center',
  },
  savedText: {
    marginTop: 10,
    fontSize: 14,
    color: '#065F46',
    textAlign: 'center',
  },
});
