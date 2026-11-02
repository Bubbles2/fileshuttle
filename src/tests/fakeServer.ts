import { vi } from 'vitest';
import type { CopyRequest, CopyResponse, PathKind } from '../../shared/api.ts';

type CopyHandler = (request: CopyRequest) => CopyResponse | Promise<CopyResponse>;

interface FakeServerOptions {
  kinds: Record<string, PathKind>;
  copy?: CopyHandler;
  /** Make the health check, /api/inspect and the folder and CSV browsers fail as if the server were down. */
  offline?: boolean;
  /** Keep /api/inspect requests pending until releaseInspects() is called. */
  holdInspect?: boolean;
  /** Answer the start-up check with 401, as for an outdated launch key. */
  rejectKey?: boolean;
  /** A fake folder tree for the folder picker: folder path → names of its sub-folders. */
  folders?: Record<string, string[]>;
  /** CSV files the CSV browser lists, by full path → content; null lists the file but fails to read it. */
  csvFiles?: Record<string, string | null>;
  /** Where the CSV browser opens (the folder FileShuttle was started from). */
  workingFolder?: string;
  /** Markdown returned for each guide; a missing one answers 404. */
  guides?: Partial<Record<'claude' | 'agents' | 'claude-summary' | 'agents-summary', string>>;
}

function parentOf(folder: string): string | null {
  if (/^[A-Za-z]:\\$/.test(folder)) return null;
  const cut = folder.replace(/\\$/, '').lastIndexOf('\\');
  return cut <= 2 ? folder.slice(0, 3) : folder.slice(0, cut);
}

function nameOf(file: string): string {
  return file.slice(file.lastIndexOf('\\') + 1);
}

interface ListRequest {
  path: string | null;
  start?: 'places' | 'working-folder';
  files?: 'csv';
}

function folderListing(request: ListRequest, state: FakeServerOptions) {
  const tree = state.folders ?? {};
  const folder = request.path ?? (request.start === 'working-folder' ? (state.workingFolder ?? 'C:\\') : null);
  if (folder === null) {
    const drives = Object.keys(tree).filter((key) => /^[A-Za-z]:\\$/.test(key));
    return { path: null, parent: null, entries: drives.map((drive) => ({ name: `${drive.slice(0, 2)} drive`, path: drive })), truncated: false };
  }
  const children = tree[folder] ?? [];
  const join = (name: string) => (folder.endsWith('\\') ? `${folder}${name}` : `${folder}\\${name}`);
  const files =
    request.files === 'csv'
      ? Object.keys(state.csvFiles ?? {})
          .filter((file) => parentOf(file) === folder)
          .map((file) => ({ name: nameOf(file), path: file }))
      : undefined;
  return { path: folder, parent: parentOf(folder), entries: children.map((name) => ({ name, path: join(name) })), files, truncated: false };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Rejects like real fetch when the request's AbortSignal fires. */
function abortable<T>(work: Promise<T>, signal: AbortSignal | null | undefined): Promise<T> {
  if (!signal) return work;
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      reject(new DOMException('The operation was aborted.', 'AbortError'));
    };
    if (signal.aborted) onAbort();
    signal.addEventListener('abort', onAbort, { once: true });
    work.then(resolve, reject);
  });
}

/** Replaces fetch with an in-memory stand-in for the local FileShuttle server. */
export function stubServer(options: FakeServerOptions) {
  const state = { ...options };
  const copyRequests: CopyRequest[] = [];
  const heldInspects: (() => void)[] = [];

  async function handle(url: string, body: unknown): Promise<Response> {
    if (url === '/api/health') {
      if (state.offline) throw new TypeError('Failed to fetch');
      return state.rejectKey ? json({ error: 'Not connected' }, 401) : json({ ok: true });
    }
    if (url === '/api/guides') {
      const { name, variant } = body as { name: 'claude' | 'agents'; variant: 'full' | 'summary' };
      const summaryKey = name === 'claude' ? 'claude-summary' : 'agents-summary';
      const content = state.guides?.[variant === 'summary' ? summaryKey : name];
      const fileName = `${name === 'claude' ? 'CLAUDE' : 'AGENTS'}_GENERAL_GUIDANCE${variant === 'summary' ? '_SHORT' : ''}.md`;
      return content === undefined
        ? json({ error: `${fileName}: Not found on disk` }, 404)
        : json({ name, variant, fileName, path: `C:\\Docs\\${fileName}`, content });
    }
    if (url === '/api/folders') {
      if (state.offline) throw new TypeError('Failed to fetch');
      return json(folderListing(body as ListRequest, state));
    }
    if (url === '/api/csv-file') {
      if (state.offline) throw new TypeError('Failed to fetch');
      const { path } = body as { path: string };
      const content = state.csvFiles?.[path];
      if (content === undefined) return json({ error: `${nameOf(path)}: Not found on disk` }, 404);
      if (content === null) return json({ error: `${nameOf(path)}: Permission denied` }, 404);
      return new Response(content, { status: 200, headers: { 'Content-Type': 'application/octet-stream' } });
    }
    if (url === '/api/inspect') {
      if (state.offline) throw new TypeError('Failed to fetch');
      if (state.holdInspect) await new Promise<void>((release) => heldInspects.push(release));
      const { paths } = body as { paths: string[] };
      return json({ results: paths.map((path) => ({ path, kind: state.kinds[path] ?? 'missing' })) });
    }
    if (url === '/api/copy') {
      const request = body as CopyRequest;
      copyRequests.push(request);
      const handler = state.copy ?? ((req: CopyRequest) => ({ outcome: 'copied' as const, target: `${req.destination}\\copied` }));
      return json(await handler(request));
    }
    return json({ error: 'Not found' }, 404);
  }

  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    const body: unknown = JSON.parse(typeof init?.body === 'string' ? init.body : '{}');
    return abortable(handle(url, body), init?.signal);
  });

  vi.stubGlobal('fetch', fetchMock);
  return {
    fetchMock,
    copyRequests,
    setOffline(offline: boolean) {
      state.offline = offline;
    },
    setHoldInspect(hold: boolean) {
      state.holdInspect = hold;
    },
    releaseInspects() {
      heldInspects.splice(0).forEach((release) => {
        release();
      });
    },
  };
}

export function csvFile(content: string, name = 'inventory_october.csv'): File {
  return new File([content], name, { type: 'text/csv' });
}

/** Minimal DataTransfer for drag-and-drop tests (jsdom has none). */
export function createDataTransfer(): DataTransfer {
  const data = new Map<string, string>();
  return {
    dropEffect: 'none',
    effectAllowed: 'all',
    setData: (type: string, value: string) => data.set(type, value),
    getData: (type: string) => data.get(type) ?? '',
    get types() {
      return [...data.keys()];
    },
  } as unknown as DataTransfer;
}
