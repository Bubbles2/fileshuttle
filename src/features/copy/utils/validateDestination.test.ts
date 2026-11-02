import { describe, expect, it } from 'vitest';
import { validateDestination } from './validateDestination';

describe('validateDestination', () => {
  it.each([
    'D:\\Export\\Client-Acme',
    '  C:\\Temp  ',
    '\\\\nas\\share\\export',
    '/srv/export',
    '\\\\?\\C:\\Very\\Long\\Path',
    '\\\\?\\UNC\\nas\\share\\export',
  ])('accepts %j', (value) => {
    expect(validateDestination(value)).toBeNull();
  });

  it.each([
    ['', 'Enter the folder'],
    ['   ', 'Enter the folder'],
    ['Export\\Client', 'full path'],
    ['D:\\Export\\Cli*ent', 'can’t contain'],
    ['D:\\Export\\a?b', 'can’t contain'],
    ['C:\\bad\0path', 'not valid'],
    ['D:\\Export\\NUL', 'reserved name'],
    ['D:\\Export\\lpt1.txt\\x', 'reserved name'],
    ['D:\\Export\\typo.', 'end with a dot'],
    ['\\\\nas\\share\\name \\sub', 'end with a dot'],
    ['D:\\Export\\a:b', 'can’t contain'],
    [`C:\\${'x'.repeat(5000)}`, 'not valid'],
  ])('rejects %j', (value, message) => {
    expect(validateDestination(value)).toContain(message);
  });
});
