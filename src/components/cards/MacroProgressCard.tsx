import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import type { MacroProgressMetric } from '../../types/log';

interface MacroProgressCardProps {
  title: string;
  metric: MacroProgressMetric;
  unit?: string;
}

export function MacroProgressCard({ title, metric, unit = 'kcal' }: MacroProgressCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>
        {metric.consumed} / {metric.goal} {unit}
      </Text>
      <Text style={styles.cardSubValue}>
        {metric.percentage.toFixed(0)}% complete • {metric.remaining} {unit} left
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  cardValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  cardSubValue: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textMuted,
  },
});
