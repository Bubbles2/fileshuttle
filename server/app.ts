import express from 'express';
import {
  blockDevToolEndpoints,
  rejectCrossSiteRequests,
  requireLocalHost,
  securityHeaders,
  type ServerMode,
} from './middleware/security.ts';
import { apiRouter } from './routes/api.ts';

export interface AppOptions {
  port: number;
  mode: ServerMode;
  /** Secret required on every API call (`--require-key`), or null when the key check is off. */
  apiKey: string | null;
  /** UNC paths make Windows contact other machines with the user's credentials, so they are off unless asked for. */
  allowNetworkPaths: boolean;
}

/** Builds the Express app with security middleware and the API. Front-end serving is attached by the caller. */
export function createApp({ port, mode, apiKey, allowNetworkPaths }: AppOptions) {
  const app = express();
  app.set('env', mode);
  app.disable('x-powered-by');
  app.use(securityHeaders(mode, port));
  app.use(requireLocalHost(port));
  app.use(rejectCrossSiteRequests);
  app.use(blockDevToolEndpoints);
  app.use('/api', apiRouter({ apiKey, allowNetworkPaths }));
  return app;
}
