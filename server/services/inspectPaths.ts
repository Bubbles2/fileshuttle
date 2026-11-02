import { stat } from 'node:fs/promises';
import type { PathKind } from '../../shared/api.ts';
import { classifyPath } from './pathRules.ts';

const CONCURRENCY = 32;

/**
 * Reports whether a path is a file, a folder, or not usable. Relative paths are
 * never resolved, and network paths are not touched unless explicitly allowed.
 */
export async function inspectPath(target: string, allowNetworkPaths: boolean): Promise<PathKind> {
  const pathClass = classifyPath(target);
  if (pathClass === 'invalid') return 'missing';
  if (pathClass === 'network' && !allowNetworkPaths) return 'network';
  try {
    const info = await stat(target);
    if (info.isDirectory()) return 'folder';
    if (info.isFile()) return 'file';
    return 'missing';
  } catch {
    return 'missing';
  }
}

export async function inspectPaths(paths: readonly string[], allowNetworkPaths: boolean): Promise<{ path: string; kind: PathKind }[]> {
  const results: { path: string; kind: PathKind }[] = [];
  for (let start = 0; start < paths.length; start += CONCURRENCY) {
    const chunk = paths.slice(start, start + CONCURRENCY);
    const kinds = await Promise.all(chunk.map((p) => inspectPath(p, allowNetworkPaths)));
    chunk.forEach((p, i) => results.push({ path: p, kind: kinds[i] ?? 'missing' }));
  }
  return results;
}
