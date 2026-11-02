import { pluralize } from '../../../utils/paths';
import type { CopyItemProgress, CopySummary } from '../types';

export function summarizeProgress(progress: Record<string, CopyItemProgress>): CopySummary {
  const summary: CopySummary = { copied: 0, skipped: 0, failed: 0, stopped: 0 };
  for (const { status } of Object.values(progress)) {
    if (status !== 'waiting' && status !== 'copying') summary[status] += 1;
  }
  return summary;
}

/** The part of the result that needs attention, e.g. "1 item skipped because it already existed · 1 failed". */
export function describeExceptions({ skipped, failed, stopped }: CopySummary, noun = 'skill'): string | null {
  const parts: string[] = [];
  if (skipped > 0) parts.push(`${pluralize(skipped, noun)} skipped because ${skipped === 1 ? 'it' : 'they'} already existed`);
  if (failed > 0) parts.push(`${failed} failed — see the basket for the reason`);
  if (stopped > 0) parts.push(`${stopped} not copied because the copy was stopped`);
  return parts.length > 0 ? parts.join(' · ') : null;
}
