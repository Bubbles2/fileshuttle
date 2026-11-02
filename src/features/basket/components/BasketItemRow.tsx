import { memo } from 'react';
import type { ConflictPolicy } from '../../../../shared/api.ts';
import { ItemText } from '../../../components/ui/ItemText';
import type { CopyItemProgress, CopyPhase } from '../../copy/types';
import type { BasketRow } from '../types';
import { clashNote } from '../utils/clashNote';
import { BasketRowStatus } from './BasketRowStatus';

interface BasketItemRowProps extends BasketRow {
  position: number;
  phase: CopyPhase;
  policy: ConflictPolicy;
  onRemove: (id: string) => void;
}

const NOTE_COLORS = {
  failed: 'text-danger-ink',
  warning: 'text-warning-ink',
  neutral: 'text-muted',
} as const;

function noteFor(progress: CopyItemProgress | undefined, clashWith: number | undefined, policy: ConflictPolicy) {
  if (progress?.message) {
    return { text: progress.message, color: progress.status === 'failed' ? NOTE_COLORS.failed : NOTE_COLORS.neutral };
  }
  if (!progress && clashWith !== undefined) return { text: clashNote(clashWith, policy), color: NOTE_COLORS.warning };
  return null;
}

/** Memoised: during a copy only the row whose progress changed re-renders. */
export const BasketItemRow = memo(function BasketItemRow(props: BasketItemRowProps) {
  const { id, name, source, progress, clashWith, position, phase, policy, onRemove } = props;
  const note = noteFor(progress, clashWith, policy);

  return (
    <li className="flex items-center gap-3 rounded-row border border-line bg-surface py-2.5 pr-2.5 pl-3 shadow-lifted motion-safe:animate-enter">
      <span aria-hidden="true" className="flex size-6.5 flex-none items-center justify-center rounded-lg bg-chip text-caption font-bold text-ink-soft">
        {position}
      </span>
      <ItemText
        primary={name}
        secondary={source}
        note={note && <span className={`text-caption font-semibold ${note.color}`}>{note.text}</span>}
      />
      <BasketRowStatus id={id} name={name} progress={progress} phase={phase} onRemove={onRemove} />
    </li>
  );
});
