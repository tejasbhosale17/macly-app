import { useCallback, useEffect, useState } from 'react';

import { getHistory } from '../services/logService';
import type { HistoryDay } from '../types';

export function useHistory(limit = 14) {
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const rows = await getHistory(limit);
    setHistory(rows);
    setIsLoading(false);
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { history, isLoading, refresh };
}
