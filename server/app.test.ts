import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { API_KEY_HEADER } from '../shared/api.ts';
import { createApp } from './app.ts';

const API_KEY = 'test-key-0123456789abcdef';

let server: http.Server;
let port: number;
let root: string;

interface RawResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: unknown;
}

interface SendOptions {
  method?: string;
  path?: string;
  headers?: Record<string, string>;
  body?: string;
  /** Defaults to the main test app, which requires the key. */
  port?: number;
}

function send(options: SendOptions): Promise<RawResponse> {
  const { method = 'POST', path: urlPath = '/api/inspect', body } = options;
  const target = options.port ?? port;
  const headers: Record<string, string> = {
    Host: `localhost:${target}`,
    Origin: `http://localhost:${target}`,
    'Content-Type': 'application/json',
    [API_KEY_HEADER]: API_KEY,
    ...options.headers,
  };
  for (const key of Object.keys(headers)) if (headers[key] === '') Reflect.deleteProperty(headers, key);

  return new Promise((resolve, reject) => {
    const request = http.request({ host: '127.0.0.1', port: target, method, path: urlPath, headers }, (response) => {
      let text = '';
      response.on('data', (chunk: Buffer) => (text += chunk.toString()));
      response.on('end', () => {
        let parsed: unknown = text;
        try {
          parsed = JSON.parse(text);
        } catch {
          // Plain-text body.
        }
        resolve({ status: response.statusCode ?? 0, headers: response.headers, body: parsed });
      });
    });
    request.on('error', reject);
    if (body !== undefined) request.write(body);
    request.end();
  });
}

beforeAll(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'fileshuttle-api-'));
  await writeFile(path.join(root, 'a.txt'), 'hello');
  await writeFile(path.join(root, 'list.csv'), 'Skill,Description,Central copy\r\n');
  server = http.createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = (server.address() as AddressInfo).port;
  server.on('request', createApp({ port, mode: 'production', apiKey: API_KEY, allowNetworkPaths: false }));
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(root, { recursive: true, force: true });
});

describe('POST /api/inspect', () => {
  it('reports what each path is', async () => {
    const response = await send({ body: JSON.stringify({ paths: [path.join(root, 'a.txt'), path.join(root, 'b.txt')] }) });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      results: [
        { path: path.join(root, 'a.txt'), kind: 'file' },
        { path: path.join(root, 'b.txt'), kind: 'missing' },
      ],
    });
  });

  it.each([
    ['an empty list', { paths: [] }],
    ['too many paths', { paths: Array.from({ length: 501 }, (_, i) => `C:\\${i}`) }],
    ['a NUL byte', { paths: ['C:\\a\0b'] }],
    ['unexpected fields', { paths: ['C:\\a'], extra: true }],
    ['a wrong type', { paths: 'C:\\a' }],
  ])('rejects %s', async (_label, payload) => {
    const response = await send({ body: JSON.stringify(payload) });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Send between 1 and 500 valid paths' });
  });
});

describe('POST /api/copy', () => {
  it('copies a file', async () => {
    const destination = path.join(root, 'out');
    const response = await send({
      path: '/api/copy',
      body: JSON.stringify({ source: path.join(root, 'a.txt'), destination, policy: 'skip' }),
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ outcome: 'copied', target: path.join(destination, 'a.txt') });
    expect(await readFile(path.join(destination, 'a.txt'), 'utf8')).toBe('hello');
  });

  it('rejects an unknown policy', async () => {
    const response = await send({
      path: '/api/copy',
      body: JSON.stringify({ source: path.join(root, 'a.txt'), destination: root, policy: 'delete' }),
    });
    expect(response.status).toBe(400);
  });
});

describe('POST /api/folders', () => {
  it('lists sub-folders, never files', async () => {
    const response = await send({ path: '/api/folders', body: JSON.stringify({ path: root }) });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ path: root, entries: [{ name: 'out', path: path.join(root, 'out') }] });
  });

  it('lists the starting places for null', async () => {
    const response = await send({ path: '/api/folders', body: JSON.stringify({ path: null }) });
    expect(response.body).toMatchObject({ path: null, parent: null });
  });

  it('adds the CSV files when asked', async () => {
    const response = await send({ path: '/api/folders', body: JSON.stringify({ path: root, files: 'csv' }) });
    expect(response.body).toMatchObject({ path: root, files: [{ name: 'list.csv', path: path.join(root, 'list.csv') }] });
  });

  it('opens the folder FileShuttle was started from for start "working-folder"', async () => {
    const response = await send({ path: '/api/folders', body: JSON.stringify({ path: null, start: 'working-folder', files: 'csv' }) });
    expect(response.body).toMatchObject({ path: process.cwd() });
  });

  it.each([
    ['a missing path field', {}],
    ['a NUL byte', { path: 'C:\\a\0b' }],
    ['unexpected fields', { path: null, recursive: true }],
    ['an unknown start', { path: null, start: 'C:\\' }],
    ['a file type other than CSV', { path: null, files: 'exe' }],
  ])('rejects %s', async (_label, payload) => {
    const response = await send({ path: '/api/folders', body: JSON.stringify(payload) });
    expect(response.status).toBe(400);
  });

  it('requires the API key', async () => {
    const response = await send({ path: '/api/folders', headers: { [API_KEY_HEADER]: '' }, body: JSON.stringify({ path: null }) });
    expect(response.status).toBe(401);
  });
});

describe('POST /api/csv-file', () => {
  it('answers with the raw bytes of a CSV file', async () => {
    const response = await send({ path: '/api/csv-file', body: JSON.stringify({ path: path.join(root, 'list.csv') }) });
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/octet-stream');
    expect(response.body).toBe('Skill,Description,Central copy\r\n');
  });

  it('refuses files that are not CSVs', async () => {
    const response = await send({ path: '/api/csv-file', body: JSON.stringify({ path: path.join(root, 'a.txt') }) });
    expect(response).toMatchObject({ status: 400, body: { error: 'Only .csv files can be opened.' } });
  });

  it('explains a missing CSV', async () => {
    const response = await send({ path: '/api/csv-file', body: JSON.stringify({ path: path.join(root, 'gone.csv') }) });
    expect(response).toMatchObject({ status: 404, body: { error: 'gone.csv: Not found on disk' } });
  });

  it.each([
    ['a null path', { path: null }],
    ['extra fields', { path: 'C:\\a.csv', encoding: 'utf8' }],
  ])('rejects %s', async (_label, payload) => {
    const response = await send({ path: '/api/csv-file', body: JSON.stringify(payload) });
    expect(response).toMatchObject({ status: 400, body: { error: 'Send the path of a .csv file' } });
  });

  it('requires the API key', async () => {
    const response = await send({ path: '/api/csv-file', headers: { [API_KEY_HEADER]: '' }, body: JSON.stringify({ path: path.join(root, 'list.csv') }) });
    expect(response.status).toBe(401);
  });
});

describe('POST /api/guides', () => {
  it.each([
    ['an unknown guide', { name: 'secrets' }],
    ['a path instead of a name', { name: 'C:\\Windows\\win.ini' }],
    ['extra fields', { name: 'claude', path: 'C:\\x.md' }],
  ])('rejects %s', async (_label, payload) => {
    const response = await send({ path: '/api/guides', body: JSON.stringify(payload) });
    expect(response.status).toBe(400);
  });
});

describe('request hardening', () => {
  const validBody = JSON.stringify({ paths: ['C:\\a'] });

  it('rejects requests addressed to another host name (DNS rebinding)', async () => {
    const response = await send({ headers: { Host: `evil.example:${port}` }, body: validBody });
    expect(response.status).toBe(421);
  });

  it('rejects cross-origin requests', async () => {
    const response = await send({ headers: { Origin: 'https://evil.example' }, body: validBody });
    expect(response.status).toBe(403);
  });

  it('rejects POSTs without an Origin header', async () => {
    const response = await send({ headers: { Origin: '' }, body: validBody });
    expect(response.status).toBe(403);
  });

  it('rejects cross-site fetch metadata', async () => {
    const response = await send({ headers: { 'Sec-Fetch-Site': 'cross-site' }, body: validBody });
    expect(response.status).toBe(403);
  });

  it('rejects bodies that are not JSON (blocks simple form posts)', async () => {
    const response = await send({ headers: { 'Content-Type': 'text/plain' }, body: validBody });
    expect(response.status).toBe(415);
  });

  it('rejects malformed JSON without leaking details', async () => {
    const response = await send({ body: '{"paths": [' });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'The request could not be read' });
  });

  it('rejects oversized bodies', async () => {
    const response = await send({ body: JSON.stringify({ paths: ['x'.repeat(4 * 1024 * 1024)] }) });
    expect(response.status).toBe(413);
  });

  it('returns JSON 404s for unknown API routes', async () => {
    const response = await send({ path: '/api/delete', body: validBody });
    expect(response.status).toBe(404);
  });

  it.each([
    ['no key', ''],
    ['a wrong key', 'test-key-0123456789abcdeX'],
    ['a key of another length', 'short'],
  ])('rejects API calls with %s (other programs on this machine)', async (_label, key) => {
    const response = await send({ headers: { [API_KEY_HEADER]: key }, body: validBody });
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ error: expect.stringContaining('link shown in the terminal') as unknown });
  });

  it('rejects an Origin that does not match the Host it was sent to', async () => {
    const response = await send({ headers: { Origin: `http://127.0.0.1:${port}` }, body: validBody });
    expect(response.status).toBe(403);
  });

  it('blocks same-site subresource requests to any route, but allows navigations', async () => {
    const image = await send({
      method: 'GET',
      path: '/',
      headers: { Origin: '', 'Content-Type': '', 'Sec-Fetch-Site': 'same-site', 'Sec-Fetch-Mode': 'no-cors' },
    });
    expect(image.status).toBe(403);

    const navigation = await send({
      method: 'GET',
      path: '/',
      headers: { Origin: '', 'Content-Type': '', 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Mode': 'navigate' },
    });
    expect(navigation.status).not.toBe(403);
  });

  it('blocks the dev server open-in-editor endpoint', async () => {
    const response = await send({ method: 'GET', path: '/__open-in-editor?file=C:/Windows/win.ini', headers: { Origin: '' } });
    expect(response.status).toBe(404);
  });

  it('does not touch network paths unless they are allowed', async () => {
    const response = await send({ body: JSON.stringify({ paths: ['\\\\192.0.2.1\\share\\a.txt'] }) });
    const expected = process.platform === 'win32' ? 'network' : 'missing';
    expect(response.body).toEqual({ results: [{ path: '\\\\192.0.2.1\\share\\a.txt', kind: expected }] });
  });

  it('allows same-origin reads and sets security headers', async () => {
    const response = await send({ method: 'GET', path: '/api/health', headers: { Origin: '', 'Content-Type': '' } });
    expect(response.status).toBe(200);
    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(response.headers['content-security-policy']).not.toContain('unsafe-inline');
    expect(response.headers['content-security-policy']).not.toContain('data:');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});

describe('default mode (no --require-key)', () => {
  let openServer: http.Server;
  let openPort: number;

  beforeAll(async () => {
    openServer = http.createServer();
    await new Promise<void>((resolve) => openServer.listen(0, '127.0.0.1', resolve));
    openPort = (openServer.address() as AddressInfo).port;
    openServer.on('request', createApp({ port: openPort, mode: 'production', apiKey: null, allowNetworkPaths: false }));
  });

  afterAll(async () => {
    await new Promise((resolve) => openServer.close(resolve));
  });

  it('answers the API without any key', async () => {
    const health = await send({ port: openPort, method: 'GET', path: '/api/health', headers: { [API_KEY_HEADER]: '', Origin: '', 'Content-Type': '' } });
    const folders = await send({ port: openPort, path: '/api/folders', headers: { [API_KEY_HEADER]: '' }, body: JSON.stringify({ path: root }) });
    expect(health.status).toBe(200);
    expect(folders.status).toBe(200);
  });

  it('still blocks other websites, rebinding and non-JSON posts', async () => {
    const body = JSON.stringify({ paths: ['C:\\a'] });
    const noKey = { [API_KEY_HEADER]: '' };
    expect((await send({ port: openPort, headers: { ...noKey, Origin: 'https://evil.example' }, body })).status).toBe(403);
    expect((await send({ port: openPort, headers: { ...noKey, Host: `evil.example:${openPort}` }, body })).status).toBe(421);
    expect((await send({ port: openPort, headers: { ...noKey, 'Sec-Fetch-Site': 'cross-site' }, body })).status).toBe(403);
    expect((await send({ port: openPort, headers: { ...noKey, 'Content-Type': 'text/plain' }, body })).status).toBe(415);
  });
});
