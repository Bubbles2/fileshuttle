/** Starting folders for this installation. Change them here; a Copy from folder chosen in the app is remembered instead. */
export const DEFAULT_SOURCE_FOLDER = 'C:\\AI_Donncha\\fileshuttle\\';
export const DEFAULT_DESTINATION_FOLDER = 'C:\\Users\\D.Finlay\\SaveCrap';
/** Ticked "Claude": copy into <destination>\.claude\skills; unticked: <destination>\.agents\skills. */
export const DEFAULT_FOR_CLAUDE = true;

export type Platform = 'windows' | 'mac';
/** Windows uses the folders above. Choosing Mac fills in the Mac folders below. */
export const DEFAULT_PLATFORM: Platform = 'windows';
export const MAC_SOURCE_FOLDER = '/Users/dcfinlay/Development/AI/fileshuttle/central_skills/';
export const MAC_DESTINATION_FOLDER = '/Users/dcfinlay/';
