import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { pluralize } from '../../../utils/paths';
import type { InventoryState } from '../types';

function Title({ children }: { children: ReactNode }) {
  return <span className="truncate text-title-sm font-bold">{children}</span>;
}

function ColumnName({ children }: { children: ReactNode }) {
  return <code className="rounded-md bg-chip px-1.5 py-px font-mono text-caption text-ink">{children}</code>;
}

function RequiredColumns() {
  return (
    <>
      <ColumnName>Skill</ColumnName>, <ColumnName>Description</ColumnName> and <ColumnName>Central copy</ColumnName>
    </>
  );
}

/** The file name and one line about it, for each stage of loading a CSV. */
export function InputListStatus({ state }: { state: InventoryState }) {
  switch (state.status) {
    case 'empty':
      return (
        <>
          <Title>No skills inventory loaded yet</Title>
          <span className="text-meta text-muted">
            Choose a CSV with <RequiredColumns /> columns. It is read on this computer and never uploaded.
          </span>
        </>
      );
    case 'loading':
      return (
        <>
          <Title>{state.fileName}</Title>
          <span className="flex items-center gap-1.5 text-meta text-muted">
            <LoaderCircle size={14} aria-hidden="true" className="motion-safe:animate-spin" />
            {state.message}
          </span>
        </>
      );
    case 'error':
      return (
        <>
          <Title>{state.fileName ?? 'The CSV could not be loaded'}</Title>
          <span role="alert" className="text-meta font-semibold text-danger-ink">
            {state.message}
          </span>
        </>
      );
    case 'ready': {
      const { fileName, rowCount, skippedRows, duplicateRows } = state.inventory;
      return (
        <>
          <Title>{fileName}</Title>
          <span className="text-meta text-muted">
            {pluralize(rowCount, 'row')} · columns <RequiredColumns />
            {skippedRows > 0 && (
              <span className="font-semibold text-warning-ink"> · {pluralize(skippedRows, 'row')} skipped (no skill name or central copy)</span>
            )}
            {duplicateRows > 0 && (
              <span className="font-semibold text-warning-ink"> · {pluralize(duplicateRows, 'duplicate central copy', 'duplicate central copies')} ignored</span>
            )}
          </span>
        </>
      );
    }
  }
}
