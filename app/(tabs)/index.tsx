import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MEAL_LABELS, MEAL_TYPES } from '../../src/constants/meals';
import { useDashboardData } from '../../src/hooks/useDashboardData';
import { getTodayDateString } from '../../src/utils/dateUtils';

export default function DashboardScreen() {
  const { data, isLoading, errorMessage, refresh } = useDashboardData(getTodayDateString());

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0E9F6E" />
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Macly</Text>
        <Text style={styles.subtitle}>Today&apos;s Progress</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Calories</Text>
          <Text style={styles.cardValue}>
            {data.progress.calories.consumed} / {data.progress.calories.goal} kcal
          </Text>
          <Text style={styles.cardSubValue}>
            {data.progress.calories.percentage.toFixed(0)}% complete • {data.progress.calories.remaining} kcal left
          </Text>
        </View>

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meals Today</Text>
          {MEAL_TYPES.map((mealType) => {
            const meal = data.meals[mealType];
            return (
              <View key={mealType} style={styles.mealCard}>
                <Text style={styles.mealTitle}>{MEAL_LABELS[mealType]}</Text>
                <Text style={styles.mealSummary}>
                  {meal.totals.calories} kcal • P {meal.totals.proteinG} • C {meal.totals.carbsG} • F {meal.totals.fatG}
                </Text>
                {meal.items.length === 0 ? (
                  <Text style={styles.emptyMealText}>No entries yet.</Text>
                ) : (
                  meal.items.map((item) => (
                    <Text key={item.id} style={styles.mealItemText}>
                      {item.food.name} ({item.quantityG}g)
                    </Text>
                  ))
                )}
              </View>
            );
          })}
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
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#B91C1C',
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubValue: {
    marginTop: 6,
    fontSize: 13,
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  metricValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  metricHint: {
    marginTop: 4,
    fontSize: 12,
    color: '#374151',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 10,
  },
  mealTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  mealSummary: {
    marginTop: 6,
    fontSize: 13,
    color: '#374151',
  },
  emptyMealText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },
  mealItemText: {
    marginTop: 6,
    fontSize: 13,
    color: '#111827',
  },
});
