import { isAbsolutePath, joinPath } from '../../../utils/paths';

/** True when a central copy path (e.g. "central_skills\skills\docx") needs a folder to start from. */
export function isRelativeSource(location: string): boolean {
  return !isAbsolutePath(location);
}

function segments(path: string): string[] {
  return path.split(/[\\/]+/).filter(Boolean);
}

/** How many trailing folder names of `folder` repeat the leading names of `relative` (case-insensitive). */
function overlap(folder: string[], relative: string[]): number {
  for (let size = Math.min(folder.length, relative.length); size > 0; size -= 1) {
    const tail = folder.slice(-size).map((part) => part.toLowerCase());
    const head = relative.slice(0, size).map((part) => part.toLowerCase());
    if (tail.every((part, i) => part === head[i])) return size;
  }
  return 0;
}

/**
 * The full path of a skill folder. Relative central copies start from `sourceFolder`.
 * The folder may already include the start of the path: both C:\AI_Donncha\fileshuttle and
 * C:\AI_Donncha\fileshuttle\central_skills\skills give …\central_skills\skills\docx.
 */
export function resolveSource(location: string, sourceFolder: string): string {
  if (!isRelativeSource(location)) return location;
  const folder = sourceFolder.trim();
  const relative = segments(location.replace(/^\.[\\/]+/, ''));
  const rest = relative.slice(overlap(segments(folder), relative));
  return rest.reduce((path, part) => joinPath(path, part), folder);
}

export function validateSourceFolder(raw: string): string | null {
  const value = raw.trim();
  if (value === '') return 'Choose the folder your Central copy paths start from, e.g. C:\\AI_Donncha\\fileshuttle.';
  if (!isAbsolutePath(value)) return 'Enter a full path, such as C:\\AI_Donncha\\fileshuttle.';
  return null;
}
