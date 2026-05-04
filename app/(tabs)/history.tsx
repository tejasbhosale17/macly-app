import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { WeeklyCaloriesChart } from '../../src/features/history/components/WeeklyCaloriesChart';
import { useHistorySummary } from '../../src/features/history/hooks/useHistorySummary';
import { colors } from '../../src/theme/colors';

export default function HistoryScreen() {
  const { historyDays, sevenDaySummary, calorieGoal, streak, isLoading, errorMessage, refresh } =
    useHistorySummary(30);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
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

  const hasAnyData = historyDays.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Last 30 days</Text>

        {/* Streak + goal hit badges */}
        {hasAnyData && (
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeNumber}>{streak}</Text>
              <Text style={styles.badgeLabel}>day streak 🔥</Text>
            </View>
            {calorieGoal > 0 && sevenDaySummary.daysLogged > 0 && (
              <View style={[styles.badge, styles.badgeSecondary]}>
                <Text style={styles.badgeNumber}>
                  {sevenDaySummary.goalHitDays}/{sevenDaySummary.daysLogged}
                </Text>
                <Text style={styles.badgeLabel}>goal hit this week</Text>
              </View>
            )}
          </View>
        )}

        {/* 7-day bar chart */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Last 7 Days — Calories</Text>
          <View style={styles.chartContainer}>
            <WeeklyCaloriesChart days={historyDays} calorieGoal={calorieGoal} />
          </View>
        </View>

        {/* 7-day text summary */}
        {sevenDaySummary.daysLogged > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>7-Day Summary</Text>
            <View style={styles.statGrid}>
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{Math.round(sevenDaySummary.avgCalories)}</Text>
                <Text style={styles.statLabel}>avg kcal/day</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{sevenDaySummary.daysLogged}</Text>
                <Text style={styles.statLabel}>days logged</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{Math.round(sevenDaySummary.avgProteinG)}g</Text>
                <Text style={styles.statLabel}>avg protein</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{Math.round(sevenDaySummary.avgCarbsG)}g</Text>
                <Text style={styles.statLabel}>avg carbs</Text>
              </View>
            </View>
          </View>
        )}

        {/* Daily log list */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Daily Log</Text>
          {historyDays.length === 0 ? (
            <Text style={styles.emptyText}>No history yet — start logging food!</Text>
          ) : (
            historyDays.map((day, i) => {
              const hitGoal = calorieGoal > 0 && day.totals.calories >= calorieGoal * 0.9;
              const isLast = i === historyDays.length - 1;

              return (
                <View key={day.date} style={[styles.dayRow, !isLast && styles.dayRowBorder]}>
                  <View style={styles.dayLeft}>
                    <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
                    <Text style={styles.dayMacros}>
                      P {Math.round(day.totals.proteinG)}g · C {Math.round(day.totals.carbsG)}g · F{' '}
                      {Math.round(day.totals.fatG)}g
                    </Text>
                  </View>
                  <View style={styles.dayRight}>
                    <Text style={[styles.dayCals, hitGoal && styles.dayCalsHit]}>
                      {Math.round(day.totals.calories)}
                    </Text>
                    <Text style={styles.dayKcal}>kcal</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  const d = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.danger },

  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: 4, marginBottom: 16, fontSize: 16, color: colors.textMuted },

  badgeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  badge: {
    flex: 1,
    backgroundColor: colors.accentMuted,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 14,
    alignItems: 'center',
  },
  badgeSecondary: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  badgeNumber: { fontSize: 26, fontWeight: '800', color: colors.text },
  badgeLabel: { marginTop: 2, fontSize: 12, color: colors.textMuted },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  chartContainer: { marginTop: 4 },

  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCell: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 12,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.text },
  statLabel: { marginTop: 2, fontSize: 12, color: colors.textMuted },

  emptyText: { color: colors.textMuted, fontSize: 14 },

  dayRow: { paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
  dayRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  dayLeft: { flex: 1 },
  dayDate: { fontSize: 14, fontWeight: '600', color: colors.text },
  dayMacros: { marginTop: 2, fontSize: 12, color: colors.textMuted },
  dayRight: { alignItems: 'flex-end' },
  dayCals: { fontSize: 18, fontWeight: '700', color: colors.text },
  dayCalsHit: { color: colors.accent },
  dayKcal: { fontSize: 11, color: colors.textMuted },
});


