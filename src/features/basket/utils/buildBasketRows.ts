import { baseName } from '../../../utils/paths';
import type { CopyItemProgress } from '../../copy/types';
import { isRelativeSource, resolveSource } from '../../copy/utils/resolveSource';
import type { InventoryItem } from '../../inventory/types';
import type { BasketRow } from '../types';

interface RowContext {
  progress: Record<string, CopyItemProgress>;
  /** Only used to decide whether folder names clash case-insensitively (anything but POSIX). */
  destination: string;
  sourceFolder: string;
  sourceFolderValid: boolean;
}

/**
 * Turns basket items into rows: the folder each skill is copied from, its
 * progress, and any earlier row that would land under the same folder name.
 */
export function buildBasketRows(items: readonly InventoryItem[], context: RowContext): BasketRow[] {
  const { progress, destination, sourceFolder, sourceFolderValid } = context;
  const caseSensitive = destination.startsWith('/');
  const firstWithName = new Map<string, number>();
  return items.map((item, index) => {
    // Skills and agents land in different folders, so only same-type items can clash.
    const name = baseName(item.location);
    const key = `${item.type}:${caseSensitive ? name : name.toLowerCase()}`;
    const clashWith = firstWithName.get(key);
    if (clashWith === undefined) firstWithName.set(key, index + 1);
    const usable = sourceFolderValid || !isRelativeSource(item.location);
    const source = usable ? resolveSource(item.location, sourceFolder) : item.location;
    return { id: item.id, name: item.name, source, progress: progress[item.id], clashWith };
  });
}
