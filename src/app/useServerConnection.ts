import { useEffect, useState } from 'react';
import { checkConnection, onConnectionReport, type ConnectionStatus } from '../services/connection';

/**
 * Checks on page load that the server is up and accepts this browser's key, so
 * a missing or outdated key is explained before the user tries to load a CSV.
 * Later API calls keep the status current.
 */
export function useServerConnection(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>('checking');

  useEffect(() => {
    const controller = new AbortController();
    void checkConnection(controller.signal).then((result) => {
      if (!controller.signal.aborted) setStatus(result);
    });
    const unsubscribe = onConnectionReport(setStatus);
    return () => {
      controller.abort();
      unsubscribe();
    };
  }, []);

  return status;
}
