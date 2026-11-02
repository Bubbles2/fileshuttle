import { describe, expect, it } from 'vitest';
import { MAX_DESCRIPTION_LENGTH, MAX_ROWS, parseInventory } from './parseInventory';

const HEADER =
  'Skill,Category,Technology,Description,Copies,Distinct versions,Copies in worktree folders,Found in projects,Other names used in SKILL.md,Central copy';

describe('parseInventory', () => {
  it('reads every column of the skills inventory format', () => {
    const csv = `${HEADER}\nmodern-browser-apis,"Frontend (React, Next.js, HTML, CSS)",Browser / Web APIs,"Prefer native APIs.",8,3,0,AgentSkill; codex/jde ;,use-modern-browser-apis,central_skills\\skills\\modern-browser-apis\n`;

    expect(parseInventory(csv)).toEqual({
      ok: true,
      value: {
        rows: [
          {
            type: 'skill',
            name: 'modern-browser-apis',
            category: 'Frontend (React, Next.js, HTML, CSS)',
            technology: 'Browser / Web APIs',
            description: 'Prefer native APIs.',
            copies: 8,
            distinctVersions: 3,
            worktreeCopies: 0,
            foundIn: ['AgentSkill', 'codex/jde'],
            otherNames: ['use-modern-browser-apis'],
            centralCopy: 'central_skills\\skills\\modern-browser-apis',
          },
        ],
        rowCount: 1,
        skippedRows: 0,
        duplicateRows: 0,
      },
    });
  });

  it('accepts columns in any order and case, with only the required ones present', () => {
    const result = parseInventory('CENTRAL COPY,description,skill\nC:\\Skills\\docx,Word files,docx\n');
    expect(result.ok && result.value.rows[0]).toMatchObject({
      name: 'docx',
      description: 'Word files',
      category: '',
      copies: null,
      foundIn: [],
      centralCopy: 'C:\\Skills\\docx',
    });
  });

  it('treats unreadable counts as unknown rather than rejecting the row', () => {
    const result = parseInventory('Skill,Description,Copies,Central copy\na,desc,many,C:\\a\nb,desc,-2,C:\\b\n');
    expect(result.ok && result.value.rows.map((row) => row.copies)).toEqual([null, null]);
  });

  it('skips rows without a skill name or central copy and counts them', () => {
    const result = parseInventory('Skill,Description,Central copy\n,no name,C:\\a\nno-path,desc,\ngood,desc,C:\\good\nnul,desc,"C:\\bad\0name"\n');
    expect(result.ok && result.value.rows.map((row) => row.name)).toEqual(['good']);
    expect(result.ok && result.value.skippedRows).toBe(3);
  });

  it('ignores repeated central copies, treating Windows and relative paths case-insensitively', () => {
    const csv = 'Skill,Description,Central copy\na,,central_skills\\skills\\docx\nb,,Central_Skills/skills/DOCX/\nc,,/srv/a\nd,,/srv/A\n';
    const result = parseInventory(csv);
    expect(result.ok && result.value.rows.map((row) => row.name)).toEqual(['a', 'c', 'd']);
    expect(result.ok && result.value.duplicateRows).toBe(1);
  });

  it('strips hidden text-direction characters and skips central copies that contain them', () => {
    const result = parseInventory('Skill,Description,Central copy\nre\u202Eport,desc\u202E,C:\\a\nspoof,desc,C:\\doc\u202Etxt\n');
    expect(result.ok && result.value.rows).toMatchObject([{ name: 'report', description: 'desc' }]);
    expect(result.ok && result.value.skippedRows).toBe(1);
  });

  it('truncates very long descriptions', () => {
    const long = 'x'.repeat(MAX_DESCRIPTION_LENGTH + 50);
    const result = parseInventory(`Skill,Description,Central copy\na,${long},C:\\a\n`);
    expect(result.ok && result.value.rows[0]?.description).toHaveLength(MAX_DESCRIPTION_LENGTH);
  });

  it.each([
    ['', 'This CSV is empty.'],
    ['description,location\nA,C:\\a', 'Missing columns: Skill (or Agent), Central copy.'],
    ['Skill,Central copy\nA,C:\\a', 'Missing columns: Description.'],
    ['Skill,Description,Central copy\n', 'header row but no skills'],
    ['Skill,Description,Central copy\n,desc,\n', 'None of the rows have both a skill name and a central copy path.'],
    ['Skill,Description,Central copy\n"Broken,desc,C:\\a\n', 'Line 2 opens a quote that is never closed.'],
  ])('rejects %j', (csv, message) => {
    const result = parseInventory(csv);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain(message);
  });

  it('rejects lists longer than the row limit', () => {
    const rows = Array.from({ length: MAX_ROWS + 1 }, (_, i) => `s${i},d,C:\\s${i}`).join('\n');
    const result = parseInventory(`Skill,Description,Central copy\n${rows}`);
    expect(!result.ok && result.error).toContain(`up to ${MAX_ROWS}`);
  });
});

describe('parseInventory item types', () => {
  it('reads the Type column (A / S, or Agent / Skill)', () => {
    const csv = 'Skill,Type,Description,Central copy\ndocx,S,d,C:\\s\\docx\nreviewer,A,d,C:\\a\\reviewer.md\nwriter,Agent,d,C:\\a\\writer.md\n';
    const result = parseInventory(csv);
    expect(result.ok && result.value.rows.map((row) => row.type)).toEqual(['skill', 'agent', 'agent']);
  });

  it('treats an "Agent" name column as agents, and otherwise single .md files as agents', () => {
    const agents = parseInventory('Agent,Description,Central copy\nreviewer,d,central_skills\\agents\\reviewer.md\n');
    expect(agents.ok && agents.value.rows[0]?.type).toBe('agent');

    const mixed = parseInventory('Skill,Description,Central copy\ndocx,d,central_skills\\skills\\docx\nreviewer,d,central_skills\\agents\\reviewer.md\n');
    expect(mixed.ok && mixed.value.rows.map((row) => row.type)).toEqual(['skill', 'agent']);
  });

  it('reads the agent inventory\'s "Other names used in agent definitions" column', () => {
    const result = parseInventory('Agent,Description,Other names used in agent definitions,Central copy\nreviewer,d,code-checker,C:\\a\\reviewer.md\n');
    expect(result.ok && result.value.rows[0]?.otherNames).toEqual(['code-checker']);
  });
});
