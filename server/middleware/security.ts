import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { API_KEY_HEADER } from '../../shared/api.ts';

export type ServerMode = 'development' | 'production';

function localHosts(port: number): Set<string> {
  return new Set([`localhost:${port}`, `127.0.0.1:${port}`, `[::1]:${port}`]);
}

function contentSecurityPolicy(mode: ServerMode, port: number): string {
  // Vite's dev server injects an inline React Refresh preamble and talks to its HMR socket.
  const dev = mode === 'development';
  return [
    "default-src 'self'",
    `script-src 'self'${dev ? " 'unsafe-inline'" : ''}`,
    `style-src 'self'${dev ? " 'unsafe-inline'" : ''}`,
    "img-src 'self'",
    "font-src 'self'",
    `connect-src 'self'${dev ? ` ws://localhost:${port} ws://127.0.0.1:${port}` : ''}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; ');
}

export function securityHeaders(mode: ServerMode, port: number) {
  const csp = contentSecurityPolicy(mode, port);
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Content-Security-Policy', csp);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    next();
  };
}

/** Blocks DNS-rebinding: the app answers only when addressed as this machine. */
export function requireLocalHost(port: number) {
  const allowed = localHosts(port);
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowed.has(req.headers.host?.toLowerCase() ?? '')) {
      res.status(421).type('text/plain').send('Misdirected request');
      return;
    }
    next();
  };
}

/**
 * Fetch Metadata check for every route: pages from other sites (including other
 * localhost ports, which count as "same-site") may link to the app, but can't
 * load its resources or trigger dev-server endpoints with <img>, <script> or fetch.
 */
export function rejectCrossSiteRequests(req: Request, res: Response, next: NextFunction) {
  const site = req.headers['sec-fetch-site'];
  const isNavigation = req.headers['sec-fetch-mode'] === 'navigate' && req.method === 'GET';
  if ((site === 'cross-site' || site === 'same-site') && !isNavigation) {
    res.status(403).type('text/plain').send('Cross-site requests are not allowed');
    return;
  }
  next();
}

/** Vite's dev server can open files in an editor; nothing in FileShuttle needs that. */
export function blockDevToolEndpoints(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/__open-in-editor')) {
    res.status(404).type('text/plain').send('Not found');
    return;
  }
  next();
}

/**
 * Blocks cross-site requests to the API (CSRF): other websites open in the browser
 * must not be able to make this server copy files. State-changing calls must carry
 * an Origin header matching the Host they were sent to, and a JSON body.
 */
export function requireSameOrigin(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  const fetchSite = req.headers['sec-fetch-site'];
  const isRead = req.method === 'GET' || req.method === 'HEAD';

  if (origin !== undefined && origin !== `http://${req.headers.host ?? ''}`) {
    res.status(403).json({ error: 'Cross-origin requests are not allowed' });
    return;
  }
  if (fetchSite !== undefined && fetchSite !== 'same-origin' && fetchSite !== 'none') {
    res.status(403).json({ error: 'Cross-site requests are not allowed' });
    return;
  }
  if (!isRead && origin === undefined) {
    res.status(403).json({ error: 'Missing Origin header' });
    return;
  }
  if (!isRead && !req.is('application/json')) {
    res.status(415).json({ error: 'Send a JSON body' });
    return;
  }
  next();
}

function sameSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const NOT_CONNECTED_MESSAGE =
  'This tab isn’t connected to FileShuttle. Open the link shown in the terminal where FileShuttle is running.';

/**
 * Requires the per-launch key printed in the terminal. Browsers can be trusted to
 * send honest Origin headers; other programs on this machine can't, so the key is
 * what stops them (and other signed-in users) from driving the API.
 */
export function requireApiKey(apiKey: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const given = req.get(API_KEY_HEADER);
    if (given === undefined || !sameSecret(given, apiKey)) {
      res.status(401).json({ error: NOT_CONNECTED_MESSAGE });
      return;
    }
    next();
  };
}
