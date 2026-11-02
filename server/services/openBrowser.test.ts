import { describe, expect, it } from 'vitest';
import { browserCommand } from './openBrowser.ts';

const LINK = 'http://localhost:3000/#key=wFZ_Aj-cG0';

describe('browserCommand', () => {
  it('uses the platform launcher', () => {
    expect(browserCommand(LINK, 'win32')).toEqual({ command: 'cmd', args: ['/c', 'start', '""', LINK] });
    expect(browserCommand(LINK, 'darwin')).toEqual({ command: 'open', args: [LINK] });
    expect(browserCommand(LINK, 'linux')).toEqual({ command: 'xdg-open', args: [LINK] });
  });

  it.each(['http://localhost:3000/#key=a&calc', 'http://localhost:3000/"x', 'file:///C:/Windows', 'javascript:alert(1)'])(
    'refuses anything that could be misread by a shell: %s',
    (url) => {
      expect(browserCommand(url, 'win32')).toBeNull();
    },
  );
});
