import { describe, expect, it } from 'vitest';
import { hasElevatedIntegrity, isUacEnabled } from './elevation.ts';

describe('hasElevatedIntegrity', () => {
  it('recognises High and System integrity levels', () => {
    expect(hasElevatedIntegrity('Mandatory Label\\High Mandatory Level   Label   S-1-16-12288')).toBe(true);
    expect(hasElevatedIntegrity('Mandatory Label\\System Mandatory Level Label   S-1-16-16384')).toBe(true);
  });

  it('treats Medium integrity and unreadable output as not elevated', () => {
    expect(hasElevatedIntegrity('Mandatory Label\\Medium Mandatory Level Label  S-1-16-8192')).toBe(false);
    expect(hasElevatedIntegrity('')).toBe(false);
  });
});

describe('isUacEnabled', () => {
  const policy = (value: string) =>
    `\r\nHKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System\r\n    EnableLUA    REG_DWORD    ${value}\r\n`;

  it('reads the EnableLUA policy', () => {
    expect(isUacEnabled(policy('0x1'))).toBe(true);
    expect(isUacEnabled(policy('0x0'))).toBe(false);
  });

  it('assumes UAC is on when the setting cannot be read', () => {
    expect(isUacEnabled('')).toBe(true);
    expect(isUacEnabled('ERROR: The system was unable to find the specified registry key or value.')).toBe(true);
  });
});
