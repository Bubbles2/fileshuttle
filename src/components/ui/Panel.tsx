import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

type PanelVariant = 'card' | 'bar';

const VARIANTS: Record<PanelVariant, string> = {
  card: 'rounded-card p-5',
  bar: 'rounded-panel px-5 py-4',
};

interface PanelProps extends HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div';
  variant?: PanelVariant;
}

/** White surface with the design's hairline border, lifted off the dark page. */
export function Panel({ as: Tag = 'div', variant = 'card', className, ...props }: PanelProps) {
  return <Tag className={cn('min-w-0 border border-line bg-surface shadow-card', VARIANTS[variant], className)} {...props} />;
}
