import type { CsvFileRequest } from '../../../../shared/api.ts';
import { postForBytes } from '../../../services/apiClient';

/** Reads a CSV on this computer through the local server: a web page can't open a file by its path. */
export function fetchCsvBytes(path: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  const body: CsvFileRequest = { path };
  return postForBytes('/api/csv-file', body, signal);
}
