import { spawn } from 'node:child_process';

/** Only plain http(s) URLs with characters that are safe on a cmd.exe command line. */
const SAFE_URL = /^https?:\/\/[A-Za-z0-9.:[\]/#=_-]+$/;

export function browserCommand(url: string, platform: NodeJS.Platform = process.platform): { command: string; args: string[] } | null {
  if (!SAFE_URL.test(url)) return null;
  if (platform === 'win32') return { command: 'cmd', args: ['/c', 'start', '""', url] };
  if (platform === 'darwin') return { command: 'open', args: [url] };
  return { command: 'xdg-open', args: [url] };
}

/** Opens the launch link in the default browser, so it already has the key. Failures are ignored. */
export function openInBrowser(url: string): void {
  const command = browserCommand(url);
  if (!command) return;
  try {
    const child = spawn(command.command, command.args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      windowsVerbatimArguments: process.platform === 'win32',
    });
    child.on('error', () => undefined);
    child.unref();
  } catch {
    // No browser available (e.g. a server without a desktop): the link is still printed.
  }
}
