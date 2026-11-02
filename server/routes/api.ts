import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { copyRequestSchema, csvFileRequestSchema, folderListRequestSchema, guideRequestSchema, inspectRequestSchema } from '../../shared/api.ts';
import { requireApiKey, requireSameOrigin } from '../middleware/security.ts';
import { copyItem } from '../services/copyItem.ts';
import { readGuide } from '../services/guides.ts';
import { inspectPaths } from '../services/inspectPaths.ts';
import { listFolders, listStartingPlaces } from '../services/listFolders.ts';
import { readCsvFile } from '../services/readCsvFile.ts';

const BODY_LIMIT = '3mb';

export interface ApiOptions {
  apiKey: string | null;
  allowNetworkPaths: boolean;
}

function httpStatusOf(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
    return error.status;
  }
  return undefined;
}

function apiErrorHandler(error: unknown, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    next(error);
    return;
  }
  const status = httpStatusOf(error);
  if (status === 413) {
    res.status(413).json({ error: 'The request is too large' });
  } else if (status !== undefined && status >= 400 && status < 500) {
    res.status(400).json({ error: 'The request could not be read' });
  } else {
    console.error('API error:', error instanceof Error ? error.name : 'unknown');
    res.status(500).json({ error: 'Something went wrong on the server' });
  }
}

export function apiRouter({ apiKey, allowNetworkPaths }: ApiOptions) {
  const router = express.Router();
  // One copy at a time: copies never race each other on the same destination.
  let copying = false;

  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  router.use(requireSameOrigin);
  if (apiKey !== null) router.use(requireApiKey(apiKey));
  router.use(express.json({ limit: BODY_LIMIT, type: 'application/json' }));

  router.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  router.post('/inspect', async (req, res) => {
    const parsed = inspectRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Send between 1 and 500 valid paths' });
      return;
    }
    res.json({ results: await inspectPaths(parsed.data.paths, allowNetworkPaths) });
  });

  router.post('/folders', async (req, res) => {
    const parsed = folderListRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Send a folder path, or null for the starting places' });
      return;
    }
    const { path, start, files } = parsed.data;
    if (path === null && start === 'places') {
      res.json(await listStartingPlaces());
      return;
    }
    // "working-folder" is where FileShuttle was started from (npm runs it in the project folder).
    res.json(await listFolders(path ?? process.cwd(), allowNetworkPaths, files === 'csv'));
  });

  router.post('/csv-file', async (req, res) => {
    const parsed = csvFileRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Send the path of a .csv file' });
      return;
    }
    const result = await readCsvFile(parsed.data.path, allowNetworkPaths);
    if (result.ok) res.type('application/octet-stream').send(result.bytes);
    else res.status(result.status).json({ error: result.message });
  });

  router.post('/guides', async (req, res) => {
    const parsed = guideRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Ask for the "claude" or "agents" guide' });
      return;
    }
    const result = await readGuide(parsed.data.name, parsed.data.variant);
    if (result.ok) res.json(result.guide);
    else res.status(404).json({ error: result.message });
  });

  router.post('/copy', async (req, res) => {
    const parsed = copyRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Send a source path, a destination folder and a valid policy' });
      return;
    }
    if (copying) {
      res.status(409).json({ error: 'An earlier copy is still running. Try again when it has finished.' });
      return;
    }
    copying = true;
    try {
      res.json(await copyItem(parsed.data, { allowNetworkPaths }));
    } finally {
      copying = false;
    }
  });

  router.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  router.use(apiErrorHandler);
  return router;
}
