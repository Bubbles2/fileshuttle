import type { ConflictPolicy } from '../../../../shared/api.ts';

const OUTCOME: Record<ConflictPolicy, string> = {
  skip: 'it will be skipped',
  overwrite: 'it will replace that one',
  rename: 'it will get a numbered name',
};

/** Explains what happens when two basket items would land under the same name. */
export function clashNote(clashWith: number, policy: ConflictPolicy): string {
  return `Same name as item ${clashWith}: ${OUTCOME[policy]}`;
}
