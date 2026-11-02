import type { Step } from '../../app/progressSteps';
import { BrandArrowsIcon } from '../ui/icons';
import { ProgressSteps } from './ProgressSteps';

export function AppHeader({ steps }: { steps: Step[] }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-chrome-line bg-chrome px-4 py-3.5 sm:px-8">
      <div className="flex items-center gap-3">
        <div aria-hidden="true" className="flex size-9.5 items-center justify-center rounded-logo bg-accent text-white">
          <BrandArrowsIcon />
        </div>
        <div className="flex flex-col">
          <h1 className="m-0 text-brand leading-tight font-extrabold tracking-[-0.02em] text-ink">FileShuttle</h1>
          <span className="text-caption text-muted">Pick skills, copy them to a project</span>
        </div>
      </div>
      <ProgressSteps steps={steps} />
    </header>
  );
}
