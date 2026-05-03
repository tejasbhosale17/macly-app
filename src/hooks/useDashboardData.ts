import { useCallback, useEffect, useState } from 'react';

import { getDashboardData } from '../services/logService';
import type { DashboardData } from '../types';

type DashboardState = {
  data: DashboardData | null;
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
};

export function useDashboardData(date: string): DashboardState {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const dashboard = await getDashboardData(date);
      setData(dashboard);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, errorMessage, refresh };
}
