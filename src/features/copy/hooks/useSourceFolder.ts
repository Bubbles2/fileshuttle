import { useCallback, useState } from 'react';
import { DEFAULT_SOURCE_FOLDER } from '../../../app/defaults';

const STORAGE_KEY = 'fileshuttle.sourceFolder';
/** Earlier versions called this the base folder; reuse a value saved under that name. */
const LEGACY_KEY = 'fileshuttle.baseFolder';
/** central_skills moved from C:\AI_Donncha into C:\AI_Donncha\fileshuttle; folders remembered before that follow it. */
const OLD_LIBRARY_ROOT = /^C:\\AI_Donncha(?=\\?$|\\central_skills(?:\\|$))/i;

function readStored(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    return stored === null ? DEFAULT_SOURCE_FOLDER : stored.replace(OLD_LIBRARY_ROOT, 'C:\\AI_Donncha\\fileshuttle');
  } catch {
    return DEFAULT_SOURCE_FOLDER;
  }
}

/** The folder relative Central copy paths start from, remembered in this browser. */
export function useSourceFolder() {
  const [sourceFolder, setState] = useState(readStored);

  const setSourceFolder = useCallback((value: string) => {
    setState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // A convenience only; the folder still applies until the page is closed.
    }
  }, []);

  return [sourceFolder, setSourceFolder] as const;
}
