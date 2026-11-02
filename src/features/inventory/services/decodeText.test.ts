import { describe, expect, it } from 'vitest';
import { decodeCsvBytes } from './decodeText';

function bytes(values: number[]): ArrayBuffer {
  return new Uint8Array(values).buffer;
}

describe('decodeCsvBytes', () => {
  it('decodes UTF-8 and drops the byte-order mark', () => {
    const encoded = new TextEncoder().encode('\uFEFFdescription,location\nÉté,C:\\é.txt');
    expect(decodeCsvBytes(encoded.buffer)).toBe('description,location\nÉté,C:\\é.txt');
  });

  it('falls back to Windows-1252 for Excel exports', () => {
    // "Été" in Windows-1252: 0xC9 0x74 0xE9 — invalid as UTF-8.
    expect(decodeCsvBytes(bytes([0xc9, 0x74, 0xe9]))).toBe('Été');
  });
});
