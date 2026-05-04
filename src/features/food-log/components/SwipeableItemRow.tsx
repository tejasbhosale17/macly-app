import { Animated, StyleSheet, Text, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';

import { colors } from '../../../theme/colors';

interface SwipeableItemRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  onEdit: () => void;
}

export function SwipeableItemRow({ children, onDelete, onEdit }: SwipeableItemRowProps) {
  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    _drag: Animated.AnimatedInterpolation<number>,
  ) => {
    return (
      <View style={styles.actionsContainer}>
        <RectButton style={styles.editAction} onPress={onEdit}>
          <Text style={styles.editActionText}>Edit</Text>
        </RectButton>
        <RectButton style={styles.deleteAction} onPress={onDelete}>
          <Text style={styles.deleteActionText}>Delete</Text>
        </RectButton>
      </View>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: 140,
  },
  editAction: {
    flex: 1,
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editActionText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  deleteAction: {
    flex: 1,
    backgroundColor: '#3b0f0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 13,
  },
});
