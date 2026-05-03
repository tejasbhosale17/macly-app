import { useEffect, useState } from 'react';

import { initDatabase } from '../db/client';
import { ensureDefaultGoals, getMacroGoals } from '../repositories/macroGoalsRepository';
import { getUserProfile } from '../repositories/userProfileRepository';

type BootstrapState = {
  isLoading: boolean;
  isOnboardingComplete: boolean;
  errorMessage: string | null;
};

export function useAppBootstrap(): BootstrapState {
  const [state, setState] = useState<BootstrapState>({
    isLoading: true,
    isOnboardingComplete: false,
    errorMessage: null,
  });

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        await initDatabase();

        const user = await getUserProfile();
        if (user) {
          await ensureDefaultGoals();
        }

        const goals = await getMacroGoals();

        if (!mounted) {
          return;
        }

        setState({
          isLoading: false,
          isOnboardingComplete: Boolean(user && goals),
          errorMessage: null,
        });
      } catch (error) {
        if (!mounted) {
          return;
        }

        setState({
          isLoading: false,
          isOnboardingComplete: false,
          errorMessage: error instanceof Error ? error.message : 'Bootstrap failed',
        });
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
