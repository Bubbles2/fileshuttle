import { pluralize } from '../../../utils/paths';
import type { InventoryItem } from '../types';

function searchableText(item: InventoryItem): string {
  return [item.name, item.description, item.category, item.technology, item.centralCopy, ...item.otherNames]
    .join('\n')
    .toLowerCase();
}

export function filterItems(items: readonly InventoryItem[], query: string): readonly InventoryItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((item) => searchableText(item).includes(needle));
}

export function describeItems(items: readonly InventoryItem[]): string {
  return pluralize(items.length, 'skill');
}
