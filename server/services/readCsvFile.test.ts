import { mkdir, mkdtemp, rm, truncate, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CSV_TOO_LARGE, MAX_CSV_BYTES } from '../../shared/api.ts';
import { readCsvFile } from './readCsvFile.ts';

let root: string;

beforeAll(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'fileshuttle-csv-'));
  await writeFile(path.join(root, 'skills.CSV'), 'Skill,Description,Central copy\r\n');
  await writeFile(path.join(root, 'notes.txt'), 'not a CSV');
  await mkdir(path.join(root, 'folder.csv'));
  await writeFile(path.join(root, 'huge.csv'), '');
  await truncate(path.join(root, 'huge.csv'), MAX_CSV_BYTES + 1);
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('readCsvFile', () => {
  it('reads a CSV file as raw bytes, whatever the extension’s case', async () => {
    const result = await readCsvFile(path.join(root, 'skills.CSV'), false);
    expect(result.ok && result.bytes.toString('utf8')).toBe('Skill,Description,Central copy\r\n');
  });

  it('refuses files that are not .csv', async () => {
    expect(await readCsvFile(path.join(root, 'notes.txt'), false)).toEqual({ ok: false, status: 400, message: 'Only .csv files can be opened.' });
  });

  it('refuses a folder named like a CSV', async () => {
    expect(await readCsvFile(path.join(root, 'folder.csv'), false)).toEqual({ ok: false, status: 400, message: 'folder.csv is not a file.' });
  });

  it('refuses CSVs over 5 MB without reading them', async () => {
    expect(await readCsvFile(path.join(root, 'huge.csv'), false)).toEqual({ ok: false, status: 413, message: CSV_TOO_LARGE });
  });

  it('explains a missing file without exposing error details', async () => {
    expect(await readCsvFile(path.join(root, 'missing.csv'), false)).toEqual({ ok: false, status: 404, message: 'missing.csv: Not found on disk' });
  });

  it('refuses relative paths', async () => {
    expect(await readCsvFile('skills.csv', false)).toMatchObject({ ok: false, status: 400, message: expect.stringContaining('full path') as unknown });
  });

  it.runIf(process.platform === 'win32')('does not touch network files unless they are allowed', async () => {
    expect(await readCsvFile('\\\\192.0.2.1\\share\\skills.csv', false)).toMatchObject({ ok: false, message: expect.stringContaining('--allow-network-paths') as unknown });
  });
});
