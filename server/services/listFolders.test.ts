import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { listFolders, listStartingPlaces } from './listFolders.ts';

let root: string;

beforeAll(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'fileshuttle-folders-'));
  for (const name of ['beta', 'Alpha', 'item 10', 'item 2', '.claude', '$Recycle.Bin']) {
    await mkdir(path.join(root, name));
  }
  await writeFile(path.join(root, 'notes.txt'), 'files are never listed');
  await symlink(path.join(root, 'beta'), path.join(root, 'linked'), 'junction');
  // CSV files (and look-alikes) for the CSV browser.
  await mkdir(path.join(root, 'beta', 'archive.csv'));
  for (const name of ['Skills.CSV', 'agents.csv', 'item 10.csv', 'item 2.csv', 'notes.csv.txt', 'readme.md']) {
    await writeFile(path.join(root, 'beta', name), '');
  }
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('listFolders', () => {
  it('lists only folders, including linked ones, sorted naturally and without system folders', async () => {
    const listing = await listFolders(root, false);

    expect(listing.path).toBe(root);
    expect(listing.parent).toBe(path.dirname(root));
    expect(listing.entries.map((entry) => entry.name)).toEqual(['.claude', 'Alpha', 'beta', 'item 2', 'item 10', 'linked']);
    expect(listing.entries[0]).toEqual({ name: '.claude', path: path.join(root, '.claude') });
    expect(listing.truncated).toBe(false);
  });

  it('adds only CSV files, sorted naturally, when asked; a folder named like a CSV stays a folder', async () => {
    const listing = await listFolders(path.join(root, 'beta'), false, true);

    expect(listing.entries.map((entry) => entry.name)).toEqual(['archive.csv']);
    expect(listing.files?.map((file) => file.name)).toEqual(['agents.csv', 'item 2.csv', 'item 10.csv', 'Skills.CSV']);
    expect(listing.files?.[0]).toEqual({ name: 'agents.csv', path: path.join(root, 'beta', 'agents.csv') });
  });

  it('leaves files out unless asked', async () => {
    expect((await listFolders(path.join(root, 'beta'), false)).files).toBeUndefined();
  });

  it('shows the nearest existing parent for a folder that does not exist yet', async () => {
    const listing = await listFolders(path.join(root, 'beta', 'new', 'deeper'), false);

    expect(listing.path).toBe(path.join(root, 'beta'));
    expect(listing.message).toContain('isn’t an existing folder');
  });

  it('shows the containing folder when given a file', async () => {
    const listing = await listFolders(path.join(root, 'notes.txt'), false);
    expect(listing.path).toBe(root);
  });

  it('refuses relative paths', async () => {
    const listing = await listFolders('relative\\folder', false);
    expect(listing).toMatchObject({ path: null, entries: [], message: expect.stringContaining('full path') as unknown });
  });

  it.runIf(process.platform === 'win32')('does not touch network folders unless they are allowed', async () => {
    const listing = await listFolders('\\\\192.0.2.1\\share', false);
    expect(listing.message).toContain('--allow-network-paths');
  });
});

describe('listStartingPlaces', () => {
  it('offers the home folder and at least one drive or root', async () => {
    const places = await listStartingPlaces();

    expect(places.path).toBeNull();
    expect(places.entries[0]?.path).toBe(os.homedir());
    expect(places.entries.length).toBeGreaterThan(1);
  });
});
