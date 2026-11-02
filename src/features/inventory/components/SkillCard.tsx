import { Check, Plus } from 'lucide-react';
import { memo, useId, useState } from 'react';
import { GripIcon } from '../../../components/ui/icons';
import { cn } from '../../../utils/cn';
import { writeItemDragData } from '../../basket/utils/dragData';
import type { InventoryItem } from '../types';
import { SkillDetails } from './SkillDetails';

export type SkillCardState = 'available' | 'added';

interface SkillCardProps {
  item: InventoryItem;
  state: SkillCardState;
  locked: boolean;
  /** The panel's Details box: show this card's details whatever its own tick says. */
  allDetails: boolean;
  onAdd: (id: string) => void;
}

/** The round button in the card's top-right corner: "+" to add, a tick once it's in the basket. */
function CornerAction({ item, state, locked, onAdd }: SkillCardProps) {
  if (state === 'added') {
    return (
      <span title="In basket" className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-success text-white">
        <Check size={18} strokeWidth={3} aria-hidden="true" />
        <span className="sr-only">{item.name} is in the basket</span>
      </span>
    );
  }
  return (
    <button
      type="button"
      aria-label={`Add ${item.name} to the basket`}
      title="Add to basket"
      data-add-item={item.id}
      disabled={locked}
      onClick={() => {
        onAdd(item.id);
      }}
      className="absolute top-3 right-3 flex size-9 cursor-pointer items-center justify-center rounded-full bg-accent text-white shadow-cta transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Plus size={20} strokeWidth={2.6} aria-hidden="true" />
    </button>
  );
}

/** Memoised: the list can hold thousands of skills, and only the cards that change should re-render. */
export const SkillCard = memo(function SkillCard(props: SkillCardProps) {
  const { item, state, locked, allDetails } = props;
  const [ownDetails, setOwnDetails] = useState(false);
  const showDetails = allDetails || ownDetails;
  const id = useId();
  const draggable = state === 'available' && !locked;

  return (
    <article
      aria-labelledby={`${id}-name`}
      draggable={draggable}
      onDragStart={(event) => {
        writeItemDragData(event.dataTransfer, item.id);
      }}
      className={cn(
        'relative flex flex-col gap-3 rounded-row border p-3 pr-14 transition-[border-color,box-shadow]',
        state === 'added'
          ? 'border-dashed border-line-strong bg-surface-subtle'
          : 'border-line bg-surface shadow-row hover:border-line-strong hover:shadow-row-hover',
        draggable && 'cursor-grab active:cursor-grabbing',
      )}
    >
      <div className="flex items-start gap-3">
        {draggable && (
          <span className="hidden pt-1 sm:block">
            <GripIcon />
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 id={`${id}-name`} className={cn('m-0 text-body font-bold break-words', state === 'added' ? 'text-muted' : 'text-ink')}>
            {item.name}
          </h3>
          <p title={item.description} className={cn('m-0 text-meta text-muted', !showDetails && 'line-clamp-2')}>
            {item.description || 'No description'}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <label className="inline-flex cursor-pointer items-center gap-2 text-meta font-semibold text-ink-soft has-disabled:cursor-default">
              <input
                type="checkbox"
                checked={showDetails}
                disabled={allDetails}
                aria-controls={showDetails ? `${id}-details` : undefined}
                onChange={(event) => {
                  setOwnDetails(event.target.checked);
                }}
                className="size-4 cursor-pointer accent-accent"
              />
              Show details
            </label>
            {item.category && (
              <span className="rounded-md bg-chip px-2 py-0.5 text-caption font-semibold text-ink-soft">{item.category}</span>
            )}
          </div>
        </div>
      </div>
      {showDetails && <SkillDetails id={`${id}-details`} item={item} />}
      <CornerAction {...props} />
    </article>
  );
});
