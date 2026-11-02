import type { CopyOutcome } from '../../../shared/api.ts';

export type CopyPhase = 'idle' | 'copying' | 'done';

/** Server outcomes plus the states only the browser knows about. */
export type CopyItemStatus = 'waiting' | 'copying' | 'stopped' | CopyOutcome;

export interface CopyItemProgress {
  status: CopyItemStatus;
  target?: string;
  message?: string;
}

export interface CopySummary {
  copied: number;
  skipped: number;
  failed: number;
  stopped: number;
}

export interface CopyJobItem {
  id: string;
  /** Full path of the skill folder or agent file. */
  location: string;
  /** Folder it is copied into (differs for skills and agents). */
  destination: string;
  /** Name in the destination, when not the source's own (e.g. agent.toml for Codex). */
  targetName: string | undefined;
}
