import type { z } from 'zod';
import { API_KEY_HEADER, errorResponseSchema } from '../../shared/api.ts';
import { readApiKey } from './apiKey';
import { reportConnection } from './connection';

export const SERVER_UNREACHABLE = 'Could not reach the FileShuttle server. Check that it is still running.';

export class ApiError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** POSTs JSON to the local server; network failures and error statuses become an ApiError. */
async function post(url: string, body: unknown, signal?: AbortSignal): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const apiKey = readApiKey();
  if (apiKey) headers[API_KEY_HEADER] = apiKey;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    reportConnection('offline');
    throw new ApiError(SERVER_UNREACHABLE);
  }

  reportConnection(response.status === 401 ? 'needs-link' : 'connected');
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);
    const parsedError = errorResponseSchema.safeParse(data);
    throw new ApiError(parsedError.success ? parsedError.data.error : `Request failed (${response.status})`, response.status);
  }
  return response;
}

/** POSTs JSON to the local server and validates the response against `schema`. */
export async function postJson<T>(url: string, body: unknown, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
  const response = await post(url, body, signal);
  const data: unknown = await response.json().catch(() => null);
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new ApiError('The server sent an unexpected response.');
  return parsed.data;
}

/** POSTs JSON to the local server and returns the raw bytes it answers with (e.g. a CSV file). */
export async function postForBytes(url: string, body: unknown, signal?: AbortSignal): Promise<ArrayBuffer> {
  const response = await post(url, body, signal);
  return response.arrayBuffer();
}

export function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
