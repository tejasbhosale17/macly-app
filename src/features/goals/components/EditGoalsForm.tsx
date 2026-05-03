import { StyleSheet, Text, TextInput, View } from 'react-native';

export type GoalFormValues = {
  calories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
};

type EditGoalsFormProps = {
  values: GoalFormValues;
  onChange: (nextValues: GoalFormValues) => void;
  disabled?: boolean;
};

export function EditGoalsForm({ values, onChange, disabled = false }: EditGoalsFormProps) {
  function updateField<K extends keyof GoalFormValues>(key: K, value: string): void {
    onChange({ ...values, [key]: value });
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Macro Goals</Text>

      <Text style={styles.label}>Calories</Text>
      <TextInput
        value={values.calories}
        onChangeText={(value) => updateField('calories', value)}
        keyboardType="numeric"
        style={styles.input}
        editable={!disabled}
        returnKeyType="done"
      />

      <Text style={styles.label}>Protein (g)</Text>
      <TextInput
        value={values.proteinG}
        onChangeText={(value) => updateField('proteinG', value)}
        keyboardType="numeric"
        style={styles.input}
        editable={!disabled}
        returnKeyType="done"
      />

      <Text style={styles.label}>Carbs (g)</Text>
      <TextInput
        value={values.carbsG}
        onChangeText={(value) => updateField('carbsG', value)}
        keyboardType="numeric"
        style={styles.input}
        editable={!disabled}
        returnKeyType="done"
      />

      <Text style={styles.label}>Fat (g)</Text>
      <TextInput
        value={values.fatG}
        onChangeText={(value) => updateField('fatG', value)}
        keyboardType="numeric"
        style={styles.input}
        editable={!disabled}
        returnKeyType="done"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
});
