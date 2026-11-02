export const TOO_DEEP = 'FILESHUTTLE_TOO_DEEP';

/** Turns file-system errors into short, safe messages. Raw errors never reach the browser. */
const MESSAGES: Record<string, string> = {
  [TOO_DEEP]: 'The folder is nested too deeply to copy safely',
  ELOOP: 'The folder contains a link that points back into itself',
  ENOENT: 'Not found on disk',
  EACCES: 'Permission denied',
  EPERM: 'Permission denied',
  EBUSY: 'The file is in use by another program',
  ENOSPC: 'Not enough space on the destination drive',
  EEXIST: 'Already exists in the destination',
  ENOTDIR: 'Part of the destination path is a file, not a folder',
  EISDIR: 'A folder is in the way of this file',
  ENAMETOOLONG: 'The path is too long',
  EROFS: 'The destination is read-only',
  EINVAL: 'The path is not valid on this computer',
  ERR_FS_CP_EINVAL: 'A folder cannot be copied into itself',
  ERR_FS_CP_DIR_TO_NON_DIR: 'A file with the same name is in the way',
  ERR_FS_CP_NON_DIR_TO_DIR: 'A folder with the same name is in the way',
};

export const GENERIC_COPY_ERROR = 'Could not copy this item';

export function errorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return undefined;
}

export function copyErrorMessage(error: unknown): string {
  const code = errorCode(error);
  const message = code ? MESSAGES[code] : undefined;
  return message ?? GENERIC_COPY_ERROR;
}
