import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../theme/colors';
import type { HistoryDay } from '../../../types';

type Props = {
  days: HistoryDay[]; // sorted DESC (newest first), up to 30 days
  calorieGoal: number;
};

const CHART_HEIGHT = 110;

function getDayLabel(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  const d = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
  return (['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const)[d.getDay()] ?? 'Su';
}

function getBarColor(calories: number, goal: number): string {
  if (goal <= 0) return colors.accent;
  const pct = calories / goal;
  if (pct >= 0.9) return colors.accent;   // on track — green
  if (pct >= 0.55) return '#F59E0B';       // partial — amber
  return '#F87171';                         // low — red
}

export function WeeklyCaloriesChart({ days, calorieGoal }: Props) {
  // Take last 7 days and show oldest → newest (chronological)
  const last7 = [...days].slice(0, 7).reverse();

  if (last7.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Log some food to see your chart</Text>
      </View>
    );
  }

  const maxCals = Math.max(...last7.map((d) => d.totals.calories), calorieGoal || 1, 500);
  const goalLineBottom = calorieGoal > 0 ? (calorieGoal / maxCals) * CHART_HEIGHT : null;

  return (
    <View>
      {/* Chart area */}
      <View style={styles.chartWrapper}>
        {/* Goal line (absolute, behind bars) */}
        {goalLineBottom !== null && (
          <View style={[styles.goalLine, { bottom: goalLineBottom }]} />
        )}

        {/* Bars */}
        {last7.map((day) => {
          const barH = Math.max(4, (day.totals.calories / maxCals) * CHART_HEIGHT);
          const barColor = getBarColor(day.totals.calories, calorieGoal);

          return (
            <View key={day.date} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { height: barH, backgroundColor: barColor }]} />
              </View>
              <Text style={styles.barLabel}>{getDayLabel(day.date)}</Text>
            </View>
          );
        })}
      </View>

      {/* Caption row */}
      <View style={styles.captionRow}>
        {calorieGoal > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
            <Text style={styles.legendText}>goal {Math.round(calorieGoal)} kcal</Text>
          </View>
        )}
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={styles.legendText}>on track</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>partial</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },

  chartWrapper: {
    height: CHART_HEIGHT + 22, // bars + label
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    position: 'relative',
  },

  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
    borderStyle: 'dashed',
  },

  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: '100%',
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },

  captionRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
