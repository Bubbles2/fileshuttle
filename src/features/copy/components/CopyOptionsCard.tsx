import type { ConflictPolicy } from '../../../../shared/api.ts';
import { Button } from '../../../components/ui/Button';
import { Panel } from '../../../components/ui/Panel';
import { useFocusAfterRender } from '../../../hooks/useFocusAfterRender';
import { pluralize } from '../../../utils/paths';
import type { CopyPhase, CopySummary } from '../types';
import type { CopyTarget } from '../utils/copyPlan';
import { describeExceptions } from '../utils/summarizeProgress';
import { ClaudeToggle } from './ClaudeToggle';
import { ConflictPolicyPicker } from './ConflictPolicyPicker';
import { CopyButton } from './CopyButton';
import { CopyResultBanner } from './CopyResultBanner';
import { FolderField } from './FolderField';

interface CopyOptionsCardProps {
  phase: CopyPhase;
  count: number;
  /** "skill", "agent", or "item" for a mixed basket. */
  noun: string;
  /** Shown only when a basket item's central copy is a relative path. */
  needsSourceFolder: boolean;
  sourceFolder: string;
  sourceFolderError: string | null;
  destination: string;
  destinationError: string | null;
  /** Where each kind of item actually goes (destination plus its .claude / .agents / .codex subfolder). */
  targets: CopyTarget[];
  forClaude: boolean;
  policy: ConflictPolicy;
  summary: CopySummary;
  canCopy: boolean;
  onSourceFolderChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onForClaudeChange: (value: boolean) => void;
  onPolicyChange: (value: ConflictPolicy) => void;
  onCopy: () => void;
  onStop: () => void;
  onStartNewBatch: () => void;
}

function announcement(phase: CopyPhase, count: number, noun: string, summary: CopySummary): string {
  if (phase === 'copying') return `Copying ${pluralize(count, noun)}…`;
  if (phase === 'idle') return '';
  const details = describeExceptions(summary, noun);
  return `Copy finished: ${pluralize(summary.copied, noun)} copied.${details ? ` ${details}.` : ''}`;
}

function TargetPreview({ target }: { target: CopyTarget }) {
  return (
    <p className="m-0 flex flex-col gap-0.5 rounded-control bg-accent-soft px-3 py-2 text-meta">
      <span className="font-semibold text-ink">
        {target.type === 'agent' ? 'Agents' : 'Skills'} will be copied to{target.renamesToToml ? ' (as .toml files)' : ''}
      </span>
      <span className="font-mono break-all text-ink">{target.path}</span>
    </p>
  );
}

export function CopyOptionsCard(props: CopyOptionsCardProps) {
  const { phase, count, noun, destination, destinationError, targets, policy, summary, canCopy } = props;
  const idle = phase === 'idle';
  const focusAfterRender = useFocusAfterRender();

  function startNewBatch() {
    props.onStartNewBatch();
    focusAfterRender(() => document.getElementById('source-title'));
  }

  return (
    <Panel className="flex flex-col gap-4.5">
      <ClaudeToggle checked={props.forClaude} disabled={!idle} onChange={props.onForClaudeChange} />
      {props.needsSourceFolder && (
        <FolderField
          label="Copy from folder"
          hint="Your CSV’s Central copy paths (like central_skills\skills\docx) start from this folder, usually the one that holds the CSV. FileShuttle remembers it."
          placeholder="e.g. C:\AI_Donncha\fileshuttle"
          pickerTitle="Choose the folder to copy from"
          browseLabel="Browse… for the copy from folder"
          value={props.sourceFolder}
          error={props.sourceFolderError}
          readOnly={!idle}
          onChange={props.onSourceFolderChange}
        />
      )}
      <FolderField
        label="Destination folder"
        hint="Choose the project folder. Missing folders are created."
        placeholder="e.g. D:\MyProject"
        pickerTitle="Choose the destination folder"
        browseLabel="Browse… for the destination folder"
        value={destination}
        error={destinationError}
        readOnly={!idle}
        onChange={props.onDestinationChange}
      />
      {!destinationError && (
        <div className="-mt-2 flex flex-col gap-2">
          {targets.map((target) => (
            <TargetPreview key={target.type} target={target} />
          ))}
        </div>
      )}
      <ConflictPolicyPicker value={policy} disabled={!idle} onChange={props.onPolicyChange} />
      {phase === 'done' ? (
        <CopyResultBanner
          summary={summary}
          noun={noun}
          destination={targets.length === 1 ? (targets[0]?.path ?? destination.trim()) : destination.trim()}
          onStartNewBatch={startNewBatch}
        />
      ) : (
        <CopyButton count={count} noun={noun} copying={phase === 'copying'} disabled={!canCopy} onClick={props.onCopy} />
      )}
      {phase === 'copying' && (
        <Button variant="mutedText" className="self-center" onClick={props.onStop}>
          Stop copying
        </Button>
      )}
      <p aria-live="polite" className="sr-only">
        {announcement(phase, count, noun, summary)}
      </p>
    </Panel>
  );
}
