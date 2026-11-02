import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { inspectPaths as inspectPathsWith } from './inspectPaths.ts';

const inspectPaths = (paths: string[]) => inspectPathsWith(paths, false);

let root: string;

beforeAll(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'fileshuttle-inspect-'));
  await mkdir(path.join(root, 'folder'));
  await writeFile(path.join(root, 'file.txt'), 'x');
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('inspectPaths', () => {
  it('classifies files, folders, missing and relative paths, keeping input order', async () => {
    const paths = [path.join(root, 'file.txt'), path.join(root, 'folder'), path.join(root, 'nope'), 'relative\\file.txt'];

    expect(await inspectPaths(paths)).toEqual([
      { path: paths[0], kind: 'file' },
      { path: paths[1], kind: 'folder' },
      { path: paths[2], kind: 'missing' },
      { path: paths[3], kind: 'missing' },
    ]);
  });

  it('handles more paths than one concurrent batch', async () => {
    const paths = Array.from({ length: 70 }, (_, i) => path.join(root, i % 2 ? 'file.txt' : `missing-${i}`));
    const results = await inspectPaths(paths);
    expect(results).toHaveLength(70);
    expect(results.filter((r) => r.kind === 'file')).toHaveLength(35);
  });
});
