import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GuideName, GuideResponse, GuideVariant } from '../../shared/api.ts';
import { copyErrorMessage } from './copyErrors.ts';

/** Doc_Spec_Claude_Agents inside the FileShuttle folder (C:\AI_Donncha\fileshuttle\Doc_Spec_Claude_Agents). */
export const GUIDE_FOLDER = fileURLToPath(new URL('../../Doc_Spec_Claude_Agents', import.meta.url));

/**
 * The only files the guide viewer can read: a full guide and its summary for
 * each name. Change the paths here; the browser can only ask for a name.
 */
export const GUIDE_FILES: Record<GuideName, Record<GuideVariant, string>> = {
  claude: {
    full: path.join(GUIDE_FOLDER, 'CLAUDE_GENERAL_GUIDANCE.md'),
    summary: path.join(GUIDE_FOLDER, 'CLAUDE_GENERAL_GUIDANCE_SHORT.md'),
  },
  agents: {
    full: path.join(GUIDE_FOLDER, 'AGENTS_GENERAL_GUIDANCE.md'),
    summary: path.join(GUIDE_FOLDER, 'AGENTS_GENERAL_GUIDANCE_SHORT.md'),
  },
};

const MAX_GUIDE_BYTES = 2 * 1024 * 1024;

export type GuideResult = { ok: true; guide: GuideResponse } | { ok: false; message: string };

export async function readGuide(name: GuideName, variant: GuideVariant, files = GUIDE_FILES): Promise<GuideResult> {
  const file = files[name][variant];
  try {
    if ((await stat(file)).size > MAX_GUIDE_BYTES) return { ok: false, message: 'This guide is larger than 2 MB.' };
    const content = await readFile(file, 'utf8');
    return { ok: true, guide: { name, variant, fileName: path.basename(file), path: file, content } };
  } catch (error) {
    return { ok: false, message: `${path.basename(file)}: ${copyErrorMessage(error)}` };
  }
}
