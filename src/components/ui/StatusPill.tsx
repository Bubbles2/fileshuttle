import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type PillTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONES: Record<PillTone, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning-ink',
  danger: 'bg-danger-soft text-danger-ink',
  info: 'bg-accent-soft text-accent-strong',
  neutral: 'bg-chip text-muted',
};

interface StatusPillProps {
  tone: PillTone;
  icon?: ReactNode;
  children: ReactNode;
}

export function StatusPill({ tone, icon, children }: StatusPillProps) {
  return (
    <span className={cn('inline-flex flex-none items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-bold', TONES[tone])}>
      {icon}
      {children}
    </span>
  );
}
