import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { GuideName, GuideVariant } from '../../shared/api.ts';
import { GUIDE_FILES, GUIDE_FOLDER, readGuide } from './guides.ts';

let dir: string;
let files: Record<GuideName, Record<GuideVariant, string>>;

beforeAll(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), 'fileshuttle-guides-'));
  files = {
    claude: { full: path.join(dir, 'CLAUDE_GENERAL_GUIDANCE.md'), summary: path.join(dir, 'CLAUDE_GENERAL_GUIDANCE_SHORT.md') },
    agents: { full: path.join(dir, 'missing.md'), summary: path.join(dir, 'missing_SHORT.md') },
  };
  await writeFile(files.claude.full, '# Guidance\n');
  await writeFile(files.claude.summary, '# Short guidance\n');
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('readGuide', () => {
  it('reads the full guide or its summary', async () => {
    expect(await readGuide('claude', 'full', files)).toEqual({
      ok: true,
      guide: { name: 'claude', variant: 'full', fileName: 'CLAUDE_GENERAL_GUIDANCE.md', path: files.claude.full, content: '# Guidance\n' },
    });
    const summary = await readGuide('claude', 'summary', files);
    expect(summary.ok && summary.guide.content).toBe('# Short guidance\n');
  });

  it('explains a missing file without exposing error details', async () => {
    expect(await readGuide('agents', 'summary', files)).toEqual({ ok: false, message: 'missing_SHORT.md: Not found on disk' });
  });

  it('points each name at its guide and its _SHORT summary in the project’s Doc_Spec_Claude_Agents folder', () => {
    expect(GUIDE_FOLDER).toBe(path.resolve(import.meta.dirname, '..', '..', 'Doc_Spec_Claude_Agents'));
    for (const variants of Object.values(GUIDE_FILES)) {
      expect(path.dirname(variants.full)).toBe(GUIDE_FOLDER);
      expect(path.dirname(variants.summary)).toBe(GUIDE_FOLDER);
    }
    expect(path.basename(GUIDE_FILES.claude.full)).toBe('CLAUDE_GENERAL_GUIDANCE.md');
    expect(path.basename(GUIDE_FILES.claude.summary)).toBe('CLAUDE_GENERAL_GUIDANCE_SHORT.md');
    expect(path.basename(GUIDE_FILES.agents.full)).toBe('AGENTS_GENERAL_GUIDANCE.md');
    expect(path.basename(GUIDE_FILES.agents.summary)).toBe('AGENTS_GENERAL_GUIDANCE_SHORT.md');
  });
});
