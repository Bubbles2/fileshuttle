import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

type ItemTextTone = 'default' | 'dimmed' | 'warning';

const TONES: Record<ItemTextTone, { primary: string; secondary: string }> = {
  default: { primary: 'text-ink', secondary: 'text-muted' },
  dimmed: { primary: 'text-muted', secondary: 'text-faint' },
  warning: { primary: 'text-ink', secondary: 'text-warning-path' },
};

interface ItemTextProps {
  primary: string;
  /** A path, shown in monospace. */
  secondary: string;
  tone?: ItemTextTone;
  note?: ReactNode;
}

/** Description over path, both truncated to one line with the full text on hover. */
export function ItemText({ primary, secondary, tone = 'default', note }: ItemTextProps) {
  const colors = TONES[tone];
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <span title={primary} className={cn('truncate text-body font-semibold', colors.primary)}>
        {primary}
      </span>
      <span title={secondary} className={cn('truncate font-mono text-caption', colors.secondary)}>
        {secondary}
      </span>
      {note}
    </div>
  );
}
