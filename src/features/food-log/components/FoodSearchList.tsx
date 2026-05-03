import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Food } from '../../../types/food';

interface FoodSearchListProps {
  foods: Food[];
  isLoading: boolean;
  onSelectFood: (food: Food) => void;
}

export function FoodSearchList({ foods, isLoading, onSelectFood }: FoodSearchListProps) {
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#0E9F6E" />
      </View>
    );
  }

  if (foods.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No foods found</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={foods}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <Pressable style={({ pressed }) => [styles.foodItem, pressed && styles.pressed]} onPress={() => onSelectFood(item)}>
          <View style={styles.foodInfo}>
            <Text style={styles.foodName}>{item.name}</Text>
            <Text style={styles.foodMacros}>
              {item.caloriesPer100g} kcal • P {item.proteinPer100g}g • C {item.carbsPer100g}g • F {item.fatPer100g}g
            </Text>
          </View>
        </Pressable>
      )}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  foodItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pressed: {
    backgroundColor: '#F3F4F6',
  },
  foodInfo: {
    gap: 4,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  foodMacros: {
    fontSize: 12,
    color: '#6B7280',
  },
});
