import { StyleSheet, Text, View } from 'react-native';

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
});
