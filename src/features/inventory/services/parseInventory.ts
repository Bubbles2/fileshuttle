import { z } from 'zod';
import { MAX_PATH_LENGTH } from '../../../../shared/api.ts';
import { isWindowsPath } from '../../../utils/paths';
import type { ItemType, SkillRow } from '../types';
import { CsvSyntaxError, parseCsv } from './parseCsv';

export const MAX_ROWS = 5000;
export const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_TEXT_LENGTH = 200;
const MAX_LIST_ENTRIES = 200;

/** Accepted CSV headers (lower-cased) for each field, in order of preference. Only the first three are required. */
const COLUMNS: Record<string, readonly string[]> = {
  name: ['skill', 'agent', 'name'],
  description: ['description'],
  centralCopy: ['central copy'],
  type: ['type'],
  category: ['category'],
  technology: ['technology'],
  copies: ['copies'],
  distinctVersions: ['distinct versions'],
  worktreeCopies: ['copies in worktree folders'],
  foundIn: ['found in projects'],
  otherNames: ['other names used in skill.md', 'other names used in agent definitions'],
};

const REQUIRED = [
  { key: 'name', label: 'Skill (or Agent)' },
  { key: 'description', label: 'Description' },
  { key: 'centralCopy', label: 'Central copy' },
];

function columnIndex(columns: string[], key: string): number {
  for (const alias of COLUMNS[key] ?? []) {
    const index = columns.indexOf(alias);
    if (index !== -1) return index;
  }
  return -1;
}

/**
 * Type column: A / Agent or S / Skill. Without one, an "Agent" name column means
 * agents, and a central copy that is a single .md file is an agent.
 */
function itemType(typeCell: string, nameHeader: string | undefined, centralCopy: string): ItemType {
  const value = typeCell.trim().toLowerCase();
  if (value === 'a' || value.startsWith('agent')) return 'agent';
  if (value === 's' || value.startsWith('skill')) return 'skill';
  if (nameHeader === 'agent') return 'agent';
  return /\.md$/i.test(centralCopy) ? 'agent' : 'skill';
}

/** Invisible text-direction controls that could make a name or path display as something else. */
const BIDI_CONTROLS = /[‎‏‪-‮⁦-⁩]/g;

const cleanText = (max: number) => z.string().transform((value) => value.replace(BIDI_CONTROLS, '').trim().slice(0, max));

const count = z.string().transform((value) => {
  const n = Number(value.trim());
  return value.trim() !== '' && Number.isInteger(n) && n >= 0 ? n : null;
});

/** "AgentSkill; codex/jde" → ["AgentSkill", "codex/jde"] */
const list = z.string().transform((value) =>
  value
    .replace(BIDI_CONTROLS, '')
    .split(';')
    .map((entry) => entry.trim().slice(0, MAX_TEXT_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_LIST_ENTRIES),
);

const rowSchema = z.object({
  name: cleanText(MAX_TEXT_LENGTH).pipe(z.string().min(1)),
  type: cleanText(MAX_TEXT_LENGTH),
  description: cleanText(MAX_DESCRIPTION_LENGTH),
  category: cleanText(MAX_TEXT_LENGTH),
  technology: cleanText(MAX_TEXT_LENGTH),
  copies: count,
  distinctVersions: count,
  worktreeCopies: count,
  foundIn: list,
  otherNames: list,
  centralCopy: z
    .string()
    .trim()
    .min(1)
    .max(MAX_PATH_LENGTH)
    .refine((value) => !value.includes('\0') && value.search(BIDI_CONTROLS) === -1),
});

export interface ParsedInventory {
  rows: SkillRow[];
  rowCount: number;
  skippedRows: number;
  duplicateRows: number;
}

export type ParseInventoryResult = { ok: true; value: ParsedInventory } | { ok: false; error: string };

function fail(error: string): ParseInventoryResult {
  return { ok: false, error };
}

/** Windows paths are case-insensitive and may end with a separator; treat those spellings as one location. */
function locationKey(location: string): string {
  const trimmed = location.replace(/[\\/]+$/, '').replaceAll('/', '\\');
  return isWindowsPath(location) || !location.startsWith('/') ? trimmed.toLowerCase() : trimmed;
}

function readRows(text: string): string[][] | string {
  try {
    return parseCsv(text);
  } catch (error) {
    if (error instanceof CsvSyntaxError) return `${error.message} Check the quotes in the CSV.`;
    throw error;
  }
}

/** Validates a skills inventory CSV (columns in any order and case; only Skill, Description and Central copy are required). */
export function parseInventory(text: string): ParseInventoryResult {
  const parsed = readRows(text);
  if (typeof parsed === 'string') return fail(parsed);

  const [header, ...body] = parsed;
  if (!header) return fail('This CSV is empty.');

  const columns = header.map((name) => name.trim().toLowerCase());
  const missing = REQUIRED.filter(({ key }) => columnIndex(columns, key) === -1);
  if (missing.length > 0) {
    return fail(`This doesn’t look like a skills inventory. Missing columns: ${missing.map((column) => column.label).join(', ')}.`);
  }
  if (body.length === 0) return fail('This CSV has a header row but no skills.');
  if (body.length > MAX_ROWS) {
    return fail(`This CSV has ${body.length} rows. FileShuttle can load up to ${MAX_ROWS} at a time.`);
  }

  const indexes = Object.fromEntries(Object.keys(COLUMNS).map((key) => [key, columnIndex(columns, key)]));
  const nameHeader = columns[columnIndex(columns, 'name')];
  const rows: SkillRow[] = [];
  const seen = new Set<string>();
  let skippedRows = 0;
  let duplicateRows = 0;

  for (const cells of body) {
    const raw = Object.fromEntries(Object.entries(indexes).map(([key, index]) => [key, index === -1 ? '' : (cells[index] ?? '')]));
    const row = rowSchema.safeParse(raw);
    if (!row.success) {
      skippedRows += 1;
      continue;
    }
    const key = locationKey(row.data.centralCopy);
    if (seen.has(key)) {
      duplicateRows += 1;
      continue;
    }
    seen.add(key);
    rows.push({ ...row.data, type: itemType(row.data.type, nameHeader, row.data.centralCopy) });
  }

  if (rows.length === 0) return fail('None of the rows have both a skill name and a central copy path.');
  return { ok: true, value: { rows, rowCount: body.length, skippedRows, duplicateRows } };
}
