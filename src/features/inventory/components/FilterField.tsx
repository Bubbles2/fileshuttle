import { Search } from 'lucide-react';
import { useId } from 'react';

interface FilterFieldProps {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function FilterField({ value, disabled, onChange }: FilterFieldProps) {
  const id = useId();
  return (
    <div className="focus-ring-within flex min-h-11 items-center gap-2.5 rounded-control border border-line-strong bg-surface-subtle px-3.5 has-disabled:opacity-60">
      <Search size={18} aria-hidden="true" className="flex-none text-muted" />
      <label htmlFor={id} className="sr-only">
        Filter skills
      </label>
      <input
        id={id}
        type="search"
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder="Filter by name, description, category or technology"
        autoComplete="off"
        className="h-10.5 min-w-0 flex-1 bg-transparent text-label text-ink outline-none placeholder:text-placeholder disabled:cursor-not-allowed"
      />
    </div>
  );
}
