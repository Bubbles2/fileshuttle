/** A skill is a folder (with SKILL.md); an agent is a single .md file. */
export type ItemType = 'skill' | 'agent';

/** One row of a skills / agents inventory CSV. */
export interface SkillRow {
  type: ItemType;
  name: string;
  description: string;
  category: string;
  technology: string;
  copies: number | null;
  distinctVersions: number | null;
  worktreeCopies: number | null;
  foundIn: string[];
  otherNames: string[];
  /** The "Central copy" cell as written: the skill folder that gets copied. */
  centralCopy: string;
}

export interface InventoryItem extends SkillRow {
  /** Unique across loads and browser tabs, so a stale drag can't add the wrong item. */
  id: string;
  /** The folder copied for this skill (the central copy path). */
  location: string;
}

export interface Inventory {
  /** Changes every time a CSV is loaded. */
  id: string;
  fileName: string;
  items: InventoryItem[];
  rowCount: number;
  skippedRows: number;
  duplicateRows: number;
}

export type InventoryState =
  | { status: 'empty' }
  | { status: 'loading'; fileName: string; message: string }
  | { status: 'error'; fileName?: string; message: string }
  | { status: 'ready'; inventory: Inventory };
