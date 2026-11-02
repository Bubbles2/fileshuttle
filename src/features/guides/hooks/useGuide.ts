import { useCallback, useEffect, useRef, useState } from 'react';
import type { GuideName, GuideResponse, GuideVariant } from '../../../../shared/api.ts';
import { messageOf } from '../../../services/apiClient';
import { fetchGuide } from '../services/guidesApi';

export type GuideState = { status: 'loading' } | { status: 'ready'; guide: GuideResponse } | { status: 'error'; message: string };

/** Loads a guide (full or summary) each time it is shown, so edits to the file appear; Reload fetches it again. */
export function useGuide(name: GuideName, variant: GuideVariant) {
  const [state, setState] = useState<GuideState>({ status: 'loading' });
  const latest = useRef(0);

  const load = useCallback(
    async (run: number) => {
      try {
        const guide = await fetchGuide(name, variant);
        if (run === latest.current) setState({ status: 'ready', guide });
      } catch (error) {
        if (run === latest.current) setState({ status: 'error', message: messageOf(error, 'Could not load this guide.') });
      }
    },
    [name, variant],
  );

  useEffect(() => {
    latest.current += 1;
    void load(latest.current);
  }, [load]);

  const reload = useCallback(() => {
    latest.current += 1;
    setState({ status: 'loading' });
    void load(latest.current);
  }, [load]);

  return { state, reload };
}
