import { ArrowUpFromLine } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { FolderPickerDialog } from '../../folders/components/FolderPickerDialog';

interface CsvFilePickerProps {
  label: string;
  disabled: boolean;
  /** A path picked in FileShuttle's CSV browser, or a file opened with the browser's own dialog. */
  onSelected: (source: string | File) => void;
}

/**
 * Opens FileShuttle's CSV browser in the folder the server was started from,
 * listing only folders and CSV files. The browser's own file dialog can't be
 * told where to open, so it is only a fallback (e.g. when the server is down);
 * a file chosen there is read in the browser, not uploaded.
 */
export function CsvFilePicker({ label, disabled, onSelected }: CsvFilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [browsing, setBrowsing] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onSelected(file);
  }

  return (
    <>
      <input ref={inputRef} type="file" accept=".csv,text/csv" hidden tabIndex={-1} onChange={handleChange} />
      <Button
        variant="outline"
        disabled={disabled}
        onClick={() => {
          setBrowsing(true);
        }}
      >
        <ArrowUpFromLine size={18} aria-hidden="true" />
        {label}
      </Button>
      {browsing && (
        <FolderPickerDialog
          title="Choose a skills CSV"
          initialPath={null}
          start="working-folder"
          files="csv"
          otherAction={{ label: 'Use the system file dialog…', onChoose: () => inputRef.current?.click() }}
          onSelect={onSelected}
          onClose={() => {
            setBrowsing(false);
          }}
        />
      )}
    </>
  );
}
