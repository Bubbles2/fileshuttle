import { ArrowUp, House, X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import type { ListingStart } from '../../../../shared/api.ts';
import { Button } from '../../../components/ui/Button';
import { IconButton } from '../../../components/ui/IconButton';
import { useFocusAfterRender } from '../../../hooks/useFocusAfterRender';
import { useFolderListing } from '../hooks/useFolderListing';
import { FolderList } from './FolderList';

interface FolderPickerDialogProps {
  title: string;
  /** Where to start browsing; null starts at `start`. */
  initialPath: string | null;
  /** Where a null `initialPath` opens: the home folder and drives (default), or the folder FileShuttle was started from. */
  start?: ListingStart;
  /** Pick a CSV file instead of a folder: CSV files are listed too, and choosing one selects it. */
  files?: 'csv';
  /** An extra footer button, e.g. to fall back to the browser's own file dialog. The picker closes before it runs. */
  otherAction?: { label: string; onChoose: () => void };
  onSelect: (path: string) => void;
  onClose: () => void;
}

/**
 * Browses this computer's folders through the local server. A web page can't
 * learn the full path of a folder picked with the browser's own dialog, or open
 * a chosen folder of its own, so FileShuttle lists folders (and CSV files) itself.
 * Mount it to open; it calls onClose when done.
 */
export function FolderPickerDialog({ title, initialPath, start, files, otherAction, onSelect, onClose }: FolderPickerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const locationRef = useRef<HTMLParagraphElement>(null);
  const titleId = useId();
  const { state, open } = useFolderListing(initialPath, { start, files });
  const focusAfterRender = useFocusAfterRender();

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const listing = state.status === 'ready' ? state.listing : null;
  const current = listing?.path ?? null;

  // The clicked folder button disappears with the old listing; keep keyboard focus in the dialog.
  function go(path: string | null) {
    open(path);
    focusAfterRender(() => locationRef.current);
  }

  function close() {
    dialogRef.current?.close();
  }

  function select(path: string) {
    onSelect(path);
    close();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[min(640px,calc(100vw-32px))] rounded-card border border-line bg-surface p-0 text-ink shadow-card backdrop:bg-ink/40"
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="m-0 text-title font-extrabold">
            {title}
          </h2>
          <IconButton variant="ghost" label="Close" onClick={close}>
            <X size={18} strokeWidth={2.2} aria-hidden="true" />
          </IconButton>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled={current === null} onClick={() => { go(listing?.parent ?? null); }}>
            <ArrowUp size={16} aria-hidden="true" />
            Up
          </Button>
          <Button variant="outline" disabled={current === null && state.status === 'ready'} onClick={() => { go(null); }}>
            <House size={16} aria-hidden="true" />
            Drives and home
          </Button>
        </div>

        <p ref={locationRef} tabIndex={-1} aria-live="polite" className="m-0 rounded-control bg-chip px-3 py-2 font-mono text-label break-all focus:outline-none">
          {state.status === 'loading' ? 'Loading…' : (current ?? 'Drives and home folder')}
        </p>

        <FolderList state={state} onOpen={go} onPickFile={files ? select : undefined} />

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
          {otherAction && (
            <Button
              variant="accentText"
              className="mr-auto"
              onClick={() => {
                // Close first: while the modal is open, the rest of the page is inert.
                close();
                otherAction.onChoose();
              }}
            >
              {otherAction.label}
            </Button>
          )}
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          {!files && (
            <Button
              variant="primary"
              disabled={current === null}
              onClick={() => {
                if (current !== null) select(current);
              }}
            >
              Use this folder
            </Button>
          )}
        </div>
      </div>
    </dialog>
  );
}
