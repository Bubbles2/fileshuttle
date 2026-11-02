import { ChevronRight, CircleAlert, FileSpreadsheet, Folder, HardDrive, LoaderCircle } from 'lucide-react';
import type { FolderListingState } from '../hooks/useFolderListing';

interface FolderListProps {
  state: FolderListingState;
  onOpen: (path: string) => void;
  /** Choosing a listed file (only shown when the listing has files). */
  onPickFile?: (path: string) => void;
}

function Note({ tone, children }: { tone: 'warning' | 'muted'; children: string }) {
  return (
    <p className={`m-0 flex items-start gap-2 rounded-control px-3 py-2 text-meta ${tone === 'warning' ? 'bg-warning-bg font-semibold text-warning-ink' : 'text-muted'}`}>
      {tone === 'warning' && <CircleAlert size={16} strokeWidth={2.4} aria-hidden="true" className="mt-0.5 flex-none" />}
      {children}
    </p>
  );
}

const ROW = 'flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-control px-3 text-left text-label font-semibold text-ink transition-colors hover:bg-accent-soft';

/** Any listed files, then the sub-folders of the current folder; choosing a file picks it, choosing a folder opens it. */
export function FolderList({ state, onOpen, onPickFile }: FolderListProps) {
  if (state.status === 'loading') {
    return (
      <p className="m-0 flex items-center gap-2 px-3 py-6 text-label text-muted">
        <LoaderCircle size={18} aria-hidden="true" className="motion-safe:animate-spin" />
        Loading folders…
      </p>
    );
  }
  if (state.status === 'error') return <Note tone="warning">{state.message}</Note>;

  const { listing } = state;
  const isStartingPlaces = listing.path === null;
  const files = onPickFile ? (listing.files ?? []) : [];
  const withFiles = onPickFile !== undefined && !isStartingPlaces;
  const empty = listing.entries.length === 0 && files.length === 0;
  return (
    <div className="flex flex-col gap-2">
      {listing.message && <Note tone="warning">{listing.message}</Note>}
      {empty && !listing.message && <Note tone="muted">{withFiles ? 'No folders or CSV files here.' : 'No folders here.'}</Note>}
      {!empty && (
        <ul
          aria-label={isStartingPlaces ? 'Starting places' : withFiles ? 'Folders and CSV files' : 'Folders'}
          className="m-0 flex max-h-[45vh] list-none flex-col gap-1 overflow-y-auto overscroll-contain p-0.5"
        >
          {/* Files first: they are what is being picked, and a project's folders can push them out of view. */}
          {files.map((file) => (
            <li key={file.path}>
              <button
                type="button"
                onClick={() => {
                  onPickFile?.(file.path);
                }}
                className={ROW}
              >
                <FileSpreadsheet size={18} strokeWidth={1.9} aria-hidden="true" className="flex-none text-success" />
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
              </button>
            </li>
          ))}
          {listing.entries.map((entry) => (
            <li key={entry.path}>
              <button
                type="button"
                onClick={() => {
                  onOpen(entry.path);
                }}
                className={ROW}
              >
                {isStartingPlaces ? (
                  <HardDrive size={18} aria-hidden="true" className="flex-none text-accent" />
                ) : (
                  <Folder size={18} strokeWidth={1.9} aria-hidden="true" className="flex-none text-folder" />
                )}
                <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                <ChevronRight size={16} aria-hidden="true" className="flex-none text-muted" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {listing.truncated && <Note tone="muted">{withFiles ? 'Only the first 1,000 folders and 1,000 CSV files are shown.' : 'Only the first 1,000 folders are shown.'}</Note>}
    </div>
  );
}
