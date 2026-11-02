import { useId } from 'react';
import type { ConflictPolicy } from '../../../../shared/api.ts';

const POLICIES: { value: ConflictPolicy; label: string; hint: string }[] = [
  { value: 'skip', label: 'Skip', hint: 'Anything already in the destination is left as it is.' },
  { value: 'overwrite', label: 'Overwrite', hint: 'Existing files are replaced. Existing folders are merged.' },
  { value: 'rename', label: 'Keep both', hint: 'New copies get a number, like docx (1).' },
];

interface ConflictPolicyPickerProps {
  value: ConflictPolicy;
  disabled: boolean;
  onChange: (value: ConflictPolicy) => void;
}

/** Segmented control built on native radios, so arrow keys and screen readers work as expected. */
export function ConflictPolicyPicker({ value, disabled, onChange }: ConflictPolicyPickerProps) {
  const name = useId();
  const hintId = `${name}-hint`;
  const selected = POLICIES.find((policy) => policy.value === value) ?? POLICIES[0];

  return (
    <fieldset disabled={disabled} aria-describedby={hintId} className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 p-0 text-label font-bold">If a file already exists</legend>
      <div className="flex flex-wrap gap-1 rounded-row bg-chip p-1">
        {POLICIES.map((policy) => (
          <label
            key={policy.value}
            className="flex min-h-11 flex-[1_1_120px] cursor-pointer items-center justify-center rounded-tile text-label font-bold text-muted transition-[background-color,color,box-shadow] hover:text-ink has-checked:bg-surface has-checked:text-ink has-checked:shadow-segment has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent has-disabled:cursor-not-allowed"
          >
            <input
              type="radio"
              name={name}
              value={policy.value}
              checked={value === policy.value}
              onChange={() => {
                onChange(policy.value);
              }}
              className="sr-only"
            />
            {policy.label}
          </label>
        ))}
      </div>
      <p id={hintId} className="m-0 text-meta text-muted">
        {selected?.hint}
      </p>
    </fieldset>
  );
}
