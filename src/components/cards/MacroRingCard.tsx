import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, type CircleProps } from 'react-native-svg';

import { colors } from '../../theme/colors';
import type { MacroProgressMetric } from '../../types/log';

// Wrap SVG Circle so Reanimated can animate its props
const AnimatedCircle = Animated.createAnimatedComponent(
  Circle as React.ComponentType<CircleProps>,
);

const RADIUS = 70;
const STROKE_WIDTH = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE_WIDTH) * 2;

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

interface Props {
  metric: MacroProgressMetric;
  unit?: string;
}

export function MacroRingCard({ metric, unit = 'kcal' }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const pct = clamp(metric.percentage / 100, 0, 1);
    progress.value = withTiming(pct, { duration: 900 });
  }, [metric.percentage]);

  const animatedProps = useAnimatedProps<CircleProps>(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  // Ring colour: green ≥ 90%, amber 55-90%, red < 55%
  const pct = metric.percentage;
  const ringColor = pct >= 90 ? colors.accent : pct >= 55 ? '#F59E0B' : '#F87171';

  return (
    <View style={styles.card}>
      <View style={styles.ringWrapper}>
        <Svg width={SIZE} height={SIZE}>
          {/* Track */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.border}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Animated progress arc */}
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={ringColor}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            animatedProps={animatedProps}
            strokeLinecap="round"
            rotation="-90"
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>

        {/* Centre text */}
        <View style={styles.ringCenter}>
          <Text style={[styles.ringPct, { color: ringColor }]}>{Math.round(pct)}%</Text>
          <Text style={styles.ringLabel}>Calories</Text>
        </View>
      </View>

      {/* Numbers below */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaValue}>{metric.consumed}</Text>
          <Text style={styles.metaKey}>eaten</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Text style={styles.metaValue}>{metric.goal}</Text>
          <Text style={styles.metaKey}>goal</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Text style={[styles.metaValue, { color: metric.remaining <= 0 ? colors.danger : colors.accent }]}>
            {metric.remaining <= 0 ? Math.abs(metric.remaining) : metric.remaining}
          </Text>
          <Text style={styles.metaKey}>{metric.remaining <= 0 ? 'over' : 'left'}</Text>
        </View>
      </View>

      <Text style={styles.unitLabel}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringPct: {
    fontSize: 28,
    fontWeight: '800',
  },
  ringLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 16,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  metaKey: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  metaDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  unitLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },
});
