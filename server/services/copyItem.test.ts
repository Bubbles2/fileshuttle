import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { CopyRequest } from '../../shared/api.ts';
import { copyItem as copyItemWith, isSameOrInside, nextFreeName } from './copyItem.ts';

const copyItem = (request: CopyRequest) => copyItemWith(request, { allowNetworkPaths: false });

let root: string;
let source: string;
let destination: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'fileshuttle-copy-'));
  source = path.join(root, 'source');
  destination = path.join(root, 'export', 'client');
  await mkdir(path.join(source, 'logos', 'svg'), { recursive: true });
  await writeFile(path.join(source, 'report.xlsx'), 'new report');
  await writeFile(path.join(source, 'logos', 'a.svg'), 'a');
  await writeFile(path.join(source, 'logos', 'svg', 'b.svg'), 'b');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('copyItem', () => {
  it('copies a file and creates the destination folder', async () => {
    const result = await copyItem({ source: path.join(source, 'report.xlsx'), destination, policy: 'skip' });

    expect(result).toEqual({ outcome: 'copied', target: path.join(destination, 'report.xlsx') });
    expect(await readFile(path.join(destination, 'report.xlsx'), 'utf8')).toBe('new report');
  });

  it('copies a folder recursively', async () => {
    const result = await copyItem({ source: path.join(source, 'logos'), destination, policy: 'skip' });

    expect(result.outcome).toBe('copied');
    expect(await readFile(path.join(destination, 'logos', 'svg', 'b.svg'), 'utf8')).toBe('b');
  });

  describe('when the target already exists', () => {
    beforeEach(async () => {
      await mkdir(destination, { recursive: true });
      await writeFile(path.join(destination, 'report.xlsx'), 'old report');
    });

    it('skips it with "skip"', async () => {
      const result = await copyItem({ source: path.join(source, 'report.xlsx'), destination, policy: 'skip' });

      expect(result).toMatchObject({ outcome: 'skipped', message: 'Already exists in the destination' });
      expect(await readFile(path.join(destination, 'report.xlsx'), 'utf8')).toBe('old report');
    });

    it('replaces it with "overwrite"', async () => {
      const result = await copyItem({ source: path.join(source, 'report.xlsx'), destination, policy: 'overwrite' });

      expect(result.outcome).toBe('copied');
      expect(await readFile(path.join(destination, 'report.xlsx'), 'utf8')).toBe('new report');
    });

    it('keeps both with "rename"', async () => {
      const first = await copyItem({ source: path.join(source, 'report.xlsx'), destination, policy: 'rename' });
      const second = await copyItem({ source: path.join(source, 'report.xlsx'), destination, policy: 'rename' });

      expect(first).toEqual({ outcome: 'copied', target: path.join(destination, 'report (1).xlsx') });
      expect(second).toEqual({ outcome: 'copied', target: path.join(destination, 'report (2).xlsx') });
      expect((await readdir(destination)).sort()).toEqual(['report (1).xlsx', 'report (2).xlsx', 'report.xlsx']);
    });

    it('merges folders with "overwrite" without deleting existing files', async () => {
      await mkdir(path.join(destination, 'logos'), { recursive: true });
      await writeFile(path.join(destination, 'logos', 'keep.svg'), 'keep');

      const result = await copyItem({ source: path.join(source, 'logos'), destination, policy: 'overwrite' });

      expect(result.outcome).toBe('copied');
      expect((await readdir(path.join(destination, 'logos'))).sort()).toEqual(['a.svg', 'keep.svg', 'svg']);
    });

    it('refuses to overwrite a file with a folder', async () => {
      await writeFile(path.join(destination, 'logos'), 'a file named logos');

      const result = await copyItem({ source: path.join(source, 'logos'), destination, policy: 'overwrite' });

      expect(result).toMatchObject({ outcome: 'failed', message: 'A file and a folder share this name' });
    });
  });

  it('reports a missing source', async () => {
    const result = await copyItem({ source: path.join(source, 'nope.txt'), destination, policy: 'skip' });
    expect(result).toEqual({ outcome: 'failed', message: 'Not found on disk' });
  });

  it('refuses relative paths', async () => {
    const result = await copyItem({ source: 'report.xlsx', destination, policy: 'skip' });
    expect(result.outcome).toBe('failed');
  });

  it('refuses to copy a folder into itself', async () => {
    const result = await copyItem({
      source: path.join(source, 'logos'),
      destination: path.join(source, 'logos', 'svg'),
      policy: 'rename',
    });
    expect(result).toEqual({ outcome: 'failed', message: 'The destination is inside this folder' });
  });

  it('refuses to overwrite an item with itself', async () => {
    const result = await copyItem({ source: path.join(source, 'report.xlsx'), destination: source, policy: 'overwrite' });
    expect(result).toMatchObject({ outcome: 'failed', message: 'The item is already in the destination' });
  });

  it('reports a destination that is a file as a safe message', async () => {
    const result = await copyItem({
      source: path.join(source, 'report.xlsx'),
      destination: path.join(source, 'report.xlsx'),
      policy: 'skip',
    });
    expect(result.outcome).toBe('failed');
    expect(result.message).not.toMatch(/ENOTDIR|EEXIST|at /);
  });
});

describe('copyItem with a new name', () => {
  it('copies a file under the requested name', async () => {
    const result = await copyItem({ source: path.join(source, 'report.xlsx'), destination, policy: 'skip', targetName: 'report.toml' });

    expect(result).toEqual({ outcome: 'copied', target: path.join(destination, 'report.toml') });
    expect(await readFile(path.join(destination, 'report.toml'), 'utf8')).toBe('new report');
  });

  it('numbers the new name with "Keep both"', async () => {
    await copyItem({ source: path.join(source, 'report.xlsx'), destination, policy: 'skip', targetName: 'agent.toml' });
    const second = await copyItem({ source: path.join(source, 'report.xlsx'), destination, policy: 'rename', targetName: 'agent.toml' });
    expect(second.target).toBe(path.join(destination, 'agent (1).toml'));
  });

  it.runIf(process.platform === 'win32')('refuses names Windows reserves', async () => {
    const result = await copyItem({ source: path.join(source, 'report.xlsx'), destination, policy: 'skip', targetName: 'CON.toml' });
    expect(result.outcome).toBe('failed');
  });
});

describe('copyItem safety checks', () => {
  it('refuses a destination that reaches the source folder through a junction or link', async () => {
    const link = path.join(root, 'alias');
    await symlink(path.join(source, 'logos'), link, 'junction');

    const result = await copyItem({ source: path.join(source, 'logos'), destination: path.join(link, 'svg', 'deeper'), policy: 'skip' });

    expect(result).toEqual({ outcome: 'failed', message: 'The destination is inside this folder' });
    await expect(readdir(path.join(source, 'logos', 'svg'))).resolves.toEqual(['b.svg']);
  });

  it('refuses to copy a whole drive or filesystem root', async () => {
    const result = await copyItem({ source: path.parse(root).root, destination, policy: 'skip' });
    expect(result.message).toContain('whole drive');
  });

  it.runIf(process.platform === 'win32')('refuses destinations Explorer could not delete', async () => {
    for (const bad of ['NUL', 'typo.', 'trailing ', 'COM1.txt']) {
      const result = await copyItem({ source: path.join(source, 'report.xlsx'), destination: path.join(root, bad), policy: 'skip' });
      expect(result.outcome).toBe('failed');
    }
    await expect(readdir(root)).resolves.toEqual(['source']);
  });

  it.runIf(process.platform === 'win32')('refuses network paths unless they are allowed', async () => {
    const result = await copyItem({ source: '\\\\127.0.0.1\\share\\a.txt', destination, policy: 'skip' });
    expect(result.message).toContain('--allow-network-paths');
  });
});

describe('isSameOrInside', () => {
  it('detects nested paths without being fooled by similar names', () => {
    expect(isSameOrInside(path.join(root, 'a', 'b'), path.join(root, 'a'))).toBe(true);
    expect(isSameOrInside(path.join(root, 'a'), path.join(root, 'a'))).toBe(true);
    expect(isSameOrInside(path.join(root, 'ab'), path.join(root, 'a'))).toBe(false);
    expect(isSameOrInside(path.join(root, '..a'), path.join(root, 'a'))).toBe(false);
    expect(isSameOrInside(path.join(root, 'a'), path.join(root, 'a', 'b'))).toBe(false);
  });
});

describe('nextFreeName', () => {
  it('numbers names before the extension, and handles names without one', async () => {
    await mkdir(destination, { recursive: true });
    await writeFile(path.join(destination, 'notes (1)'), '');

    expect(await nextFreeName(destination, 'report.xlsx')).toBe(path.join(destination, 'report (1).xlsx'));
    expect(await nextFreeName(destination, 'notes')).toBe(path.join(destination, 'notes (2)'));
  });
});
