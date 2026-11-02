import { useCallback, useState } from 'react';

/** Ordered list of item ids waiting to be copied. Rules about what may be added live in the caller. */
export function useBasket() {
  const [ids, setIds] = useState<string[]>([]);

  const add = useCallback((id: string) => {
    setIds((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

  const addMany = useCallback((more: readonly string[]) => {
    setIds((current) => {
      const present = new Set(current);
      return [...current, ...more.filter((id) => !present.has(id))];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setIds((current) => current.filter((existing) => existing !== id));
  }, []);

  const clear = useCallback(() => {
    setIds([]);
  }, []);

  return { ids, add, addMany, remove, clear };
}
