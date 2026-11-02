import type { InventoryItem, ItemType } from '../../inventory/types';
import type { CopyJobItem } from '../types';
import { destinationFor, targetNameFor } from './destinationFolders';
import { resolveSource } from './resolveSource';

export interface CopyTarget {
  type: ItemType;
  /** The folder items of this type are copied into. */
  path: string;
  /** True when agent files are renamed from .md to .toml (Codex). */
  renamesToToml: boolean;
}

interface PlanSettings {
  destination: string;
  forClaude: boolean;
}

/** One target per item type in the basket (or for `fallback` when the basket is empty), skills first. */
export function copyTargets(items: readonly InventoryItem[], fallback: ItemType, { destination, forClaude }: PlanSettings): CopyTarget[] {
  const present = new Set(items.map((item) => item.type));
  const types = (['skill', 'agent'] as const).filter((type) => present.has(type));
  return (types.length > 0 ? types : [fallback]).map((type) => ({
    type,
    path: destinationFor(destination, type, forClaude),
    renamesToToml: type === 'agent' && !forClaude,
  }));
}

/** "skill" or "agent" when the basket holds one kind, "item" when it mixes both. */
export function itemNoun(items: readonly InventoryItem[]): 'skill' | 'agent' | 'item' {
  const types = new Set(items.map((item) => item.type));
  if (types.size === 1) return types.has('agent') ? 'agent' : 'skill';
  return types.size === 0 ? 'skill' : 'item';
}

/** What to send to the server for each basket item: full source path, its own destination folder and name. */
export function jobItems(items: readonly InventoryItem[], sourceFolder: string, settings: PlanSettings): CopyJobItem[] {
  return items.map((item) => ({
    id: item.id,
    location: resolveSource(item.location, sourceFolder),
    destination: destinationFor(settings.destination, item.type, settings.forClaude),
    targetName: targetNameFor(item.location, item.type, settings.forClaude),
  }));
}
