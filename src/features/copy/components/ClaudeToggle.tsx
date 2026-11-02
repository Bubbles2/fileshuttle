import { useId } from 'react';
import { subfolderFor } from '../utils/destinationFolders';

interface ClaudeToggleProps {
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}

/** Ticked: .claude\skills and .claude\agents. Unticked: .agents\skills and .codex\agents (agents as .toml). */
export function ClaudeToggle({ checked, disabled, onChange }: ClaudeToggleProps) {
  const hintId = useId();
  return (
    <div className="flex flex-col gap-1 rounded-control border border-line bg-surface-subtle px-3.5 py-3">
      <label className="inline-flex cursor-pointer items-center gap-2.5 text-label font-bold has-disabled:cursor-not-allowed">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-describedby={hintId}
          onChange={(event) => {
            onChange(event.target.checked);
          }}
          className="size-5 cursor-pointer accent-accent disabled:cursor-not-allowed"
        />
        Claude
      </label>
      <p id={hintId} className="m-0 pl-7.5 text-meta text-muted">
        Skills go into <span className="font-mono">{subfolderFor('skill', checked)}</span>, agents into{' '}
        <span className="font-mono">{subfolderFor('agent', checked)}</span>
        {checked ? '.' : ' as .toml files.'} {checked ? 'Untick for Codex and other agents.' : 'Tick for Claude.'}
      </p>
    </div>
  );
}
