import { Check, CircleAlert } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '../../../utils/cn';
import { pluralize } from '../../../utils/paths';
import type { CopySummary } from '../types';
import { describeExceptions } from '../utils/summarizeProgress';

interface CopyResultBannerProps {
  summary: CopySummary;
  /** "skill", "agent" or "item". */
  noun: string;
  destination: string;
  onStartNewBatch: () => void;
}

export function CopyResultBanner({ summary, noun, destination, onStartNewBatch }: CopyResultBannerProps) {
  const needsAttention = summary.failed > 0 || summary.stopped > 0;
  const details = describeExceptions(summary, noun);
  const actionRef = useRef<HTMLButtonElement>(null);

  // The banner replaces the copy button; if focus went with it, continue from here.
  useEffect(() => {
    if (document.activeElement === document.body || document.activeElement === null) actionRef.current?.focus();
  }, []);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3.5 rounded-row border p-4 motion-safe:animate-enter',
        needsAttention ? 'border-warning-line bg-warning-bg' : 'border-success-line bg-success-soft',
      )}
    >
      <div
        aria-hidden="true"
        className={cn('flex size-10 flex-none items-center justify-center rounded-full text-white', needsAttention ? 'bg-warning-ink' : 'bg-success')}
      >
        {needsAttention ? <CircleAlert size={20} strokeWidth={2.6} /> : <Check size={20} strokeWidth={3} />}
      </div>
      <div className="flex min-w-0 flex-[1_1_200px] flex-col">
        <span className={cn('font-extrabold', needsAttention ? 'text-warning-ink' : 'text-success-ink')}>
          {pluralize(summary.copied, noun)} copied to
        </span>
        <span className={cn('font-mono text-caption wrap-anywhere', needsAttention ? 'text-warning-path' : 'text-success-ink-soft')}>
          {destination}
        </span>
        {details && <span className={cn('mt-1 text-meta', needsAttention ? 'text-warning-ink' : 'text-success-ink-soft')}>{details}</span>}
      </div>
      <button
        ref={actionRef}
        type="button"
        onClick={onStartNewBatch}
        className={cn(
          'min-h-11 cursor-pointer rounded-control border bg-surface px-4 text-label font-bold transition-colors',
          needsAttention ? 'border-warning-line text-warning-ink hover:bg-warning-soft' : 'border-success-border text-success-ink hover:bg-success-soft',
        )}
      >
        Start a new batch
      </button>
    </div>
  );
}
