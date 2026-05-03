import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { DEFAULT_DAILY_GOALS } from '../../src/constants/macros';
import { upsertMacroGoals } from '../../src/repositories/macroGoalsRepository';

type GoalForm = {
  calories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
};

function isPositiveNumber(value: string): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

export default function GoalsOnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [form, setForm] = useState<GoalForm>({
    calories: String(DEFAULT_DAILY_GOALS.calories),
    proteinG: String(DEFAULT_DAILY_GOALS.proteinG),
    carbsG: String(DEFAULT_DAILY_GOALS.carbsG),
    fatG: String(DEFAULT_DAILY_GOALS.fatG),
  });
  const [tdee, setTdee] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize with suggested values from route params
  useEffect(() => {
    if (params.suggestedCalories) {
      setForm({
        calories: params.suggestedCalories as string,
        proteinG: params.suggestedProtein as string,
        carbsG: params.suggestedCarbs as string,
        fatG: params.suggestedFat as string,
      });
      if (params.tdee) {
        setTdee(Number(params.tdee));
      }
    }
  }, [params]);

  const canSave =
    isPositiveNumber(form.calories) &&
    isPositiveNumber(form.proteinG) &&
    isPositiveNumber(form.carbsG) &&
    isPositiveNumber(form.fatG) &&
    !isSaving;

  async function onFinish() {
    if (!canSave) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      await upsertMacroGoals({
        calories: Number(form.calories),
        proteinG: Number(form.proteinG),
        carbsG: Number(form.carbsG),
        fatG: Number(form.fatG),
      });
      router.replace('/(tabs)');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save goals');
    } finally {
      setIsSaving(false);
    }
  }

  function update<K extends keyof GoalForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Your daily targets</Text>
        <Text style={styles.subtitle}>Calculated for your goals. Adjust if you like.</Text>

        {tdee ? (
          <View style={styles.tdeeCard}>
            <Text style={styles.tdeeLabel}>Your Daily Calorie Need (TDEE)</Text>
            <Text style={styles.tdeeValue}>{tdee} calories</Text>
            <Text style={styles.tdeeNote}>
              Goals below are adjusted based on your selected goal type.
            </Text>
          </View>
        ) : null}

        <Text style={styles.label}>Calories</Text>
        <TextInput
          style={styles.input}
          value={form.calories}
          onChangeText={(v) => update('calories', v)}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Protein (g)</Text>
        <TextInput
          style={styles.input}
          value={form.proteinG}
          onChangeText={(v) => update('proteinG', v)}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Carbs (g)</Text>
        <TextInput
          style={styles.input}
          value={form.carbsG}
          onChangeText={(v) => update('carbsG', v)}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Fat (g)</Text>
        <TextInput
          style={styles.input}
          value={form.fatG}
          onChangeText={(v) => update('fatG', v)}
          keyboardType="numeric"
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable
          style={[styles.button, !canSave && styles.buttonDisabled]}
          onPress={onFinish}
          disabled={!canSave}
        >
          <Text style={styles.buttonText}>{isSaving ? 'Saving...' : 'Finish Setup'}</Text>
        </Pressable>
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
    paddingTop: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 18,
    fontSize: 15,
    color: '#4B5563',
  },
  tdeeCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#0E9F6E',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  tdeeLabel: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
    marginBottom: 6,
  },
  tdeeValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0E9F6E',
    marginBottom: 8,
  },
  tdeeNote: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    marginTop: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  errorText: {
    marginTop: 10,
    marginBottom: 16,
    color: '#B91C1C',
  },
  button: {
    marginTop: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0E9F6E',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
