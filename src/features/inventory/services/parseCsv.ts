export type Delimiter = ',' | ';' | '\t';

const DELIMITERS: Delimiter[] = [',', ';', '\t'];

export class CsvSyntaxError extends Error {
  readonly line: number;

  constructor(line: number) {
    super(`Line ${line} opens a quote that is never closed.`);
    this.name = 'CsvSyntaxError';
    this.line = line;
  }
}

function countOutsideQuotes(line: string, delimiter: Delimiter): number {
  let count = 0;
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === delimiter && !inQuotes) count += 1;
  }
  return count;
}

/** Picks the delimiter used most in the header row (Excel uses ";" in many locales). */
export function detectDelimiter(text: string): Delimiter {
  const header = text.split(/\r?\n/, 1)[0] ?? '';
  let best: Delimiter = ',';
  let bestCount = 0;
  for (const delimiter of DELIMITERS) {
    const count = countOutsideQuotes(header, delimiter);
    if (count > bestCount) {
      best = delimiter;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Parses RFC 4180 CSV: quoted fields (optionally preceded by spaces), doubled
 * quotes, and line breaks inside quotes. Blank lines are dropped.
 * Throws CsvSyntaxError for an unclosed quote rather than silently merging rows.
 */
export function parseCsv(text: string, delimiter: Delimiter = detectDelimiter(text)): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let line = 1;
  let quoteLine = 1;

  for (let i = 0; i < text.length; i += 1) {
    const char = text.charAt(i);
    if (char === '\n') line += 1;

    if (inQuotes) {
      if (char !== '"') field += char;
      else if (text.charAt(i + 1) === '"') {
        field += '"';
        i += 1;
      } else inQuotes = false;
    } else if (char === '"' && field.trim() === '') {
      inQuotes = true;
      quoteLine = line;
      field = '';
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text.charAt(i + 1) === '\n') {
        i += 1;
        line += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (inQuotes) throw new CsvSyntaxError(quoteLine);
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
}
