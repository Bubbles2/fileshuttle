import { describe, expect, it } from 'vitest';
import { CsvSyntaxError, detectDelimiter, parseCsv } from './parseCsv';

describe('detectDelimiter', () => {
  it('picks the delimiter used in the header row', () => {
    expect(detectDelimiter('description,location\n')).toBe(',');
    expect(detectDelimiter('description;location\n')).toBe(';');
    expect(detectDelimiter('description\tlocation\n')).toBe('\t');
  });

  it('ignores delimiters inside quotes', () => {
    expect(detectDelimiter('"a;b;c",location,other\n')).toBe(',');
  });
});

describe('parseCsv', () => {
  it('parses simple rows with CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('handles quoted fields with commas, doubled quotes and line breaks', () => {
    const csv = 'description,location\n"Report, final","C:\\Docs\\a.pdf"\n"Say ""hi""","line\nbreak"\n';
    expect(parseCsv(csv)).toEqual([
      ['description', 'location'],
      ['Report, final', 'C:\\Docs\\a.pdf'],
      ['Say "hi"', 'line\nbreak'],
    ]);
  });

  it('keeps Windows backslashes untouched', () => {
    expect(parseCsv('location\nD:\\Media\\Photos\\spring')[1]).toEqual(['D:\\Media\\Photos\\spring']);
  });

  it('parses semicolon files exported by Excel in European locales', () => {
    expect(parseCsv('description;location\nRapport;C:\\Données\\été.xlsx')).toEqual([
      ['description', 'location'],
      ['Rapport', 'C:\\Données\\été.xlsx'],
    ]);
  });

  it('drops blank lines and keeps a last row without a trailing newline', () => {
    expect(parseCsv('a,b\n\n1,2\n   \n3,4')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('returns no rows for empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });

  it('allows spaces before an opening quote', () => {
    expect(parseCsv('a,b\nA, "C:\\x, y.txt"')[1]).toEqual(['A', 'C:\\x, y.txt']);
  });

  it('throws with the line number when a quote is never closed', () => {
    expect(() => parseCsv('a,b\r\nok,1\r\n"broken,2\r\nnext,3')).toThrow(CsvSyntaxError);
    expect(() => parseCsv('a,b\r\nok,1\r\n"broken,2\r\nnext,3')).toThrow('Line 3 opens a quote');
  });
});
