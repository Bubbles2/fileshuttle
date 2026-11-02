import { Folder, FolderOpen } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';
import { FolderPickerDialog } from '../../folders/components/FolderPickerDialog';

interface FolderFieldProps {
  label: string;
  hint: string;
  placeholder: string;
  /** Title of the folder picker, e.g. "Choose the destination folder". */
  pickerTitle: string;
  /** Accessible name of the Browse… button, e.g. "Browse… for the destination folder". */
  browseLabel: string;
  value: string;
  error: string | null;
  readOnly: boolean;
  onChange: (value: string) => void;
}

/** A folder path that can be typed or picked with Browse…; errors show once the field has been used. */
export function FolderField(props: FolderFieldProps) {
  const { label, hint, placeholder, pickerTitle, browseLabel, value, error, readOnly, onChange } = props;
  const [touched, setTouched] = useState(false);
  const [picking, setPicking] = useState(false);
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const visibleError = touched && value.trim() !== '' ? error : null;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-label font-bold">
        {label}
      </label>
      <div className="flex flex-wrap items-start gap-2">
        <div
          className={cn(
            'focus-ring-within flex min-h-12 min-w-0 flex-[1_1_260px] items-center gap-2.5 rounded-control border bg-surface-subtle px-3.5',
            visibleError ? 'border-danger-ink' : 'border-line-strong',
          )}
        >
          <Folder size={18} strokeWidth={1.9} aria-hidden="true" className="flex-none text-folder" />
          <input
            id={id}
            type="text"
            value={value}
            readOnly={readOnly}
            onChange={(event) => {
              onChange(event.target.value);
            }}
            onBlur={() => {
              setTouched(true);
            }}
            placeholder={placeholder}
            spellCheck={false}
            autoComplete="off"
            aria-invalid={visibleError ? true : undefined}
            aria-describedby={visibleError ? `${errorId} ${hintId}` : hintId}
            className="h-11.5 min-w-0 flex-1 bg-transparent font-mono text-label text-ink outline-none placeholder:text-placeholder read-only:cursor-default"
          />
        </div>
        <Button
          variant="outline"
          disabled={readOnly}
          className="min-h-12"
          aria-label={browseLabel}
          onClick={() => {
            setPicking(true);
          }}
        >
          <FolderOpen size={18} aria-hidden="true" />
          Browse…
        </Button>
      </div>
      {visibleError && (
        <p id={errorId} className="m-0 text-meta font-semibold text-danger-ink">
          {visibleError}
        </p>
      )}
      <p id={hintId} className="m-0 text-meta text-muted">
        {hint}
      </p>
      {picking && (
        <FolderPickerDialog
          title={pickerTitle}
          initialPath={error ? null : value.trim()}
          onSelect={(folder) => {
            onChange(folder);
            setTouched(true);
          }}
          onClose={() => {
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}
