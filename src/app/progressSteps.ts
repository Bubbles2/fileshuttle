export type StepState = 'todo' | 'current' | 'done';

export interface Step {
  label: string;
  state: StepState;
}

const LABELS = ['Load CSV', 'Pick skills', 'Copy'] as const;

interface ProgressInput {
  hasInventory: boolean;
  basketCount: number;
  copyDone: boolean;
}

export function progressSteps({ hasInventory, basketCount, copyDone }: ProgressInput): Step[] {
  let states: StepState[];
  if (copyDone) states = ['done', 'done', 'done'];
  else if (basketCount > 0) states = ['done', 'done', 'current'];
  else if (hasInventory) states = ['done', 'current', 'todo'];
  else states = ['current', 'todo', 'todo'];
  return LABELS.map((label, index) => ({ label, state: states[index] ?? 'todo' }));
}
