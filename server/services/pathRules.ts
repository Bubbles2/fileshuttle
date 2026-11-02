import path from 'node:path';

export type PathClass = 'local' | 'network' | 'invalid';

const DEVICE_PREFIX = '\\\\.\\';
const LONG_PREFIX = '\\\\?\\';
const LONG_UNC = /^\\\\\?\\UNC\\/i;
const LONG_DRIVE = /^\\\\\?\\[A-Za-z]:\\/;
const UNC = /^\\\\[^\\]/;
const DRIVE = /^[A-Za-z]:\\/;

/**
 * Sorts a path into local, network (UNC — touching it makes Windows contact
 * another machine and send the user's credentials) or invalid (relative,
 * drive-relative like "\Windows", or a device path like "\\.\PhysicalDrive0").
 */
export function classifyPath(target: string, platform: NodeJS.Platform = process.platform): PathClass {
  if (platform !== 'win32') return path.posix.isAbsolute(target) ? 'local' : 'invalid';
  const p = target.replaceAll('/', '\\');
  if (p.startsWith(DEVICE_PREFIX)) return 'invalid';
  if (LONG_UNC.test(p)) return 'network';
  if (LONG_DRIVE.test(p)) return 'local';
  if (p.startsWith(LONG_PREFIX)) return 'invalid';
  if (UNC.test(p)) return 'network';
  return DRIVE.test(p) ? 'local' : 'invalid';
}

export function isUsablePath(target: string, allowNetworkPaths: boolean, platform: NodeJS.Platform = process.platform): boolean {
  const kind = classifyPath(target, platform);
  return kind === 'local' || (kind === 'network' && allowNetworkPaths);
}

const RESERVED_NAME = /^(?:CON|PRN|AUX|NUL|COM[0-9¹²³]|LPT[0-9¹²³])(?:\..*)?$/i;
const FORBIDDEN_CHARS = /[<>:"|?*]/;

/** "\\?\C:\x" → "C:\x" and "\\?\UNC\server\share" → "\\server\share". */
function stripLongPathPrefix(p: string): string {
  if (LONG_UNC.test(p)) return `\\\\${p.slice(`${LONG_PREFIX}UNC\\`.length)}`;
  if (p.startsWith(LONG_PREFIX)) return p.slice(LONG_PREFIX.length);
  return p;
}

/**
 * Windows lets long-path APIs create folders that Explorer can't delete
 * ("NUL", "report.", "name "). Returns a message for the first bad folder name.
 */
export function windowsFolderNameProblem(folder: string, platform: NodeJS.Platform = process.platform): string | null {
  if (platform !== 'win32') return null;
  const normalized = stripLongPathPrefix(folder.replaceAll('/', '\\'));
  const { root } = path.win32.parse(normalized);
  const names = normalized.slice(root.length).split('\\').filter(Boolean);
  for (const name of names) {
    if (name === '.' || name === '..') continue;
    if (RESERVED_NAME.test(name)) return `“${name}” is a reserved name on Windows`;
    if (/[. ]$/.test(name)) return `Folder names can’t end with a dot or a space (“${name}”)`;
    if (FORBIDDEN_CHARS.test(name)) return `“${name}” contains a character Windows doesn’t allow`;
  }
  return null;
}
