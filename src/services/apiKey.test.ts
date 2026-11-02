import { describe, expect, it, vi } from 'vitest';
import { captureLaunchKey, readApiKey } from './apiKey';

function fakeLocation(hash: string): Location {
  return { hash, pathname: '/', search: '' } as Location;
}

describe('captureLaunchKey', () => {
  it('stores the key from the launch link and removes it from the address bar', () => {
    const replaceState = vi.fn();
    localStorage.clear();

    const found = captureLaunchKey(fakeLocation('#key=AbC_123-xyz7890123'), { replaceState } as unknown as History);

    expect(found).toBe(true);
    expect(readApiKey()).toBe('AbC_123-xyz7890123');
    expect(localStorage.getItem('fileshuttle.apiKey')).toBe('AbC_123-xyz7890123');
    expect(replaceState).toHaveBeenCalledWith(null, '', '/');
  });

  it.each(['', '#other=1', '#key=short', '#key=<script>alert(1)</script>'])('ignores %j', (hash) => {
    const replaceState = vi.fn();
    expect(captureLaunchKey(fakeLocation(hash), { replaceState } as unknown as History)).toBe(false);
    expect(replaceState).not.toHaveBeenCalled();
  });
});
