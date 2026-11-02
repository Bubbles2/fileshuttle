import { useCallback, useEffect, useRef } from 'react';

type FocusTarget = () => HTMLElement | null | undefined;

/**
 * Moves focus once the next render has committed. Use it when the control
 * the user just activated is removed or replaced, so keyboard focus isn't
 * dropped back to the top of the page.
 */
export function useFocusAfterRender() {
  const pending = useRef<FocusTarget | null>(null);

  useEffect(() => {
    const findTarget = pending.current;
    if (!findTarget) return;
    pending.current = null;
    findTarget()?.focus();
  });

  return useCallback((findTarget: FocusTarget) => {
    pending.current = findTarget;
  }, []);
}

/** Picks the control now at `index` in a list that just lost one, falling back to the one before it. */
export function controlNear(controls: readonly HTMLElement[], index: number): HTMLElement | undefined {
  return controls[index] ?? controls[index - 1];
}
