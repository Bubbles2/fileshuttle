import { useId } from 'react';
import { cn } from '../../../utils/cn';
import type { ItemType } from '../types';

const OPTIONS: { type: ItemType; letter: string; label: string }[] = [
  { type: 'agent', letter: 'A', label: 'Agents' },
  { type: 'skill', letter: 'S', label: 'Skills' },
];

interface TypeFilterProps {
  value: ItemType;
  counts: Record<ItemType, number>;
  onChange: (type: ItemType) => void;
}

/** Bean-shaped A / S switch that shows either agents or skills. Built on native radios for keyboard use. */
export function TypeFilter({ value, counts, onChange }: TypeFilterProps) {
  const name = useId();
  return (
    <fieldset className="m-0 flex flex-wrap gap-2 border-0 p-0">
      <legend className="sr-only">Show</legend>
      {OPTIONS.map((option) => {
        const checked = value === option.type;
        return (
          <label
            key={option.type}
            className={cn(
              'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border py-1 pr-4 pl-1 text-label font-bold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent',
              checked ? 'border-accent bg-accent text-white shadow-cta' : 'border-line-strong bg-surface text-ink hover:bg-accent-soft',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.type}
              checked={checked}
              onChange={() => {
                onChange(option.type);
              }}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={cn('flex size-8 items-center justify-center rounded-full text-label font-extrabold', checked ? 'bg-white text-accent' : 'bg-chip text-ink')}
            >
              {option.letter}
            </span>
            {option.label}
            <span className={cn('text-meta font-semibold', checked ? 'text-white/85' : 'text-muted')}>{counts[option.type]}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
