import { ArrowDownToLine } from 'lucide-react';

export function BasketEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2.5 px-4 py-8 text-center">
      <div aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent">
        <ArrowDownToLine size={28} strokeWidth={2} />
      </div>
      <span className="text-lead font-bold">Drag skills here</span>
      <span className="max-w-75 text-label text-muted">Drop skills from the list, or use the + button on any card.</span>
    </div>
  );
}
