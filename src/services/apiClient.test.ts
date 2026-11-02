import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiError, postForBytes, postJson, SERVER_UNREACHABLE } from './apiClient';

const schema = z.object({ ok: z.boolean() });

function respond(body: unknown, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status }))),
  );
}

describe('postJson', () => {
  it('returns data that matches the schema', async () => {
    respond({ ok: true });
    await expect(postJson('/api/x', {}, schema)).resolves.toEqual({ ok: true });
  });

  it('rejects responses that do not match the schema', async () => {
    respond({ ok: 'yes', injected: '<script>' });
    await expect(postJson('/api/x', {}, schema)).rejects.toThrow('unexpected response');
  });

  it('surfaces the server error message with its status', async () => {
    respond({ error: 'Send a JSON body' }, 415);
    const error: unknown = await postJson('/api/x', {}, schema).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: 'Send a JSON body', status: 415 });
  });

  it('uses a generic message when the error body is not recognised', async () => {
    respond('nope', 500);
    await expect(postJson('/api/x', {}, schema)).rejects.toThrow('Request failed (500)');
  });

  it('explains network failures', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));
    await expect(postJson('/api/x', {}, schema)).rejects.toThrow(SERVER_UNREACHABLE);
  });
});

describe('postForBytes', () => {
  it('returns the raw response bytes', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(new Uint8Array([0x53, 0x6b, 0xe9])))));
    expect(new Uint8Array(await postForBytes('/api/x', {}))).toEqual(new Uint8Array([0x53, 0x6b, 0xe9]));
  });

  it('surfaces the server error message with its status', async () => {
    respond({ error: 'Only .csv files can be opened.' }, 400);
    const error: unknown = await postForBytes('/api/x', {}).catch((e: unknown) => e);
    expect(error).toMatchObject({ message: 'Only .csv files can be opened.', status: 400 });
  });
});
