import { baseName, joinPath } from '../../../utils/paths';
import type { ItemType } from '../../inventory/types';

/**
 * Where each kind of item goes inside the chosen destination:
 *   Claude ticked:   skills → .claude\skills   agents → .claude\agents (name.md)
 *   Claude unticked: skills → .agents\skills   agents → .codex\agents  (name.toml)
 */
export function subfolderFor(type: ItemType, forClaude: boolean): string {
  if (type === 'skill') return forClaude ? '.claude\\skills' : '.agents\\skills';
  return forClaude ? '.claude\\agents' : '.codex\\agents';
}

const EXISTING_SUBFOLDER = /[\\/]+\.(?:claude|agents|codex)[\\/]+(?:skills|agents)[\\/]*$/i;

/** The destination plus the item's subfolder. A destination already ending in one of the subfolders isn't doubled. */
export function destinationFor(destination: string, type: ItemType, forClaude: boolean): string {
  const base = destination.trim().replace(EXISTING_SUBFOLDER, '');
  return subfolderFor(type, forClaude)
    .split('\\')
    .reduce((path, part) => joinPath(path, part), base);
}

/** Codex agents are .toml files: rename "agent.md" to "agent.toml". Everything else keeps its own name. */
export function targetNameFor(location: string, type: ItemType, forClaude: boolean): string | undefined {
  if (type !== 'agent' || forClaude) return undefined;
  return `${baseName(location).replace(/\.md$/i, '')}.toml`;
}
