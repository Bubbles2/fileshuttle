import { Copy, LoaderCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { pluralize } from '../../../utils/paths';

interface CopyButtonProps {
  count: number;
  /** "skill", "agent" or "item". */
  noun: string;
  copying: boolean;
  disabled: boolean;
  onClick: () => void;
}

function labelFor(count: number, noun: string, copying: boolean): string {
  if (copying) return `Copying ${pluralize(count, noun)}…`;
  if (count === 0) return 'Add skills or agents to copy';
  return `Copy ${pluralize(count, noun)} to destination`;
}

/**
 * While copying, the button stays focusable (aria-disabled rather than disabled)
 * so keyboard focus isn't thrown back to the top of the page.
 */
export function CopyButton({ count, noun, copying, disabled, onClick }: CopyButtonProps) {
  const inactive = disabled || copying;
  return (
    <button
      type="button"
      disabled={disabled && !copying}
      aria-disabled={copying || undefined}
      aria-busy={copying || undefined}
      onClick={() => {
        if (!inactive) onClick();
      }}
      className={cn(
        'flex min-h-13.5 items-center justify-center gap-2.5 rounded-row px-4 text-lead font-extrabold transition-[background-color,box-shadow]',
        copying || !disabled ? 'bg-accent text-white shadow-cta' : 'cursor-not-allowed bg-line text-muted',
        !inactive && 'cursor-pointer hover:bg-accent-strong',
        copying && 'cursor-progress',
      )}
    >
      {copying ? (
        <LoaderCircle size={20} strokeWidth={2.2} aria-hidden="true" className="motion-safe:animate-spin" />
      ) : (
        <Copy size={20} strokeWidth={2.2} aria-hidden="true" />
      )}
      {labelFor(count, noun, copying)}
    </button>
  );
}
