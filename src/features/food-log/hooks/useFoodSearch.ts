import { useCallback, useEffect, useRef, useState } from 'react';

import { listFoods } from '../../../repositories/foodRepository';
import type { Food } from '../../../types/food';

type FoodSearchState = {
  query: string;
  foods: Food[];
  isLoading: boolean;
  errorMessage: string | null;
  setQuery: (query: string) => void;
};

export function useFoodSearch(): FoodSearchState {
  const [query, setQuery] = useState<string>('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length < 2) {
      setFoods([]);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const results = await listFoods(trimmedQuery);
      setFoods(results);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to search foods');
      setFoods([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout for debounced search (300ms)
      debounceTimeoutRef.current = setTimeout(() => {
        performSearch(newQuery);
      }, 300);
    },
    [performSearch],
  );

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    query,
    foods,
    isLoading,
    errorMessage,
    setQuery: handleQueryChange,
  };
}
