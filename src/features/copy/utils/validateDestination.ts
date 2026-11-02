import { MAX_PATH_LENGTH } from '../../../../shared/api.ts';
import { isAbsolutePath, isWindowsPath } from '../../../utils/paths';

const FORBIDDEN_CHARS = /[<>:"|?*]/;
const RESERVED_NAME = /^(?:CON|PRN|AUX|NUL|COM[0-9¹²³]|LPT[0-9¹²³])(?:\..*)?$/i;
/** `\\?\C:\…` and `\\?\UNC\server\share\…` — Windows long-path prefixes. */
const LONG_PATH_PREFIX = /^\\\\\?\\(?:UNC\\)?/i;

/** Folder names after the drive ("C:") or share ("\\server\share") part. */
function windowsFolderNames(value: string): string[] {
  const isUnc = value.startsWith('\\\\') && !/^\\\\\?\\[A-Za-z]:/.test(value);
  const parts = value.replace(LONG_PATH_PREFIX, '').split(/[\\/]+/).filter(Boolean);
  return parts.slice(isUnc ? 2 : 1);
}

/** Mirrors the server's rules for names Windows can create but Explorer can't delete. */
function windowsNameProblem(value: string): string | null {
  for (const name of windowsFolderNames(value)) {
    if (FORBIDDEN_CHARS.test(name)) return 'Folder names can’t contain < > : " | ? or *.';
    if (RESERVED_NAME.test(name)) return `“${name}” is a reserved name on Windows.`;
    if (/[. ]$/.test(name)) return 'Folder names can’t end with a dot or a space.';
  }
  return null;
}

/** Early feedback for the destination field. Returns an error message, or null when it looks usable. */
export function validateDestination(raw: string): string | null {
  const value = raw.trim();
  if (value === '') return 'Enter the folder to copy into.';
  if (value.length > MAX_PATH_LENGTH || value.includes('\0')) return 'This path is not valid.';
  if (!isAbsolutePath(value)) return 'Enter a full path, such as D:\\Export\\Client.';
  return isWindowsPath(value) ? windowsNameProblem(value) : null;
}
