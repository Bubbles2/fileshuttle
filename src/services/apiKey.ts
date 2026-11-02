/**
 * The server prints a launch link ending in "#key=…". The key never leaves this
 * origin: the "#" part isn't sent to servers, and localStorage is scoped to
 * this exact host and port (unlike cookies, which other localhost ports share).
 */
const STORAGE_KEY = 'fileshuttle.apiKey';
const KEY_IN_HASH = /(?:^#|&)key=([A-Za-z0-9_-]{16,128})(?:&|$)/;

let keyFromLink: string | null = null;

/** Picks the key out of the launch link, remembers it, and removes it from the address bar. Returns true if found. */
export function captureLaunchKey(location: Location = window.location, history: History = window.history): boolean {
  const match = KEY_IN_HASH.exec(location.hash);
  if (!match?.[1]) return false;
  keyFromLink = match[1];
  try {
    localStorage.setItem(STORAGE_KEY, keyFromLink);
  } catch {
    // Storage blocked: the key still works for this page load.
  }
  history.replaceState(null, '', `${location.pathname}${location.search}`);
  return true;
}

export function readApiKey(): string | null {
  if (keyFromLink) return keyFromLink;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
