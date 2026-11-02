import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { CSV_TOO_LARGE, MAX_CSV_BYTES } from '../../shared/api.ts';
import { copyErrorMessage } from './copyErrors.ts';
import { classifyPath, isUsablePath } from './pathRules.ts';

export type CsvFileResult = { ok: true; bytes: Buffer } | { ok: false; status: 400 | 404 | 413; message: string };

/**
 * Reads a CSV picked in the CSV browser. Only `.csv` files up to 5 MB on local
 * drives (network shares only with --allow-network-paths); the browser decodes
 * and validates the bytes exactly as it does for a file it opened itself.
 */
export async function readCsvFile(target: string, allowNetworkPaths: boolean): Promise<CsvFileResult> {
  if (!isUsablePath(target, allowNetworkPaths)) {
    const message =
      classifyPath(target) === 'network'
        ? 'Network files are turned off. Start FileShuttle with --allow-network-paths to open them.'
        : 'Use a full path that starts from a drive or root folder.';
    return { ok: false, status: 400, message };
  }
  const name = path.basename(target);
  if (path.extname(name).toLowerCase() !== '.csv') return { ok: false, status: 400, message: 'Only .csv files can be opened.' };

  try {
    const info = await stat(target);
    if (!info.isFile()) return { ok: false, status: 400, message: `${name} is not a file.` };
    if (info.size > MAX_CSV_BYTES) return { ok: false, status: 413, message: CSV_TOO_LARGE };
    // Checked again after reading, in case the file grew in between.
    const bytes = await readFile(target);
    return bytes.length > MAX_CSV_BYTES ? { ok: false, status: 413, message: CSV_TOO_LARGE } : { ok: true, bytes };
  } catch (error) {
    return { ok: false, status: 404, message: `${name}: ${copyErrorMessage(error)}` };
  }
}
