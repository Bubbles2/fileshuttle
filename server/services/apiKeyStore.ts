import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const KEY_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** %APPDATA%\FileShuttle\api-key on Windows, ~/.config/fileshuttle/api-key elsewhere — inside the user's own profile. */
export function defaultKeyFile(): string {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'), 'FileShuttle', 'api-key');
  }
  return path.join(process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), '.config'), 'fileshuttle', 'api-key');
}

export interface StoredKey {
  key: string;
  /** "new": just created; "existing": reused from an earlier run; "memory": couldn't be saved, valid until restart. */
  source: 'new' | 'existing' | 'memory';
}

/**
 * Reuses the API key from earlier runs so the launch link only has to be opened
 * once per browser. The file is readable only by its owner. `rotate` issues a
 * new key, which signs out every browser that used the old one.
 */
export function loadOrCreateApiKey(rotate: boolean, file: string = defaultKeyFile()): StoredKey {
  if (!rotate) {
    try {
      const existing = readFileSync(file, 'utf8').trim();
      if (KEY_PATTERN.test(existing)) return { key: existing, source: 'existing' };
    } catch {
      // No saved key yet: create one below.
    }
  }

  const key = randomBytes(32).toString('base64url');
  try {
    mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    writeFileSync(file, key, { mode: 0o600 });
    return { key, source: 'new' };
  } catch {
    return { key, source: 'memory' };
  }
}
