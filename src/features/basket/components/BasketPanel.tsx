import { CircleAlert } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import type { ConflictPolicy } from '../../../../shared/api.ts';
import { Button } from '../../../components/ui/Button';
import { Panel } from '../../../components/ui/Panel';
import { controlNear, useFocusAfterRender } from '../../../hooks/useFocusAfterRender';
import { pluralize } from '../../../utils/paths';
import type { CopyPhase } from '../../copy/types';
import { useDropTarget } from '../hooks/useDropTarget';
import type { BasketRow } from '../types';
import { BasketDropZone } from './BasketDropZone';
import { BasketEmptyState } from './BasketEmptyState';
import { BasketItemRow } from './BasketItemRow';

const MESSAGE_MS = 6000;

interface BasketPanelProps {
  rows: BasketRow[];
  phase: CopyPhase;
  policy: ConflictPolicy;
  /** Returns why a dropped skill couldn't be added, or null when it was. */
  onDropItem: (id: string) => string | null;
  onRemove: (id: string) => void;
  onClear: () => void;
}

function removeButtons(list: HTMLElement | null): HTMLElement[] {
  return Array.from(list?.querySelectorAll<HTMLElement>('button[data-remove-item]') ?? []);
}

export function BasketPanel({ rows, phase, policy, onDropItem, onRemove, onClear }: BasketPanelProps) {
  const count = rows.length;
  const listRef = useRef<HTMLOListElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const messageTimer = useRef<number | undefined>(undefined);
  const [dropMessage, setDropMessage] = useState<string | null>(null);
  const focusAfterRender = useFocusAfterRender();

  // The whole card accepts drops; a refused drop explains itself for a few seconds instead of doing nothing.
  const { isOver, dropHandlers } = useDropTarget(phase === 'copying', (id) => {
    window.clearTimeout(messageTimer.current);
    const reason = onDropItem(id);
    setDropMessage(reason);
    if (reason) {
      messageTimer.current = window.setTimeout(() => {
        setDropMessage(null);
      }, MESSAGE_MS);
    }
  });

  // Removed rows take their button with them, so keep keyboard focus inside the basket.
  const handleRemove = useCallback(
    (id: string) => {
      const index = removeButtons(listRef.current).findIndex((button) => button.dataset.removeItem === id);
      onRemove(id);
      focusAfterRender(() => controlNear(removeButtons(listRef.current), index) ?? headingRef.current);
    },
    [onRemove, focusAfterRender],
  );

  function handleClear() {
    onClear();
    focusAfterRender(() => headingRef.current);
  }

  return (
    <Panel className="flex flex-col gap-4" {...dropHandlers}>
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 ref={headingRef} id="basket-title" tabIndex={-1} className="m-0 text-title font-extrabold tracking-[-0.01em] focus:outline-none">
            Copy basket
          </h2>
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-accent px-2 text-meta font-extrabold text-white">
            {count}
            <span className="sr-only"> {count === 1 ? 'skill' : 'skills'}</span>
          </span>
        </div>
        {count > 0 && phase === 'idle' && (
          <Button variant="mutedText" onClick={handleClear}>
            Clear basket
          </Button>
        )}
      </div>

      <BasketDropZone highlighted={isOver}>
        {count === 0 ? (
          <BasketEmptyState />
        ) : (
          <ol ref={listRef} aria-label="Skills to copy" className="m-0 flex list-none flex-col gap-2 p-0">
            {rows.map((row, index) => (
              <BasketItemRow key={row.id} {...row} position={index + 1} phase={phase} policy={policy} onRemove={handleRemove} />
            ))}
          </ol>
        )}
      </BasketDropZone>

      {dropMessage && (
        <p aria-hidden="true" className="m-0 flex items-start gap-2 rounded-control bg-warning-bg px-3 py-2 text-meta font-semibold text-warning-ink">
          <CircleAlert size={16} strokeWidth={2.4} className="mt-0.5 flex-none" />
          {dropMessage}
        </p>
      )}
      <p aria-live="polite" className="sr-only">
        {dropMessage ?? `${pluralize(count, 'skill')} in the basket`}
      </p>
    </Panel>
  );
}
