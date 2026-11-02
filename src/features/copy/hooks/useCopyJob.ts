import { useCallback, useRef, useState } from 'react';
import type { ConflictPolicy } from '../../../../shared/api.ts';
import { requestCopy } from '../services/copyApi';
import type { CopyItemProgress, CopyJobItem, CopyPhase } from '../types';

const STOPPED_MID_COPY: CopyItemProgress = { status: 'stopped', message: 'Stopped while copying — this item may be partly copied' };
const NOT_STARTED: CopyItemProgress = { status: 'stopped', message: 'Not copied' };

/** Copies items one at a time so each row can show its own progress. The user can stop between or during items. */
export function useCopyJob() {
  const [phase, setPhase] = useState<CopyPhase>('idle');
  const [progress, setProgress] = useState<Record<string, CopyItemProgress>>({});
  const controller = useRef<AbortController | null>(null);

  const update = useCallback((id: string, next: CopyItemProgress) => {
    setProgress((current) => ({ ...current, [id]: next }));
  }, []);

  const start = useCallback(
    async (items: readonly CopyJobItem[], policy: ConflictPolicy) => {
      if (controller.current || items.length === 0) return;
      const abort = new AbortController();
      controller.current = abort;
      setPhase('copying');
      setProgress(Object.fromEntries(items.map((item) => [item.id, { status: 'waiting' }])));

      try {
        for (const [index, item] of items.entries()) {
          if (abort.signal.aborted) {
            const rest = items.slice(index).map((skipped): [string, CopyItemProgress] => [skipped.id, NOT_STARTED]);
            setProgress((current) => ({ ...current, ...Object.fromEntries(rest) }));
            break;
          }
          update(item.id, { status: 'copying' });
          try {
            const { location: source, destination, targetName } = item;
            const result = await requestCopy({ source, destination, policy, ...(targetName ? { targetName } : {}) }, abort.signal);
            update(item.id, { status: result.outcome, target: result.target, message: result.message });
          } catch {
            update(item.id, STOPPED_MID_COPY);
          }
        }
      } finally {
        controller.current = null;
        setPhase('done');
      }
    },
    [update],
  );

  const stop = useCallback(() => {
    controller.current?.abort();
  }, []);

  const reset = useCallback(() => {
    if (controller.current) return;
    setPhase('idle');
    setProgress({});
  }, []);

  return { phase, progress, start, stop, reset };
}
