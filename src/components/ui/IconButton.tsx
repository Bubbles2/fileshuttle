import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

type IconButtonVariant = 'outline' | 'ghost';

const VARIANTS: Record<IconButtonVariant, string> = {
  outline: 'border border-line-strong bg-surface text-accent hover:border-accent hover:bg-accent-soft',
  ghost: 'text-muted hover:bg-chip hover:text-ink',
};

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Accessible name; icon buttons have no visible text. */
  label: string;
  variant?: IconButtonVariant;
  children: ReactNode;
}

export function IconButton({ label, variant = 'outline', className, children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-11 flex-none cursor-pointer items-center justify-center rounded-control transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
