/**
 * Decodes CSV bytes as UTF-8, falling back to Windows-1252 — the encoding
 * Excel uses for "CSV" exports on Western European Windows machines.
 */
export function decodeCsvBytes(bytes: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}
