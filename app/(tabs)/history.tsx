import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useHistorySummary } from '../../src/features/history/hooks/useHistorySummary';

export default function HistoryScreen() {
  const { historyDays, sevenDaySummary, isLoading, errorMessage, refresh } = useHistorySummary(30);

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

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Daily totals from local data</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>7-Day Summary</Text>
          {sevenDaySummary.daysLogged === 0 ? (
            <Text style={styles.emptyText}>No logged days yet.</Text>
          ) : (
            <>
              <Text style={styles.summaryLine}>Days logged: {sevenDaySummary.daysLogged}</Text>
              <Text style={styles.summaryLine}>Total calories: {sevenDaySummary.totalCalories} kcal</Text>
              <Text style={styles.summaryLine}>Avg calories/day: {sevenDaySummary.avgCalories} kcal</Text>
              <Text style={styles.summaryLine}>
                Avg macros/day: P {sevenDaySummary.avgProteinG} • C {sevenDaySummary.avgCarbsG} • F {sevenDaySummary.avgFatG}
              </Text>
            </>
          )}
        </View>

        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>Daily Totals</Text>
          {historyDays.length === 0 ? (
            <Text style={styles.emptyText}>No history available.</Text>
          ) : (
            historyDays.map((day) => (
              <View key={day.date} style={styles.row}>
                <Text style={styles.dateText}>{day.date}</Text>
                <Text style={styles.metaText}>
                  {day.totals.calories} kcal • P {day.totals.proteinG} • C {day.totals.carbsG} • F {day.totals.fatG}
                </Text>
              </View>
            ))
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
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 12,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  summaryLine: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 14,
    color: '#B91C1C',
  },
});
