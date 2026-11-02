import { useCallback, useMemo, useState } from 'react';
import type { ConflictPolicy } from '../../shared/api.ts';
import { useBasket } from '../features/basket/hooks/useBasket';
import { buildBasketRows } from '../features/basket/utils/buildBasketRows';
import { useCopyJob } from '../features/copy/hooks/useCopyJob';
import { useSourceFolder } from '../features/copy/hooks/useSourceFolder';
import { copyTargets, itemNoun, jobItems } from '../features/copy/utils/copyPlan';
import { isRelativeSource, validateSourceFolder } from '../features/copy/utils/resolveSource';
import { summarizeProgress } from '../features/copy/utils/summarizeProgress';
import { validateDestination } from '../features/copy/utils/validateDestination';
import { useInventory } from '../features/inventory/hooks/useInventory';
import type { InventoryItem, ItemType } from '../features/inventory/types';
import { DEFAULT_DESTINATION_FOLDER, DEFAULT_FOR_CLAUDE } from './defaults';
import { progressSteps } from './progressSteps';

const NO_ITEMS: InventoryItem[] = [];

/**
 * Wires the inventory, basket and copy job together and enforces the rules
 * between them: an item goes into the basket once, and nothing changes mid-copy.
 * Callbacks are stable so memoised rows only re-render when their data changes.
 */
export function useFileShuttle() {
  const inventory = useInventory();
  const basket = useBasket();
  const job = useCopyJob();
  const [destination, setDestination] = useState(DEFAULT_DESTINATION_FOLDER);
  const [policy, setPolicy] = useState<ConflictPolicy>('skip');
  const [forClaude, setForClaude] = useState(DEFAULT_FOR_CLAUDE);
  const [typeFilter, setTypeFilter] = useState<ItemType>('skill');
  const [sourceFolder, setSourceFolder] = useSourceFolder();

  const loaded = inventory.state.status === 'ready' ? inventory.state.inventory : null;
  const items = loaded?.items ?? NO_ITEMS;
  // A CSV with only agents (or only skills) shows them, whichever filter was last chosen.
  const activeType: ItemType =
    items.length > 0 && !items.some((item) => item.type === typeFilter) ? (typeFilter === 'skill' ? 'agent' : 'skill') : typeFilter;
  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const basketIds = useMemo(() => new Set(basket.ids), [basket.ids]);
  const basketItems = useMemo(() => basket.ids.flatMap((id) => itemsById.get(id) ?? []), [basket.ids, itemsById]);

  const copying = job.phase === 'copying';
  const done = job.phase === 'done';
  const locked = job.phase !== 'idle';
  const settings = { destination: destination.trim(), forClaude };
  const destinationError = validateDestination(destination);
  // Relative Central copy paths need the folder they start from before anything can be copied.
  const needsSourceFolder = basketItems.some((item) => isRelativeSource(item.location));
  const sourceFolderError = needsSourceFolder ? validateSourceFolder(sourceFolder) : null;
  const basketRows = useMemo(
    () =>
      buildBasketRows(basketItems, {
        progress: job.progress,
        destination: destination.trim(),
        sourceFolder,
        sourceFolderValid: validateSourceFolder(sourceFolder) === null,
      }),
    [basketItems, job.progress, destination, sourceFolder],
  );
  const summary = useMemo(() => summarizeProgress(job.progress), [job.progress]);

  const { add, addMany, remove, clear } = basket;
  const { start, stop, reset } = job;
  const loadInventory = inventory.load;

  // Adding after a finished copy starts a new batch, rather than silently doing nothing.
  const addItem = useCallback(
    (id: string): string | null => {
      const item = itemsById.get(id);
      if (!item || copying) return null;
      if (basketIds.has(id) && !done) return `${item.name} is already in the basket.`;
      if (done) {
        reset();
        clear();
      }
      add(id);
      return null;
    },
    [itemsById, copying, done, basketIds, reset, clear, add],
  );

  const addAllAvailable = useCallback(() => {
    if (copying) return;
    if (done) {
      reset();
      clear();
    }
    addMany(items.filter((item) => item.type === activeType).map((item) => item.id));
  }, [items, activeType, copying, done, reset, clear, addMany]);

  const removeItem = useCallback(
    (id: string) => {
      if (!locked) remove(id);
    },
    [locked, remove],
  );

  const clearBasket = useCallback(() => {
    if (!locked) clear();
  }, [locked, clear]);

  const loadCsv = useCallback(
    (source: string | File) => {
      if (copying) return;
      reset();
      clear();
      void loadInventory(source);
    },
    [copying, reset, clear, loadInventory],
  );

  function startCopy() {
    if (locked || basketItems.length === 0 || destinationError || sourceFolderError) return;
    void start(jobItems(basketItems, sourceFolder, settings), policy);
  }

  const targets = copyTargets(basketItems, activeType, settings);
  return {
    steps: progressSteps({ hasInventory: loaded !== null, basketCount: basketItems.length, copyDone: done }),
    /** Remounts the source list (clearing its filter) whenever a new CSV loads. */
    sourceKey: loaded?.id ?? 'none',
    input: { state: inventory.state, disabled: copying, onCsvSelected: loadCsv },
    source: {
      status: inventory.state.status,
      items,
      typeFilter: activeType,
      basketIds,
      locked: copying,
      onTypeFilterChange: setTypeFilter,
      onAdd: addItem,
      onAddAll: addAllAvailable,
    },
    basket: {
      rows: basketRows,
      phase: job.phase,
      policy,
      onDropItem: addItem,
      onRemove: removeItem,
      onClear: clearBasket,
    },
    copy: {
      phase: job.phase,
      count: basketItems.length,
      noun: itemNoun(basketItems),
      needsSourceFolder,
      sourceFolder,
      sourceFolderError,
      destination,
      destinationError,
      targets,
      forClaude,
      policy,
      summary,
      canCopy: !locked && basketItems.length > 0 && destinationError === null && sourceFolderError === null,
      onSourceFolderChange: setSourceFolder,
      onDestinationChange: setDestination,
      onForClaudeChange: (next: boolean) => {
        if (!locked) setForClaude(next);
      },
      onPolicyChange: (next: ConflictPolicy) => {
        if (!locked) setPolicy(next);
      },
      onCopy: startCopy,
      onStop: stop,
      onStartNewBatch: () => {
        reset();
        clear();
      },
    },
  };
}
