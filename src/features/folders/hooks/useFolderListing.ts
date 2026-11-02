import { useCallback, useEffect, useRef, useState } from 'react';
import type { FolderListing, ListingStart } from '../../../../shared/api.ts';
import { messageOf } from '../../../services/apiClient';
import { fetchFolders } from '../services/folderApi';

export type FolderListingState =
  | { status: 'loading' }
  | { status: 'ready'; listing: FolderListing }
  | { status: 'error'; message: string };

export interface FolderListingOptions {
  /** Where to open when `initialPath` is null: the starting places, or the folder FileShuttle was started from. */
  start?: ListingStart;
  /** Also list CSV files. */
  files?: 'csv';
}

/** Loads folder listings for the picker; only the latest request is shown. Later null paths are the starting places. */
export function useFolderListing(initialPath: string | null, { start = 'places', files }: FolderListingOptions = {}) {
  const [state, setState] = useState<FolderListingState>({ status: 'loading' });
  const latest = useRef(0);

  const load = useCallback(
    async (path: string | null, from: ListingStart, run: number) => {
      try {
        const listing = await fetchFolders({ path, start: from, files });
        if (run === latest.current) setState({ status: 'ready', listing });
      } catch (error) {
        if (run === latest.current) setState({ status: 'error', message: messageOf(error, 'Could not list folders.') });
      }
    },
    [files],
  );

  useEffect(() => {
    latest.current += 1;
    void load(initialPath, start, latest.current);
  }, [load, initialPath, start]);

  const open = useCallback(
    (path: string | null) => {
      latest.current += 1;
      setState({ status: 'loading' });
      void load(path, 'places', latest.current);
    },
    [load],
  );

  return { state, open };
}
