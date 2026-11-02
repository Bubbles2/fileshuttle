import { describe, expect, it } from 'vitest';
import { classifyPath, isUsablePath, windowsFolderNameProblem } from './pathRules.ts';

describe('classifyPath on Windows', () => {
  it.each([
    ['C:\\Data\\a.txt', 'local'],
    ['c:/data/a.txt', 'local'],
    ['\\\\?\\C:\\Very\\Long', 'local'],
    ['\\\\server\\share\\a.txt', 'network'],
    ['//server/share/a.txt', 'network'],
    ['\\\\?\\UNC\\server\\share', 'network'],
    ['\\\\.\\PhysicalDrive0', 'invalid'],
    ['\\\\?\\GLOBALROOT\\Device', 'invalid'],
    ['\\Windows\\System32', 'invalid'],
    ['/data/x', 'invalid'],
    ['C:relative', 'invalid'],
    ['relative\\a.txt', 'invalid'],
  ] as const)('%s → %s', (input, expected) => {
    expect(classifyPath(input, 'win32')).toBe(expected);
  });
});

describe('classifyPath on POSIX', () => {
  it('accepts absolute paths only', () => {
    expect(classifyPath('/srv/data', 'linux')).toBe('local');
    expect(classifyPath('srv/data', 'linux')).toBe('invalid');
  });
});

describe('isUsablePath', () => {
  it('only allows network paths when switched on', () => {
    expect(isUsablePath('\\\\server\\share', false, 'win32')).toBe(false);
    expect(isUsablePath('\\\\server\\share', true, 'win32')).toBe(true);
    expect(isUsablePath('\\\\.\\pipe\\x', true, 'win32')).toBe(false);
  });
});

describe('windowsFolderNameProblem', () => {
  it.each(['D:\\Export\\Client', '\\\\?\\D:\\Export', '\\\\server\\share\\Export', 'D:\\a\\..\\b'])('accepts %s', (folder) => {
    expect(windowsFolderNameProblem(folder, 'win32')).toBeNull();
  });

  it.each([
    ['D:\\Export\\NUL', 'reserved'],
    ['D:\\Export\\com1.txt', 'reserved'],
    ['D:\\Export\\typo.', 'dot or a space'],
    ['D:\\Export\\name ', 'dot or a space'],
    ['\\\\?\\D:\\evil. ', 'dot or a space'],
    ['D:\\Export\\a:stream', 'character'],
  ])('rejects %s', (folder, message) => {
    expect(windowsFolderNameProblem(folder, 'win32')).toContain(message);
  });

  it('does nothing on other platforms', () => {
    expect(windowsFolderNameProblem('/srv/NUL', 'linux')).toBeNull();
  });
});
