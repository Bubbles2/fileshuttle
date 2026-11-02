/**
 * Request and response contract between the browser and the local server.
 * Both sides validate with these schemas: the server never trusts the client,
 * and the client never trusts a response it has not parsed.
 */
import { z } from 'zod';

export const MAX_PATH_LENGTH = 4096;
export const MAX_INSPECT_BATCH = 500;
export const MAX_CSV_BYTES = 5 * 1024 * 1024;
export const CSV_TOO_LARGE = 'This CSV is larger than 5 MB. Split it into smaller lists.';

/** Per-launch secret the browser sends with every API call (see SECURITY.md). */
export const API_KEY_HEADER = 'X-FileShuttle-Key';

const pathString = z
  .string()
  .min(1)
  .max(MAX_PATH_LENGTH)
  .refine((value) => !value.includes('\0'), { error: 'Path contains an invalid character' });

/** "network": a UNC or device path that was not checked, because network paths are turned off. */
export const pathKindSchema = z.enum(['file', 'folder', 'missing', 'network']);
export type PathKind = z.infer<typeof pathKindSchema>;

export const conflictPolicySchema = z.enum(['skip', 'overwrite', 'rename']);
export type ConflictPolicy = z.infer<typeof conflictPolicySchema>;

export const copyOutcomeSchema = z.enum(['copied', 'skipped', 'failed']);
export type CopyOutcome = z.infer<typeof copyOutcomeSchema>;

export const inspectRequestSchema = z.strictObject({
  paths: z.array(pathString).min(1).max(MAX_INSPECT_BATCH),
});
export type InspectRequest = z.infer<typeof inspectRequestSchema>;

export const inspectResponseSchema = z.object({
  results: z.array(z.object({ path: z.string(), kind: pathKindSchema })),
});
export type InspectResponse = z.infer<typeof inspectResponseSchema>;

/** A single file or folder name: no separators, no "." or "..". */
const plainName = z
  .string()
  .min(1)
  .max(255)
  .refine((value) => !/[\\/\0]/.test(value) && value !== '.' && value !== '..', { error: 'Not a plain file name' });

export const copyRequestSchema = z.strictObject({
  source: pathString,
  destination: pathString,
  policy: conflictPolicySchema,
  /** Copy under this name instead of the source's own (e.g. agent.md → agent.toml for Codex). */
  targetName: plainName.optional(),
});
export type CopyRequest = z.infer<typeof copyRequestSchema>;

export const copyResponseSchema = z.object({
  outcome: copyOutcomeSchema,
  target: z.string().optional(),
  message: z.string().optional(),
});
export type CopyResponse = z.infer<typeof copyResponseSchema>;

/** Where a listing for `path: null` starts: the home folder and drives, or the folder FileShuttle was started from. */
export const listingStartSchema = z.enum(['places', 'working-folder']);
export type ListingStart = z.infer<typeof listingStartSchema>;

/** `path: null` asks for `start` (by default the starting places). `files: 'csv'` also lists the folder's CSV files. */
export const folderListRequestSchema = z.strictObject({
  path: pathString.nullable(),
  start: listingStartSchema.default('places'),
  files: z.literal('csv').optional(),
});
export type FolderListRequest = z.input<typeof folderListRequestSchema>;

const listingEntrySchema = z.object({ name: z.string(), path: z.string() });

export const folderListingSchema = z.object({
  /** The folder being shown, or null for the starting places. */
  path: z.string().nullable(),
  /** Where "Up" goes; null means the starting places. */
  parent: z.string().nullable(),
  entries: z.array(listingEntrySchema),
  /** The folder's CSV files, when they were asked for. */
  files: z.array(listingEntrySchema).optional(),
  truncated: z.boolean(),
  message: z.string().optional(),
});
export type FolderListing = z.infer<typeof folderListingSchema>;

/** A CSV file picked in the CSV browser; the server answers with its raw bytes. */
export const csvFileRequestSchema = z.strictObject({
  path: pathString,
});
export type CsvFileRequest = z.infer<typeof csvFileRequestSchema>;

/** The guidance documents shown in the sidebar. The server maps each name to one fixed file. */
export const guideNameSchema = z.enum(['claude', 'agents']);
export type GuideName = z.infer<typeof guideNameSchema>;

/** "full" is the guide itself; "summary" is its _SHORT version. */
export const guideVariantSchema = z.enum(['full', 'summary']);
export type GuideVariant = z.infer<typeof guideVariantSchema>;

export const guideRequestSchema = z.strictObject({ name: guideNameSchema, variant: guideVariantSchema.default('full') });

export const guideResponseSchema = z.object({
  name: guideNameSchema,
  variant: guideVariantSchema,
  fileName: z.string(),
  path: z.string(),
  content: z.string(),
});
export type GuideResponse = z.infer<typeof guideResponseSchema>;

export const errorResponseSchema = z.object({ error: z.string() });
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
