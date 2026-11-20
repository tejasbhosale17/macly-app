import { useEffect } from 'react';
import { Alert } from 'react-native';
import * as Updates from 'expo-updates';

/**
 * Checks for an OTA update when the app mounts.
 * Shows an alert and reloads if a new version is available.
 * No-ops in development (Updates.isEmbeddedLaunch is true in dev).
 */
export function useAppUpdates() {
  useEffect(() => {
    if (__DEV__) return;

    async function checkForUpdate() {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          await Updates.fetchUpdateAsync();
          Alert.alert(
            'Update ready',
            'A new version of Macly was downloaded. Restart to apply it.',
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Restart now',
                onPress: () => Updates.reloadAsync(),
              },
            ],
          );
        }
      } catch {
        // Non-critical — silently ignore update errors
      }
    }

    void checkForUpdate();
  }, []);
}
