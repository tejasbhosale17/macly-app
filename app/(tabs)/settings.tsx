import { useCallback, useEffect, useState } from 'react';
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
import {
  EditGoalsForm,
  type GoalFormValues,
} from '../../src/features/goals/components/EditGoalsForm';
import { getMacroGoals, upsertMacroGoals } from '../../src/repositories/macroGoalsRepository';
import { getUserProfile, upsertUserProfile } from '../../src/repositories/userProfileRepository';
import { colors } from '../../src/theme/colors';
import type { ActivityLevel, Gender } from '../../src/types';

type ProfileFormValues = {
  name: string;
  ageYears: string;
  weightKg: string;
  heightCm: string;
};

function toPositiveNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isOptionalPositiveNumber(value: string): boolean {
  if (value.trim().length === 0) {
    return true;
  }

  return toPositiveNumber(value) !== null;
}

export default function SettingsScreen() {
  const [profile, setProfile] = useState<ProfileFormValues>({
    name: '',
    ageYears: '',
    weightKg: '',
    heightCm: '',
  });
  const [goals, setGoals] = useState<GoalFormValues>({
    calories: String(DEFAULT_DAILY_GOALS.calories),
    proteinG: String(DEFAULT_DAILY_GOALS.proteinG),
    carbsG: String(DEFAULT_DAILY_GOALS.carbsG),
    fatG: String(DEFAULT_DAILY_GOALS.fatG),
  });
  const [existingGender, setExistingGender] = useState<Gender | null>(null);
  const [existingActivityLevel, setExistingActivityLevel] = useState<ActivityLevel | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [isSavingGoals, setIsSavingGoals] = useState<boolean>(false);
  const [savedProfile, setSavedProfile] = useState<boolean>(false);
  const [savedGoals, setSavedGoals] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [user, macroGoals] = await Promise.all([getUserProfile(), getMacroGoals()]);

      if (user) {
        setProfile({
          name: user.name,
          ageYears: user.age !== null ? String(user.age) : '',
          weightKg: user.weightKg !== null ? String(user.weightKg) : '',
          heightCm: user.heightCm !== null ? String(user.heightCm) : '',
        });
        setExistingGender(user.gender);
        setExistingActivityLevel(user.activityLevel);
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

  function updateProfile<K extends keyof ProfileFormValues>(key: K, value: string): void {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setSavedProfile(false);
    setErrorMessage(null);
  }

  async function onSaveProfile(): Promise<void> {
    if (
      profile.name.trim().length < 2 ||
      !isOptionalPositiveNumber(profile.ageYears) ||
      !isOptionalPositiveNumber(profile.weightKg) ||
      !isOptionalPositiveNumber(profile.heightCm)
    ) {
      return;
    }

    try {
      setIsSavingProfile(true);
      await upsertUserProfile({
        name: profile.name.trim(),
        age: toPositiveNumber(profile.ageYears),
        weightKg: toPositiveNumber(profile.weightKg),
        heightCm: toPositiveNumber(profile.heightCm),
        gender: existingGender,
        activityLevel: existingActivityLevel,
      });
      setSavedProfile(true);
      setErrorMessage(null);
    } catch (error) {
      setSavedProfile(false);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function onSaveGoals(): Promise<void> {
    const calories = toPositiveNumber(goals.calories);
    const proteinG = toPositiveNumber(goals.proteinG);
    const carbsG = toPositiveNumber(goals.carbsG);
    const fatG = toPositiveNumber(goals.fatG);

    if (calories === null || proteinG === null || carbsG === null || fatG === null) {
      return;
    }

    try {
      setIsSavingGoals(true);
      await upsertMacroGoals({
        calories,
        proteinG,
        carbsG,
        fatG,
      });
      setSavedGoals(true);
      setErrorMessage(null);
    } catch (error) {
      setSavedGoals(false);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save goals');
    } finally {
      setIsSavingGoals(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Profile basics and macro goals (saved locally)</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Basics</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            value={profile.name}
            onChangeText={(value) => updateProfile('name', value)}
            placeholder="Enter your name"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCapitalize="words"
            editable={!isSavingProfile}
            returnKeyType="done"
          />

          <Text style={styles.label}>Age (years)</Text>
          <TextInput
            value={profile.ageYears}
            onChangeText={(value) => updateProfile('ageYears', value)}
            placeholder="Optional"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            keyboardType="numeric"
            editable={!isSavingProfile}
            returnKeyType="done"
          />

          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            value={profile.weightKg}
            onChangeText={(value) => updateProfile('weightKg', value)}
            placeholder="Optional"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            keyboardType="numeric"
            editable={!isSavingProfile}
            returnKeyType="done"
          />

          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            value={profile.heightCm}
            onChangeText={(value) => updateProfile('heightCm', value)}
            placeholder="Optional"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            keyboardType="numeric"
            editable={!isSavingProfile}
            returnKeyType="done"
          />

          <Pressable
            style={[styles.saveButton, isSavingProfile && styles.saveButtonDisabled]}
            onPress={() => {
              void onSaveProfile();
            }}
            disabled={isSavingProfile}
          >
            <Text style={styles.saveButtonText}>{isSavingProfile ? 'Saving...' : 'Save Profile'}</Text>
          </Pressable>

          {savedProfile ? <Text style={styles.savedText}>Profile saved locally.</Text> : null}
        </View>

        <EditGoalsForm values={goals} onChange={setGoals} disabled={isSavingGoals} />

        {isLoading ? <Text style={styles.helpText}>Loading current settings...</Text> : null}

        <Pressable
          style={[styles.saveButton, isSavingGoals && styles.saveButtonDisabled]}
          onPress={() => {
            void onSaveGoals();
          }}
          disabled={isSavingGoals}
        >
          <Text style={styles.saveButtonText}>{isSavingGoals ? 'Saving...' : 'Save Goals'}</Text>
        </Pressable>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {savedGoals ? <Text style={styles.savedText}>Goals saved locally.</Text> : null}
      </ScrollView>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 16,
    fontSize: 16,
    color: colors.textMuted,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: colors.input,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    color: '#052E16',
    fontSize: 16,
    fontWeight: '700',
  },
  helpText: {
    marginBottom: 10,
    fontSize: 13,
    color: colors.textMuted,
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.danger,
    textAlign: 'center',
  },
  savedText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.accentText,
    textAlign: 'center',
  },
});
