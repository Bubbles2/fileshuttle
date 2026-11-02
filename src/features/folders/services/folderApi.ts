import { folderListingSchema, type FolderListing, type FolderListRequest } from '../../../../shared/api.ts';
import { postJson } from '../../../services/apiClient';

/**
 * Lists the sub-folders of `path` (plus its CSV files with `files: 'csv'`). With
 * `path` null it lists `start`: the starting places (home and drives) by default.
 */
export function fetchFolders(request: FolderListRequest, signal?: AbortSignal): Promise<FolderListing> {
  return postJson('/api/folders', request, folderListingSchema, signal);
}
