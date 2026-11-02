import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Panel } from '../../../components/ui/Panel';
import { pluralize } from '../../../utils/paths';
import type { InventoryItem, InventoryState, ItemType } from '../types';
import { filterItems } from '../utils/filterItems';
import { FilterField } from './FilterField';
import { SourceListBody } from './SourceListBody';
import { TypeFilter } from './TypeFilter';

interface SourceListPanelProps {
  status: InventoryState['status'];
  items: readonly InventoryItem[];
  typeFilter: ItemType;
  basketIds: ReadonlySet<string>;
  locked: boolean;
  onTypeFilterChange: (type: ItemType) => void;
  onAdd: (id: string) => void;
  onAddAll: () => void;
}

export function SourceListPanel(props: SourceListPanelProps) {
  const { status, items, typeFilter, basketIds, locked, onAdd, onAddAll } = props;
  const [query, setQuery] = useState('');
  // Ticked: every card shows its details; each card's own "Show details" box is overridden.
  const [allDetails, setAllDetails] = useState(false);
  const ofType = items.filter((item) => item.type === typeFilter);
  const visibleItems = filterItems(ofType, query);
  const availableCount = ofType.filter((item) => !basketIds.has(item.id)).length;
  const counts = { agent: items.filter((item) => item.type === 'agent').length, skill: items.filter((item) => item.type === 'skill').length };
  const noun = typeFilter === 'agent' ? 'agent' : 'skill';

  return (
    <Panel as="section" aria-labelledby="source-title" className="flex flex-[1_1_440px] flex-col gap-4">
      <TypeFilter value={typeFilter} counts={counts} onChange={props.onTypeFilterChange} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h2 id="source-title" tabIndex={-1} className="m-0 text-title font-extrabold tracking-[-0.01em] focus:outline-none">
            {typeFilter === 'agent' ? 'Agents' : 'Skills'}
          </h2>
          <span className="text-meta text-muted">{status === 'ready' ? pluralize(ofType.length, noun) : 'No inventory loaded'}</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-label font-semibold text-ink">
            <input
              type="checkbox"
              checked={allDetails}
              onChange={(event) => {
                setAllDetails(event.target.checked);
              }}
              className="size-4.5 cursor-pointer accent-accent"
            />
            Details
          </label>
          <Button variant="accentText" disabled={locked || availableCount === 0} onClick={onAddAll}>
            Add all available
          </Button>
        </div>
      </div>
      <FilterField value={query} disabled={ofType.length === 0} onChange={setQuery} />
      <SourceListBody
        status={status}
        visibleItems={visibleItems}
        emptyMessage={ofType.length === 0 ? `This CSV has no ${noun}s.` : `No ${noun}s match this filter.`}
        basketIds={basketIds}
        locked={locked}
        allDetails={allDetails}
        onAdd={onAdd}
      />
    </Panel>
  );
}
