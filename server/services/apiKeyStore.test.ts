import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadOrCreateApiKey } from './apiKeyStore.ts';

let dir: string;
let file: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), 'fileshuttle-key-'));
  file = path.join(dir, 'nested', 'api-key');
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('loadOrCreateApiKey', () => {
  it('creates a 256-bit key and reuses it on the next start', async () => {
    const first = loadOrCreateApiKey(false, file);
    const second = loadOrCreateApiKey(false, file);

    expect(first.source).toBe('new');
    expect(first.key).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second).toEqual({ key: first.key, source: 'existing' });
    expect(await readFile(file, 'utf8')).toBe(first.key);
  });

  it('issues a different key when asked to rotate', () => {
    const first = loadOrCreateApiKey(false, file);
    const rotated = loadOrCreateApiKey(true, file);

    expect(rotated.source).toBe('new');
    expect(rotated.key).not.toBe(first.key);
    expect(loadOrCreateApiKey(false, file).key).toBe(rotated.key);
  });

  it('replaces a damaged key file', async () => {
    loadOrCreateApiKey(false, file);
    await writeFile(file, 'not a key');

    const repaired = loadOrCreateApiKey(false, file);
    expect(repaired.source).toBe('new');
    expect(repaired.key).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('falls back to a key held in memory when it cannot be saved', async () => {
    const blocker = path.join(dir, 'a-file');
    await writeFile(blocker, '');

    const result = loadOrCreateApiKey(false, path.join(blocker, 'api-key'));
    expect(result.source).toBe('memory');
    expect(result.key).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});
