import type { ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface BasketDropZoneProps {
  /** True while a skill is dragged anywhere over the basket card. */
  highlighted: boolean;
  children: ReactNode;
}

/** The dashed area that shows where dragged skills land. The whole basket card accepts the drop. */
export function BasketDropZone({ highlighted, children }: BasketDropZoneProps) {
  return (
    <div
      className={cn(
        'flex min-h-75 flex-col gap-2 rounded-panel border-2 border-dashed p-3 transition-colors duration-150',
        highlighted ? 'border-accent bg-accent/8' : 'border-line-dashed bg-surface-subtle',
      )}
    >
      {children}
    </div>
  );
}
