import { describe, expect, it } from 'vitest';
import { destinationFor, subfolderFor, targetNameFor } from './destinationFolders';

const BASE = 'C:\\Users\\D.Finlay\\SaveCrap';

describe('destinationFor', () => {
  it('puts skills in .claude\\skills or .agents\\skills', () => {
    expect(destinationFor(BASE, 'skill', true)).toBe(`${BASE}\\.claude\\skills`);
    expect(destinationFor(`${BASE}\\`, 'skill', false)).toBe(`${BASE}\\.agents\\skills`);
  });

  it('puts agents in .claude\\agents or .codex\\agents', () => {
    expect(destinationFor(BASE, 'agent', true)).toBe(`${BASE}\\.claude\\agents`);
    expect(destinationFor(BASE, 'agent', false)).toBe(`${BASE}\\.codex\\agents`);
    expect(destinationFor('/home/me/app', 'agent', true)).toBe('/home/me/app/.claude/agents');
  });

  it('does not double a subfolder the destination already ends with', () => {
    expect(destinationFor('D:\\App\\.claude\\skills', 'skill', true)).toBe('D:\\App\\.claude\\skills');
    expect(destinationFor('D:\\App\\.Claude\\Skills\\', 'skill', false)).toBe('D:\\App\\.agents\\skills');
    expect(destinationFor('D:\\App\\.claude\\skills', 'agent', false)).toBe('D:\\App\\.codex\\agents');
    expect(destinationFor('D:\\App\\.codex\\agents', 'agent', true)).toBe('D:\\App\\.claude\\agents');
  });

  it('names each subfolder', () => {
    expect(subfolderFor('skill', true)).toBe('.claude\\skills');
    expect(subfolderFor('agent', false)).toBe('.codex\\agents');
  });
});

describe('targetNameFor', () => {
  it('renames agents to .toml for Codex only', () => {
    expect(targetNameFor('central_skills\\agents\\code-reviewer.md', 'agent', false)).toBe('code-reviewer.toml');
    expect(targetNameFor('central_skills\\agents\\DocsExplorer.MD', 'agent', false)).toBe('DocsExplorer.toml');
    expect(targetNameFor('central_skills\\agents\\code-reviewer.md', 'agent', true)).toBeUndefined();
    expect(targetNameFor('central_skills\\skills\\docx', 'skill', false)).toBeUndefined();
  });
});
