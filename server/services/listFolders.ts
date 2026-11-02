import type { Dirent } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { FolderListing } from '../../shared/api.ts';
import { copyErrorMessage, errorCode } from './copyErrors.ts';
import { classifyPath, isUsablePath } from './pathRules.ts';

const MAX_ENTRIES = 1000;
const DRIVE_CHECK_MS = 1500;
/** Windows system folders nobody picks on purpose. */
const HIDDEN_NAMES = /^(?:\$.*|System Volume Information)$/i;

const byName = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

async function kindOf(target: string): Promise<'folder' | 'file' | null> {
  try {
    const info = await stat(target);
    return info.isDirectory() ? 'folder' : info.isFile() ? 'file' : null;
  } catch {
    return null;
  }
}

async function isFolder(target: string): Promise<boolean> {
  return (await kindOf(target)) === 'folder';
}

/** Resolves false if a drive doesn't answer quickly (e.g. a disconnected mapped drive). */
function driveExists(root: string): Promise<boolean> {
  return Promise.race([isFolder(root), new Promise<boolean>((resolve) => setTimeout(resolve, DRIVE_CHECK_MS, false))]);
}

/** The home folder plus every drive letter (Windows) or the filesystem root (elsewhere). */
export async function listStartingPlaces(): Promise<FolderListing> {
  const home = os.homedir();
  const entries = [{ name: `Home (${home})`, path: home }];
  if (process.platform === 'win32') {
    const roots = Array.from({ length: 26 }, (_, i) => `${String.fromCharCode(65 + i)}:\\`);
    const present = await Promise.all(roots.map(driveExists));
    roots.forEach((root, i) => {
      if (present[i]) entries.push({ name: `${root.slice(0, 2)} drive`, path: root });
    });
  } else {
    entries.push({ name: 'Computer (/)', path: '/' });
  }
  return { path: null, parent: null, entries, truncated: false };
}

function isCsvName(name: string): boolean {
  return path.extname(name).toLowerCase() === '.csv';
}

/** Sub-folder names and, when `withCsv` is set, CSV file names; links count as what they point to. */
async function entryNames(folder: string, dirents: Dirent[], withCsv: boolean): Promise<{ folders: string[]; files: string[] }> {
  const folders: string[] = [];
  const files: string[] = [];
  for (const dirent of dirents) {
    if (HIDDEN_NAMES.test(dirent.name)) continue;
    const kind = dirent.isSymbolicLink()
      ? await kindOf(path.join(folder, dirent.name))
      : dirent.isDirectory()
        ? 'folder'
        : dirent.isFile()
          ? 'file'
          : null;
    if (kind === 'folder') folders.push(dirent.name);
    else if (kind === 'file' && withCsv && isCsvName(dirent.name)) files.push(dirent.name);
  }
  return { folders: folders.sort(byName.compare), files: files.sort(byName.compare) };
}

/**
 * Lists the sub-folders of a folder for the folder picker, plus its CSV files
 * (never other files) when `withCsv` is set. A folder that doesn't exist yet
 * shows its nearest existing parent instead.
 */
export async function listFolders(target: string, allowNetworkPaths: boolean, withCsv = false): Promise<FolderListing> {
  if (!isUsablePath(target, allowNetworkPaths)) {
    const message =
      classifyPath(target) === 'network'
        ? 'Network folders are turned off. Start FileShuttle with --allow-network-paths to browse them.'
        : 'Use a full path that starts from a drive or root folder.';
    return { path: null, parent: null, entries: [], truncated: false, message };
  }

  let folder = path.resolve(target);
  let message: string | undefined;
  for (;;) {
    try {
      const { folders, files } = await entryNames(folder, await readdir(folder, { withFileTypes: true }), withCsv);
      const parent = path.dirname(folder);
      const toEntry = (name: string) => ({ name, path: path.join(folder, name) });
      return {
        path: folder,
        parent: parent === folder ? null : parent,
        entries: folders.slice(0, MAX_ENTRIES).map(toEntry),
        ...(withCsv && { files: files.slice(0, MAX_ENTRIES).map(toEntry) }),
        truncated: folders.length > MAX_ENTRIES || files.length > MAX_ENTRIES,
        message,
      };
    } catch (error) {
      const parent = path.dirname(folder);
      const code = errorCode(error);
      if ((code !== 'ENOENT' && code !== 'ENOTDIR') || parent === folder) {
        return { path: folder, parent: parent === folder ? null : parent, entries: [], truncated: false, message: copyErrorMessage(error) };
      }
      message ??= `${folder} isn’t an existing folder, so its nearest existing parent is shown.`;
      folder = parent;
    }
  }
}
