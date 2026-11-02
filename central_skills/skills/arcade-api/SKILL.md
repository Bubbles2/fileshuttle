---
name:arcade_api
description: Create reusable JavaScript or TypeScript service modules that connect UI components to authenticated Arcade HTTP APIs.
---

## Purpose
Create reusable JavaScript or TypeScript service modules that connect UI components to authenticated Arcade HTTP APIs.

## When to use
Use this skill when a component needs to call an API that requires:
- a configurable base URL
- user credentials or auth tokens
- reusable headers
- consistent error handling
- named endpoint functions

## Pattern

Separate the API logic into four steps:

1. **Load configuration**
   - Read the server URL from config, storage, or environment.
   - Throw a clear error if it is missing.

2. **Build authentication**
   - Convert credentials or tokens into request headers.
   - Keep auth logic separate from endpoint logic.

3. **Compose requests**
   - Combine the base URL with endpoint paths.
   - Use one shared request helper where possible.

4. **Expose endpoint functions**
   - Create small functions such as `fetchStatus`, `searchItems`, or `getDocument`.
   - Return only the useful response data.

## Template

```ts
import axios from 'axios';

async function loadBaseUrl(): Promise<string> {
  const baseUrl = await loadUrlSomehow();

  if (!baseUrl) {
    throw new Error('No server URL configured.');
  }

  return baseUrl;
}

function buildHeaders(user: string, password: string): Record<string, string> {
  const encoded = base64Encode(`${user}:${password}`);

  return {
    Authorization: `Basic ${encoded}`,
  };
}

async function buildRequestContext(user: string, password: string) {
  const baseUrl = await loadBaseUrl();

  return {
    baseUrl,
    headers: buildHeaders(user, password),
  };
}

async function get<T>(
  path: string,
  user: string,
  password: string,
): Promise<T> {
  const { baseUrl, headers } = await buildRequestContext(user, password);
  const response = await axios.get(`${baseUrl}${path}`, { headers });
  return response.data;
}

export async function fetchStatus(user: string, password: string) {
  const data = await get<any>('/health/status', user, password);
  return data.ServerStatus;
}

## Rules
Do not put raw API calls directly in UI components.
Do not duplicate header-building logic across endpoints.
Do not hardcode the base URL inside endpoint functions.
Keep endpoint functions small and named by intent.
Throw user-readable errors for missing configuration.
Return clean data shapes that components can render directly.