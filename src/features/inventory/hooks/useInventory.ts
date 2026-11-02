import { useCallback, useRef, useState } from 'react';
import { CSV_TOO_LARGE, MAX_CSV_BYTES } from '../../../../shared/api.ts';
import { messageOf } from '../../../services/apiClient';
import { baseName } from '../../../utils/paths';
import { fetchCsvBytes } from '../services/csvFileApi';
import { decodeCsvBytes } from '../services/decodeText';
import { parseInventory } from '../services/parseInventory';
import type { InventoryState } from '../types';

/**
 * Reads a skills CSV and shows its skills straight away. A File (from the
 * browser's own dialog) is read in the browser with no server involved; a path
 * (from the CSV browser) is fetched through the local server first.
 */
export function useInventory() {
  const [state, setState] = useState<InventoryState>({ status: 'empty' });
  const latestRun = useRef(0);

  const load = useCallback(async (source: File | string) => {
    latestRun.current += 1;
    const run = latestRun.current;
    const fileName = typeof source === 'string' ? baseName(source) : source.name;

    if (typeof source !== 'string' && source.size > MAX_CSV_BYTES) {
      setState({ status: 'error', fileName, message: CSV_TOO_LARGE });
      return;
    }
    setState({ status: 'loading', fileName, message: 'Reading the CSV…' });

    let result: ReturnType<typeof parseInventory>;
    try {
      const bytes = typeof source === 'string' ? await fetchCsvBytes(source) : await source.arrayBuffer();
      result = parseInventory(decodeCsvBytes(bytes));
    } catch (error) {
      result = { ok: false, error: messageOf(error, 'This file could not be read.') };
    }
    if (run !== latestRun.current) return;
    if (!result.ok) {
      setState({ status: 'error', fileName, message: result.error });
      return;
    }

    const listId = crypto.randomUUID();
    const { rows, rowCount, skippedRows, duplicateRows } = result.value;
    const items = rows.map((row, index) => ({ ...row, id: `${listId}:${index + 1}`, location: row.centralCopy }));
    setState({ status: 'ready', inventory: { id: listId, fileName, items, rowCount, skippedRows, duplicateRows } });
  }, []);

  return { state, load };
}
