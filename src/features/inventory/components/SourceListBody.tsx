import { useCallback, useRef } from 'react';
import { controlNear, useFocusAfterRender } from '../../../hooks/useFocusAfterRender';
import type { InventoryItem, InventoryState } from '../types';
import { SkillCard, type SkillCardState } from './SkillCard';

interface SourceListBodyProps {
  status: InventoryState['status'];
  visibleItems: readonly InventoryItem[];
  /** Shown when nothing is visible, e.g. "No skills match this filter." */
  emptyMessage: string;
  basketIds: ReadonlySet<string>;
  locked: boolean;
  allDetails: boolean;
  onAdd: (id: string) => void;
}

function cardState(item: InventoryItem, basketIds: ReadonlySet<string>): SkillCardState {
  return basketIds.has(item.id) ? 'added' : 'available';
}

function addButtons(list: HTMLElement | null): HTMLElement[] {
  return Array.from(list?.querySelectorAll<HTMLElement>('button[data-add-item]') ?? []);
}

function Message({ children }: { children: string }) {
  return <p className="m-0 p-6 text-center text-label text-muted">{children}</p>;
}

function LoadingCards() {
  return (
    <div aria-busy="true" className="flex flex-col gap-2.5">
      <span className="sr-only">Loading skills…</span>
      {[0, 1, 2].map((key) => (
        <div key={key} className="h-24 rounded-row border border-line bg-surface-subtle motion-safe:animate-pulse" />
      ))}
    </div>
  );
}

export function SourceListBody({ status, visibleItems, emptyMessage, basketIds, locked, allDetails, onAdd }: SourceListBodyProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const focusAfterRender = useFocusAfterRender();

  // The "+" button disappears once its card is in the basket, so focus moves to the next one.
  const handleAdd = useCallback(
    (id: string) => {
      const index = addButtons(listRef.current).findIndex((button) => button.dataset.addItem === id);
      onAdd(id);
      if (index === -1) return;
      focusAfterRender(() => controlNear(addButtons(listRef.current), index) ?? document.getElementById('basket-title'));
    },
    [onAdd, focusAfterRender],
  );

  if (status === 'loading') return <LoadingCards />;
  if (status !== 'ready') return <Message>Load a skills inventory CSV to see its skills here.</Message>;
  if (visibleItems.length === 0) return <Message>{emptyMessage}</Message>;

  return (
    // On wide screens the list scrolls inside the panel, so the basket stays in view while dragging any card.
    <ul
      ref={listRef}
      aria-label="Items in the CSV"
      className="m-0 flex list-none flex-col gap-2.5 p-0 lg:-m-1 lg:max-h-[70vh] lg:overflow-y-auto lg:overscroll-contain lg:p-1"
    >
      {visibleItems.map((item) => (
        <li key={item.id}>
          <SkillCard item={item} state={cardState(item, basketIds)} locked={locked} allDetails={allDetails} onAdd={handleAdd} />
        </li>
      ))}
    </ul>
  );
}
