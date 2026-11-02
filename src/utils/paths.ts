/**
 * Display helpers for Windows and POSIX paths. The server is the authority on
 * real paths; these only format previews and give early feedback.
 */

const WINDOWS_DRIVE = /^[A-Za-z]:[\\/]/;
const WINDOWS_UNC = /^\\\\[^\\/]+[\\/][^\\/]+/;

export function baseName(location: string): string {
  const parts = location.split(/[\\/]+/).filter(Boolean);
  return parts.at(-1) ?? location;
}

export function isAbsolutePath(location: string): boolean {
  return WINDOWS_DRIVE.test(location) || WINDOWS_UNC.test(location) || location.startsWith('/');
}

export function isWindowsPath(location: string): boolean {
  return WINDOWS_DRIVE.test(location) || location.startsWith('\\\\');
}

function separatorFor(folder: string): '/' | '\\' {
  return folder.includes('/') && !folder.includes('\\') ? '/' : '\\';
}

/** Joins a folder and a name with the folder's own separator style. */
export function joinPath(folder: string, name: string): string {
  const separator = separatorFor(folder);
  return `${folder.replace(/[\\/]+$/, '')}${separator}${name}`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
