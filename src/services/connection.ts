import { API_KEY_HEADER } from '../../shared/api.ts';
import { readApiKey } from './apiKey';

export type ConnectionStatus = 'checking' | 'connected' | 'needs-link' | 'offline';
type KnownStatus = Exclude<ConnectionStatus, 'checking'>;

/** Every API call reports what it learned, so the connection notice stays current. */
const CONNECTION_EVENT = 'fileshuttle:connection';

export function reportConnection(status: KnownStatus): void {
  window.dispatchEvent(new CustomEvent<KnownStatus>(CONNECTION_EVENT, { detail: status }));
}

export function onConnectionReport(listener: (status: KnownStatus) => void): () => void {
  const handler = (event: Event) => {
    if (event instanceof CustomEvent) listener(event.detail as KnownStatus);
  };
  window.addEventListener(CONNECTION_EVENT, handler);
  return () => {
    window.removeEventListener(CONNECTION_EVENT, handler);
  };
}

/**
 * Asks the server whether it is running and will accept this browser. A key is
 * only needed when the server was started with --require-key.
 */
export async function checkConnection(signal?: AbortSignal): Promise<KnownStatus> {
  const apiKey = readApiKey();
  try {
    const response = await fetch('/api/health', { headers: apiKey ? { [API_KEY_HEADER]: apiKey } : {}, signal });
    if (response.status === 401) return 'needs-link';
    return response.ok ? 'connected' : 'offline';
  } catch {
    return 'offline';
  }
}
