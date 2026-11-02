import { Check } from 'lucide-react';
import type { Step, StepState } from '../../app/progressSteps';
import { cn } from '../../utils/cn';

const STYLES: Record<StepState, { pill: string; badge: string; srLabel: string }> = {
  current: { pill: 'bg-accent/10 text-ink', badge: 'bg-accent text-white', srLabel: ' (current step)' },
  done: { pill: 'bg-chip text-ink', badge: 'bg-success text-white', srLabel: ' (done)' },
  todo: { pill: 'text-muted', badge: 'bg-line text-ink-soft', srLabel: '' },
};

export function ProgressSteps({ steps }: { steps: Step[] }) {
  return (
    <ol aria-label="Progress" className="m-0 flex list-none flex-wrap gap-2 p-0">
      {steps.map((step, index) => {
        const style = STYLES[step.state];
        return (
          <li
            key={step.label}
            aria-current={step.state === 'current' ? 'step' : undefined}
            className={cn('flex items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 text-meta font-semibold transition-colors', style.pill)}
          >
            <span aria-hidden="true" className={cn('flex size-6 items-center justify-center rounded-full text-caption font-bold transition-colors', style.badge)}>
              {step.state === 'done' ? <Check size={14} strokeWidth={3} /> : index + 1}
            </span>
            <span>
              {step.label}
              <span className="sr-only">{style.srLabel}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
