import type { Stats } from 'node:fs';
import { cp, mkdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import type { CopyRequest, CopyResponse } from '../../shared/api.ts';
import { copyErrorMessage, errorCode, TOO_DEEP } from './copyErrors.ts';
import { classifyPath, isUsablePath, windowsFolderNameProblem } from './pathRules.ts';

const MAX_RENAME_ATTEMPTS = 999;
const MAX_FOLDER_DEPTH = 64;

export interface CopyOptions {
  allowNetworkPaths: boolean;
}

async function statOrNull(target: string): Promise<Stats | null> {
  try {
    return await stat(target);
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return null;
    throw error;
  }
}

function normalizeForCompare(target: string): string {
  const resolved = path.resolve(target);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

/** True when `child` is `parent` itself or somewhere inside it. */
export function isSameOrInside(child: string, parent: string): boolean {
  const relative = path.relative(normalizeForCompare(parent), normalizeForCompare(child));
  if (relative === '') return true;
  return relative.split(path.sep)[0] !== '..' && !path.isAbsolute(relative);
}

/**
 * Resolves junctions, symlinks and mapped/subst drives in a folder that may not
 * exist yet, by resolving its deepest existing ancestor.
 */
export async function realPathOfFolder(folder: string): Promise<string> {
  const missing: string[] = [];
  let current = path.resolve(folder);
  for (;;) {
    try {
      return path.join(await realpath(current), ...missing.reverse());
    } catch (error) {
      const parent = path.dirname(current);
      if (errorCode(error) !== 'ENOENT' || parent === current) return path.resolve(folder);
      missing.push(path.basename(current));
      current = parent;
    }
  }
}

/** Picks "name (1).ext", "name (2).ext", … until a free name is found. */
export async function nextFreeName(folder: string, name: string): Promise<string | null> {
  const extension = path.extname(name);
  const stem = extension ? name.slice(0, -extension.length) : name;
  for (let n = 1; n <= MAX_RENAME_ATTEMPTS; n += 1) {
    const candidate = path.join(folder, `${stem} (${n})${extension}`);
    if (!(await statOrNull(candidate))) return candidate;
  }
  return null;
}

/** Stops runaway recursion (e.g. a loop through links) that the path checks didn't catch. */
function depthGuard(sourceRoot: string) {
  const rootDepth = path.resolve(sourceRoot).split(path.sep).length;
  return (src: string) => {
    if (path.resolve(src).split(path.sep).length - rootDepth > MAX_FOLDER_DEPTH) {
      throw Object.assign(new Error('Folder nesting limit reached'), { code: TOO_DEEP });
    }
    return true;
  };
}

function failed(message: string, target?: string): CopyResponse {
  return target ? { outcome: 'failed', target, message } : { outcome: 'failed', message };
}

function pathRefusal(source: string, destination: string, { allowNetworkPaths }: CopyOptions): string | null {
  for (const [candidate, which] of [
    [source, 'The skill folder'],
    [destination, 'The destination'],
  ] as const) {
    if (isUsablePath(candidate, allowNetworkPaths)) continue;
    return classifyPath(candidate) === 'network'
      ? 'Network paths are turned off. Start FileShuttle with --allow-network-paths to use them.'
      : `${which} isn’t a full path (${candidate}). Use one that starts from a drive, like C:\\AI_Donncha.`;
  }
  return windowsFolderNameProblem(destination);
}

/**
 * Copies one file or folder into `destination`, creating the destination if needed.
 * Folders are copied recursively; with "overwrite" an existing folder is merged and
 * files inside it are replaced, but nothing already in the destination is deleted.
 */
export async function copyItem({ source, destination, policy, targetName }: CopyRequest, options: CopyOptions): Promise<CopyResponse> {
  const refusal = pathRefusal(source, destination, options);
  if (refusal) return failed(refusal);
  // A new name is checked with the same rules as a destination folder name (reserved names, trailing dots…).
  const nameProblem = targetName ? windowsFolderNameProblem(path.join(path.resolve(destination), targetName)) : null;
  if (nameProblem) return failed(nameProblem);

  const sourcePath = path.resolve(source);
  const destinationPath = path.resolve(destination);
  if (!path.basename(sourcePath)) return failed('A whole drive can’t be copied. Choose a folder on it instead.');
  const name = targetName ?? path.basename(sourcePath);
  let target = path.join(destinationPath, name);

  try {
    const sourceInfo = await statOrNull(sourcePath);
    if (!sourceInfo) return failed('Not found on disk');
    if (!sourceInfo.isFile() && !sourceInfo.isDirectory()) return failed('Only files and folders can be copied');
    if (sourceInfo.isDirectory()) {
      const [realSource, realDestination] = await Promise.all([realpath(sourcePath), realPathOfFolder(destinationPath)]);
      if (isSameOrInside(destinationPath, sourcePath) || isSameOrInside(realDestination, realSource)) {
        return failed('The destination is inside this folder');
      }
    }

    await mkdir(destinationPath, { recursive: true });

    const existing = await statOrNull(target);
    if (existing) {
      if (policy === 'skip') return { outcome: 'skipped', target, message: 'Already exists in the destination' };
      if (policy === 'rename') {
        const renamed = await nextFreeName(destinationPath, name);
        if (!renamed) return failed('Too many copies with this name already exist', target);
        target = renamed;
      } else if (existing.isDirectory() !== sourceInfo.isDirectory()) {
        return failed('A file and a folder share this name', target);
      } else if (isSameOrInside(target, sourcePath)) {
        return failed('The item is already in the destination', target);
      }
    }

    await cp(sourcePath, target, {
      recursive: true,
      force: policy === 'overwrite',
      errorOnExist: policy !== 'overwrite',
      preserveTimestamps: true,
      filter: depthGuard(sourcePath),
    });
    return { outcome: 'copied', target };
  } catch (error) {
    return failed(copyErrorMessage(error), target);
  }
}
