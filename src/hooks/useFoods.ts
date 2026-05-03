import { useCallback, useEffect, useState } from 'react';

import { listFoods } from '../repositories/foodRepository';
import type { Food } from '../types';

export function useFoods(query: string) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const rows = await listFoods(query);
    setFoods(rows);
    setIsLoading(false);
  }, [query]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { foods, isLoading, refresh };
}
