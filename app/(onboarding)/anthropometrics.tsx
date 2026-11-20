import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { upsertUserProfile } from '../../src/repositories/userProfileRepository';
import type { Gender } from '../../src/types';

type AnthropometricForm = {
  heightCm: string;
  weightKg: string;
  ageYears: string;
  gender: Gender;
};

const GENDER_OPTIONS: Gender[] = ['male', 'female', 'other'];

function isPositiveNumber(value: string): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

export default function AnthropometricsScreen() {
  const router = useRouter();
  const [form, setForm] = useState<AnthropometricForm>({
    heightCm: '',
    weightKg: '',
    ageYears: '',
    gender: 'male',
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canContinue =
    isPositiveNumber(form.heightCm) &&
    isPositiveNumber(form.weightKg) &&
    isPositiveNumber(form.ageYears) &&
    !isSaving;

  async function onContinue() {
    if (!canContinue) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      await upsertUserProfile({
        name: '', // Keep existing name
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        age: Number(form.ageYears),
        gender: form.gender,
      });
      router.push('/(onboarding)/goal-type');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  }

  function update<K extends keyof AnthropometricForm>(key: K, value: string | Gender) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Let&apos;s get your measurements</Text>
        <Text style={styles.subtitle}>Used to calculate your daily calorie needs.</Text>

        {/* Height */}
        <Text style={styles.label}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          value={form.heightCm}
          onChangeText={(v) => update('heightCm', v)}
          keyboardType="decimal-pad"
          placeholder="e.g., 175"
        />

        {/* Weight */}
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={form.weightKg}
          onChangeText={(v) => update('weightKg', v)}
          keyboardType="decimal-pad"
          placeholder="e.g., 75"
        />

        {/* Age */}
        <Text style={styles.label}>Age (years)</Text>
        <TextInput
          style={styles.input}
          value={form.ageYears}
          onChangeText={(v) => update('ageYears', v)}
          keyboardType="number-pad"
          placeholder="e.g., 28"
        />

        {/* Gender */}
        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderGroup}>
          {GENDER_OPTIONS.map((option) => (
            <Pressable
              key={option}
              style={[styles.genderButton, form.gender === option && styles.genderButtonActive]}
              onPress={() => update('gender', option)}
            >
              <Text
                style={[
                  styles.genderButtonText,
                  form.gender === option && styles.genderButtonTextActive,
                ]}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable
          style={[styles.button, !canContinue && styles.buttonDisabled]}
          onPress={onContinue}
          disabled={!canContinue}
        >
          <Text style={styles.buttonText}>{isSaving ? 'Saving...' : 'Continue'}</Text>
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
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 22,
    color: '#4B5563',
    fontSize: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    marginTop: 16,
    color: '#374151',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  genderGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#0E9F6E',
    borderColor: '#0E9F6E',
  },
  genderButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
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
