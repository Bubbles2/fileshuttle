// Creates sample-data/ with a few skill folders and a skills inventory CSV that
// points at them, so FileShuttle can be tried without real data. Safe to rerun.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'sample-data');

const HEADER = [
  'Skill',
  'Category',
  'Technology',
  'Description',
  'Copies',
  'Distinct versions',
  'Copies in worktree folders',
  'Found in projects',
  'Other names used in SKILL.md',
  'Central copy',
];

// [skill, category, technology, description, copies, versions, worktree copies, projects, other names, folder exists?]
const skills = [
  ['clean-typescript', 'TypeScript / JavaScript tooling', 'TypeScript', 'Write clean, correct TypeScript that reduces bugs and cognitive load.', 13, 3, 2, 'AgentSkill; codex/jde', '', true],
  ['modern-tailwind', 'Frontend (React, Next.js, HTML, CSS)', 'Tailwind CSS', 'Write clean, modern, concise Tailwind CSS code.', 3, 2, 0, 'AgentSkill; finished-project-claude', '', true],
  ['web-security', 'Security and authentication', 'Web security', 'Enforce baseline web security and avoid common vulnerabilities.', 13, 3, 2, 'AgentSkill; codex/jde; testClaude/ArcMob', '', true],
  ['api-structure', 'Backend, APIs and databases', 'Express, Sequelize, PostgreSQL', 'Scaffold a new API domain in the Express + Sequelize + PostgreSQL backend.', 5, 2, 0, 'codex/jde', 'api_endpoint', true],
  ['docx', 'Documents, design, AI and content', 'Word (.docx), Python, docx-js', 'Create, read and edit Word documents.', 1, 1, 0, 'testClaude/ArcMobWord', '', true],
  ['retired-skill', 'Code quality, testing and orchestration', 'Any codebase', 'A skill whose central copy was deleted, to show the "not found" state.', 1, 1, 0, 'oldstuff', '', false],
];

const quote = (value) => `"${String(value).replaceAll('"', '""')}"`;

await rm(root, { recursive: true, force: true });
for (const [name, , , description, , , , , , exists] of skills) {
  if (!exists) continue;
  const folder = path.join(root, 'central_skills', 'skills', name);
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, 'SKILL.md'), `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n`);
}
await mkdir(path.join(root, 'my-project', '.claude', 'skills'), { recursive: true });

const rows = skills.map(([name, ...rest]) => {
  const values = [name, ...rest.slice(0, 8), `central_skills\\skills\\${name}`];
  return values.map(quote).join(',');
});
const csvPath = path.join(root, 'SKILLS_INVENTORY_example.csv');
await writeFile(csvPath, `${[HEADER.join(','), ...rows].join('\r\n')}\r\n`);

console.log(`Sample CSV:            ${csvPath}`);
console.log(`Base folder:           ${root}`);
console.log(`Suggested destination: ${path.join(root, 'my-project', '.claude', 'skills')}`);
console.log('One skill (retired-skill) has no central copy on disk, on purpose.');
