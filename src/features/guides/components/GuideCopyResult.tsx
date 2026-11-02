import { Check, CircleAlert, CircleMinus } from 'lucide-react';
import type { CopyResponse } from '../../../../shared/api.ts';
import { cn } from '../../../utils/cn';

const STYLES = {
  copied: { tone: 'bg-success-soft text-success-ink', Icon: Check },
  skipped: { tone: 'bg-chip text-ink', Icon: CircleMinus },
  failed: { tone: 'bg-danger-soft text-danger-ink', Icon: CircleAlert },
} as const;

function messageFor(result: CopyResponse): string {
  if (result.outcome === 'copied') return `Copied to ${result.target ?? 'the destination folder'}.`;
  if (result.outcome === 'skipped') {
    return `${result.target ?? 'spec.md'} already exists, so it was left alone. To replace it, choose Overwrite under “If a file already exists” on the Skills & Agents screen.`;
  }
  return result.message ?? 'Could not copy this guide.';
}

/** The outcome of copying a guide to spec.md. */
export function GuideCopyResult({ result }: { result: CopyResponse }) {
  const { tone, Icon } = STYLES[result.outcome];
  return (
    <p role="status" className={cn('m-0 flex items-start gap-2 rounded-control px-3 py-2 text-label font-semibold wrap-anywhere', tone)}>
      <Icon size={18} strokeWidth={2.4} aria-hidden="true" className="mt-0.5 flex-none" />
      {messageFor(result)}
    </p>
  );
}
