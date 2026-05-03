import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  calculateMacroGoals,
  getGoalDescription,
  getGoalTypeLabel,
  type GoalType,
} from '../../src/utils/goalCalculator';
import { getUserProfile } from '../../src/repositories/userProfileRepository';
import type { ActivityLevel } from '../../src/types';

const GOAL_OPTIONS: GoalType[] = ['fat-loss', 'maintenance', 'lean-bulk', 'muscle-gain'];
const ACTIVITY_LEVELS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];

function getActivityLabel(level: ActivityLevel): string {
  const labels: Record<ActivityLevel, string> = {
    sedentary: 'Sedentary',
    light: 'Light',
    moderate: 'Moderate',
    active: 'Active',
    very_active: 'Very Active',
  };
  return labels[level];
}

function getActivityDescription(level: ActivityLevel): string {
  const descriptions: Record<ActivityLevel, string> = {
    sedentary: 'Little or no exercise',
    light: '1-3 days/week light exercise',
    moderate: '3-5 days/week moderate exercise',
    active: '6-7 days/week intensive exercise',
    very_active: '2x per day training',
  };
  return descriptions[level];
}

export default function GoalTypeScreen() {
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState<GoalType>('maintenance');
  const [selectedActivity, setSelectedActivity] = useState<ActivityLevel>('moderate');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onContinue() {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const profile = await getUserProfile();
      if (!profile || !profile.age || !profile.weightKg || !profile.heightCm || !profile.gender) {
        throw new Error('Missing profile information');
      }

      // Calculate suggestions
      const suggestions = calculateMacroGoals(
        {
          gender: profile.gender,
          ageYears: profile.age,
          weightKg: profile.weightKg,
          heightCm: profile.heightCm,
          activityLevel: selectedActivity,
        },
        selectedGoal,
      );

      // Update activity level in profile
      await (
        await import('../../src/repositories/userProfileRepository')
      ).upsertUserProfile({
        name: profile.name,
        age: profile.age,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        gender: profile.gender,
        activityLevel: selectedActivity,
      });

      // Navigate with suggestions
      router.push({
        pathname: '/(onboarding)/goals',
        params: {
          suggestedCalories: String(suggestions.calories),
          suggestedProtein: String(suggestions.proteinG),
          suggestedCarbs: String(suggestions.carbsG),
          suggestedFat: String(suggestions.fatG),
          tdee: String(suggestions.tdee),
        },
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to continue');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Goal Type Selection */}
        <Text style={styles.sectionTitle}>What&apos;s your goal?</Text>

        <View style={styles.goalGrid}>
          {GOAL_OPTIONS.map((goal) => (
            <Pressable
              key={goal}
              style={[styles.goalCard, selectedGoal === goal && styles.goalCardActive]}
              onPress={() => setSelectedGoal(goal)}
            >
              <Text style={[styles.goalLabel, selectedGoal === goal && styles.goalLabelActive]}>
                {getGoalTypeLabel(goal)}
              </Text>
              <Text
                style={[
                  styles.goalDescription,
                  selectedGoal === goal && styles.goalDescriptionActive,
                ]}
              >
                {getGoalDescription(goal)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Activity Level Selection */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Your activity level?</Text>

        <View style={styles.activityList}>
          {ACTIVITY_LEVELS.map((level) => (
            <Pressable
              key={level}
              style={[styles.activityItem, selectedActivity === level && styles.activityItemActive]}
              onPress={() => setSelectedActivity(level)}
            >
              <View style={styles.activityRadio}>
                {selectedActivity === level ? <View style={styles.activityRadioFill} /> : null}
              </View>
              <View style={styles.activityTextContainer}>
                <Text style={[styles.activityLabel, selectedActivity === level && styles.activityLabelActive]}>
                  {getActivityLabel(level)}
                </Text>
                <Text style={styles.activityDescription}>{getActivityDescription(level)}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable style={styles.button} onPress={onContinue} disabled={isSaving}>
          <Text style={styles.buttonText}>{isSaving ? 'Calculating...' : 'Next'}</Text>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalCard: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  goalCardActive: {
    backgroundColor: '#0E9F6E',
    borderColor: '#0E9F6E',
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  goalLabelActive: {
    color: '#FFFFFF',
  },
  goalDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  goalDescriptionActive: {
    color: '#ECFDF5',
  },
  activityList: {
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  activityItemActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#0E9F6E',
  },
  activityRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityRadioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0E9F6E',
  },
  activityTextContainer: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  activityLabelActive: {
    color: '#0E9F6E',
  },
  activityDescription: {
    fontSize: 13,
    color: '#6B7280',
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
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
