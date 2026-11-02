import { copyResponseSchema, type CopyRequest, type CopyResponse } from '../../../../shared/api.ts';
import { messageOf, postJson } from '../../../services/apiClient';

/**
 * Copies one item through the local server. Failures come back as a "failed"
 * outcome; only an abort (the user pressed Stop) is thrown.
 */
export async function requestCopy(request: CopyRequest, signal?: AbortSignal): Promise<CopyResponse> {
  try {
    return await postJson('/api/copy', request, copyResponseSchema, signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    return { outcome: 'failed', message: messageOf(error, 'Could not copy this item') };
  }
}
