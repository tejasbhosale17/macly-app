import { Redirect } from 'expo-router';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useAppBootstrap } from '../src/hooks/useAppBootstrap';

export default function AppIndexScreen() {
  const { isLoading, isOnboardingComplete, errorMessage } = useAppBootstrap();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0E9F6E" />
          <Text style={styles.loadingText}>Preparing Macly...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Initialization failed</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isOnboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(onboarding)/welcome" />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#374151',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#B91C1C',
  },
  errorMessage: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 14,
    color: '#7F1D1D',
  },
});
