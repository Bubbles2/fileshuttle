import { describe, expect, it } from 'vitest';
import { baseName, isAbsolutePath, joinPath, pluralize } from './paths';

describe('baseName', () => {
  it.each([
    ['C:\\Projects\\Finance\\q3_sales.xlsx', 'q3_sales.xlsx'],
    ['C:\\Assets\\Brand\\logos\\', 'logos'],
    ['/home/me/notes.md', 'notes.md'],
    ['\\\\server\\share\\file.txt', 'file.txt'],
    ['plain', 'plain'],
  ])('%s → %s', (input, expected) => {
    expect(baseName(input)).toBe(expected);
  });
});

describe('isAbsolutePath', () => {
  it.each([
    ['D:\\Export\\Client', true],
    ['d:/export', true],
    ['\\\\server\\share\\folder', true],
    ['/var/data', true],
    ['Export\\Client', false],
    ['C:relative', false],
    ['\\\\server', false],
    ['', false],
  ])('%j → %s', (input, expected) => {
    expect(isAbsolutePath(input)).toBe(expected);
  });
});

describe('joinPath', () => {
  it('uses the folder separator style and avoids doubled separators', () => {
    expect(joinPath('D:\\Export\\Client\\', 'a.pdf')).toBe('D:\\Export\\Client\\a.pdf');
    expect(joinPath('/srv/export/', 'a.pdf')).toBe('/srv/export/a.pdf');
    expect(joinPath('D:\\', 'a.pdf')).toBe('D:\\a.pdf');
  });
});

describe('pluralize', () => {
  it('chooses singular or plural', () => {
    expect(pluralize(1, 'item')).toBe('1 item');
    expect(pluralize(0, 'item')).toBe('0 items');
    expect(pluralize(3, 'row')).toBe('3 rows');
  });
});
