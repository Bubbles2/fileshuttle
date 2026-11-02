import type { CopyItemProgress } from '../copy/types';

/** Flat, mostly primitive fields so memoised rows only re-render when their own data changes. */
export interface BasketRow {
  id: string;
  name: string;
  /** The skill folder that will be copied (resolved against the Copy from folder when relative). */
  source: string;
  progress: CopyItemProgress | undefined;
  /** Position of an earlier basket item that would land under the same name. */
  clashWith: number | undefined;
}
