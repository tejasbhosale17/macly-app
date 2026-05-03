import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import { upsertUserProfile } from '../../src/repositories/userProfileRepository';

export default function WelcomeScreen() {
  const router = useRouter();
  const [name, setName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canContinue = name.trim().length >= 2 && !isSaving;

  async function onContinue() {
    if (!canContinue) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      await upsertUserProfile({ name: name.trim() });
      router.push('/(onboarding)/anthropometrics');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to Macly</Text>
        <Text style={styles.subtitle}>Let&apos;s set up your profile in under a minute.</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          placeholder="Enter your name"
          returnKeyType="done"
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable
          style={[styles.button, !canContinue && styles.buttonDisabled]}
          onPress={onContinue}
          disabled={!canContinue}
        >
          <Text style={styles.buttonText}>{isSaving ? 'Saving...' : 'Continue'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 22,
    color: '#4B5563',
    fontSize: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  errorText: {
    marginTop: 10,
    color: '#B91C1C',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#0E9F6E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
