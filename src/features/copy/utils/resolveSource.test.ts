import { describe, expect, it } from 'vitest';
import { isRelativeSource, resolveSource, validateSourceFolder } from './resolveSource';

const RELATIVE = 'central_skills\\skills\\clean-typescript';

describe('resolveSource', () => {
  it('keeps full paths as they are', () => {
    expect(resolveSource('D:\\Skills\\docx', 'C:\\AI')).toBe('D:\\Skills\\docx');
    expect(isRelativeSource('D:\\Skills\\docx')).toBe(false);
  });

  it('joins a relative path onto the folder it starts from', () => {
    expect(resolveSource(RELATIVE, 'C:\\AI_Donncha')).toBe('C:\\AI_Donncha\\central_skills\\skills\\clean-typescript');
    expect(resolveSource(RELATIVE, 'C:\\AI_Donncha\\')).toBe('C:\\AI_Donncha\\central_skills\\skills\\clean-typescript');
    expect(resolveSource('.\\skills\\docx', '/home/me')).toBe('/home/me/skills/docx');
  });

  it('does not repeat folders the chosen folder already includes', () => {
    const expected = 'C:\\AI_Donncha\\central_skills\\skills\\clean-typescript';
    expect(resolveSource(RELATIVE, 'C:\\AI_Donncha\\central_skills\\skills')).toBe(expected);
    expect(resolveSource(RELATIVE, 'C:\\AI_Donncha\\central_skills')).toBe(expected);
    expect(resolveSource(RELATIVE, 'c:\\ai_donncha\\CENTRAL_SKILLS\\Skills')).toBe('c:\\ai_donncha\\CENTRAL_SKILLS\\Skills\\clean-typescript');
    expect(resolveSource(RELATIVE, expected)).toBe(expected);
  });
});

describe('validateSourceFolder', () => {
  it('requires a full path', () => {
    expect(validateSourceFolder('C:\\AI_Donncha')).toBeNull();
    expect(validateSourceFolder('')).toContain('Choose the folder');
    expect(validateSourceFolder('AI_Donncha')).toContain('full path');
  });
});
