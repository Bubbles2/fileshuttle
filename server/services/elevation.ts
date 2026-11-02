import { spawnSync } from 'node:child_process';
import path from 'node:path';

// Windows integrity levels: High (elevated administrator) and System.
const ELEVATED_SIDS = ['S-1-16-12288', 'S-1-16-16384'];
const UAC_POLICY_KEY = 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System';

/**
 * - standard: normal user rights.
 * - elevated: Administrator/root, although the user could have started it without.
 * - unavoidable: Administrator because Windows UAC is off, so every program on this PC runs elevated.
 */
export type Elevation = 'standard' | 'elevated' | 'unavoidable';

/** Reads `whoami /groups` output. */
export function hasElevatedIntegrity(whoamiGroups: string): boolean {
  return ELEVATED_SIDS.some((sid) => whoamiGroups.includes(sid));
}

/** Reads `reg query … /v EnableLUA` output. Only an explicit 0 counts as "UAC off"; anything unreadable counts as on. */
export function isUacEnabled(regQueryOutput: string): boolean {
  const match = /EnableLUA\s+REG_DWORD\s+0x([0-9a-f]+)/i.exec(regQueryOutput);
  return match?.[1] === undefined || Number.parseInt(match[1], 16) !== 0;
}

/** Runs a Windows tool by its full System32 path, so Git Bash's `whoami` or anything else on PATH can't stand in for it. */
function system32Output(tool: string, args: string[]): string {
  const executable = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', tool);
  const result = spawnSync(executable, args, { encoding: 'utf8', windowsHide: true });
  return result.status === 0 ? result.stdout : '';
}

export function detectElevation(): Elevation {
  if (process.platform !== 'win32') return process.getuid?.() === 0 ? 'elevated' : 'standard';
  if (!hasElevatedIntegrity(system32Output('whoami.exe', ['/groups']))) return 'standard';
  return isUacEnabled(system32Output('reg.exe', ['query', UAC_POLICY_KEY, '/v', 'EnableLUA'])) ? 'elevated' : 'unavoidable';
}
