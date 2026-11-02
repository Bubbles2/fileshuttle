import { useCallback, useState } from 'react';
import type { CopyRequest, CopyResponse } from '../../../../shared/api.ts';
import { requestCopy } from '../../copy/services/copyApi';

export type GuideCopyState = { status: 'idle' } | { status: 'copying' } | { status: 'done'; result: CopyResponse };

/** Copies the guide being shown into the destination folder as spec.md, through the normal copy API. */
export function useGuideCopy() {
  const [state, setState] = useState<GuideCopyState>({ status: 'idle' });

  const copy = useCallback(async (request: CopyRequest) => {
    setState({ status: 'copying' });
    setState({ status: 'done', result: await requestCopy(request) });
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return { state, copy, reset };
}
