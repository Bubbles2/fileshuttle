import { CsvListIcon } from '../../../components/ui/icons';
import { Panel } from '../../../components/ui/Panel';
import type { InventoryState } from '../types';
import { CsvFilePicker } from './CsvFilePicker';
import { InputListStatus } from './InputListStatus';

interface InputListCardProps {
  state: InventoryState;
  disabled: boolean;
  onCsvSelected: (source: string | File) => void;
}

function announcement(state: InventoryState): string {
  if (state.status === 'loading') return state.message;
  if (state.status === 'ready') return `${state.inventory.fileName} loaded.`;
  return '';
}

export function InputListCard({ state, disabled, onCsvSelected }: InputListCardProps) {
  return (
    <Panel as="section" variant="bar" aria-label="Skills inventory" className="flex flex-wrap items-center gap-4">
      <div aria-hidden="true" className="flex size-12 flex-none items-center justify-center rounded-control bg-accent-soft text-accent">
        <CsvListIcon />
      </div>
      <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
        <span className="text-caption font-bold tracking-[0.08em] text-muted uppercase">Skills inventory</span>
        <InputListStatus state={state} />
      </div>
      <p role="status" className="sr-only">
        {announcement(state)}
      </p>
      <CsvFilePicker
        label={state.status === 'empty' ? 'Choose a CSV' : 'Choose another CSV'}
        disabled={disabled || state.status === 'loading'}
        onSelected={onCsvSelected}
      />
    </Panel>
  );
}
