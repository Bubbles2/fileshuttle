import { existsSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Express, NextFunction, Request, Response } from 'express';
import { createApp } from './app.ts';
import { loadOrCreateApiKey, type StoredKey } from './services/apiKeyStore.ts';
import { openInBrowser } from './services/openBrowser.ts';
import { errorCode } from './services/copyErrors.ts';
import { detectElevation, type Elevation } from './services/elevation.ts';

// Bound to the loopback interface only: FileShuttle is never reachable from the network.
const HOST = '127.0.0.1';
const DEFAULT_PORT = 3001;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function readPort(): number {
  const raw = process.env.PORT;
  if (raw === undefined || raw === '') return DEFAULT_PORT;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) fail(`PORT must be a whole number between 1 and 65535 (got "${raw}").`);
  return port;
}

function serveBuiltApp(app: Express, distDir: string) {
  if (!existsSync(path.join(distDir, 'index.html'))) fail('No production build found. Run "npm run build" first.');
  // Fingerprinted files in assets/ never change; everything else is revalidated so a rebuild shows up straight away.
  const assetsDir = `${path.sep}assets${path.sep}`;
  app.use(
    express.static(distDir, {
      index: 'index.html',
      setHeaders: (res, filePath) => {
        res.setHeader('Cache-Control', filePath.includes(assetsDir) ? 'public, max-age=31536000, immutable' : 'no-cache');
      },
    }),
  );
  app.use((req, res, next) => {
    if (req.method !== 'GET') {
      next();
      return;
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

async function serveWithVite(app: Express, server: http.Server, root: string) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    root,
    appType: 'spa',
    server: { middlewareMode: true, hmr: { server }, cors: false },
  });
  app.use(vite.middlewares);
}

const KEY_NOTES: Record<StoredKey['source'], string> = {
  existing: 'Already opened this link in your browser before? Then plain {url} is enough. Start with --new-key to sign out every browser.',
  new: 'Open the link once in each browser; after that plain {url} is enough. Start with --new-key to sign out every browser.',
  memory: 'The key could not be saved, so this link only works until FileShuttle stops.',
};

const ELEVATED_WARNINGS: Record<Exclude<Elevation, 'standard'>, string> = {
  unavoidable:
    'Note: Windows UAC is turned off on this PC, so FileShuttle has Administrator rights.\n' +
    'Windows will not stop it writing to system folders: double-check destinations and take care with Overwrite.',
  elevated:
    'Note: FileShuttle has Administrator/root rights (--allow-elevated).\n' +
    'Nothing will stop it writing to system folders: double-check destinations and take care with Overwrite.',
};

function finalErrorHandler(error: unknown, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    next(error);
    return;
  }
  console.error('Request error:', error instanceof Error ? error.name : 'unknown');
  res.status(500).type('text/plain').send('Something went wrong');
}

async function main() {
  const args = process.argv.slice(2);
  const production = args.includes('--production');
  const allowNetworkPaths = args.includes('--allow-network-paths');
  // Refuse admin rights when the user could have avoided them; on PCs with UAC off there is no other way to run.
  const elevation = detectElevation();
  if (elevation === 'elevated' && !args.includes('--allow-elevated')) {
    fail(
      'FileShuttle is running as Administrator/root, which would let it overwrite system files.\n' +
        'Start it from a normal terminal (not "Run as administrator"), or add --allow-elevated if you really need to.',
    );
  }

  const port = readPort();
  const root = fileURLToPath(new URL('..', import.meta.url));
  // The key only stops other programs and users on this machine; browsers are already blocked by the
  // origin checks. It is opt-in for shared computers, so a single-user PC needs no link.
  const stored = args.includes('--require-key') ? loadOrCreateApiKey(args.includes('--new-key')) : null;
  const apiKey = stored?.key ?? null;

  const app = createApp({ port, mode: production ? 'production' : 'development', apiKey, allowNetworkPaths });
  const server = http.createServer(app);

  if (production) serveBuiltApp(app, path.join(root, 'dist'));
  else await serveWithVite(app, server, root);
  app.use(finalErrorHandler);

  server.on('error', (error) => {
    if (errorCode(error) === 'EADDRINUSE') fail(`Port ${port} is already in use. Stop the other program, or run: npx kill-port ${port}`);
    fail(`The server could not start: ${error.message}`);
  });

  server.listen(port, HOST, () => {
    const address = `http://localhost:${port}`;
    // The key sits after "#", so browsers never send it in requests or Referer headers.
    const launchLink = stored ? `${address}/#key=${stored.key}` : address;
    console.log(`\nFileShuttle ${production ? '' : '(development) '}is running at:\n`);
    console.log(`  ${launchLink}\n`);
    if (stored) console.log(KEY_NOTES[stored.source].replace('{url}', address));
    if (allowNetworkPaths) console.log('Network (UNC) paths are allowed.');
    if (elevation !== 'standard') console.warn(`\n${ELEVATED_WARNINGS[elevation]}\n`);
    if (!args.includes('--no-open') && !process.env.CI) openInBrowser(launchLink);
  });
}

await main();
