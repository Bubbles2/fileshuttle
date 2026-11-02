import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

type ButtonVariant = 'primary' | 'outline' | 'accentText' | 'mutedText';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'gap-2 bg-accent px-4.5 font-bold text-white hover:bg-accent-strong',
  outline: 'gap-2 border border-line-strong bg-surface px-4.5 font-semibold text-ink hover:border-muted/40 hover:bg-surface-subtle',
  accentText: 'gap-2 px-3.5 font-bold text-accent hover:bg-accent-soft',
  mutedText: 'gap-2 px-3.5 font-semibold text-muted hover:bg-chip hover:text-ink',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'outline', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-11 flex-none cursor-pointer items-center justify-center rounded-control text-label transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
