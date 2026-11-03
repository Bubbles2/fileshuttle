# central_skills

One master copy of every skill (29) and every Claude Code sub-agent (9) found in `C:\AI_Donncha`, with everything each one needs to be dropped into a new project.

```
central_skills/
├── README.md              ← this file
├── install-skills.ps1     ← copies skills into a project
├── install-skills.cmd     ← same, double-click friendly (bypasses PowerShell execution policy)
├── skills/                ← the 29 skills, one folder each (SKILL.md + any references/scripts)
├── agents/                ← 9 Claude Code sub-agents (one .md file each)
└── _variants/             ← alternative versions of skills and agents, kept for reference (not installed)
```

## Installing into a new project

From this folder in PowerShell:

```powershell
.\install-skills.ps1 -List                                              # show skills and bundles
.\install-skills.ps1 -ProjectPath C:\Dev\my-app -Bundle web             # React/Next web app
.\install-skills.ps1 -ProjectPath C:\Dev\my-app -Skills docx,code-review # pick individual skills
.\install-skills.ps1 -ProjectPath C:\Dev\my-app -Bundle core -Target codex
.\install-skills.ps1 -ProjectPath C:\Dev\my-app -Agents DocsExplorer     # pick individual agents
.\install-skills.ps1 -ProjectPath C:\Dev\my-app -Bundle web -AgentBundle crm-dev-team
```

Or from `cmd`: `install-skills.cmd -ProjectPath C:\Dev\my-app -Bundle web`

| Option | Meaning |
|---|---|
| `-Target claude` (default) | copies to `<project>\.claude\skills\` (Claude Code / Cowork) |
| `-Target codex` | copies to `<project>\.codex\skills\` |
| `-Target agents` | copies to `<project>\.agents\skills\` (generic agents layout used by `npx skills`) |
| `-Agents a,b` / `-AgentBundle` | install sub-agents to `<project>\.claude\agents\` (Claude Code only, whatever the `-Target`) |
| `-Force` | overwrite skills or agents already in the project |

**Bundles**

| Bundle | Skills |
|---|---|
| `core` | clean-typescript, web-security, code-review, npm-package-manager |
| `web` | core + modern-best-practice-react-components, modern-accessible-html-jsx, modern-browser-apis, modern-tailwind, modern-best-practice-nextjs, vercel-react-next-best-practices |
| `mobile` | core + react-npm-compat, modern-best-practice-react-components, vercel-react-native-skills, modern-best-practice-react-native-expo-components |
| `backend` | core + api-structure, backend-api-structure, react-express-starter, sqlite-explorer, better-auth-best-practices |
| `all` | every skill |

**Agent bundles**

| Agent bundle | Agents |
|---|---|
| `cmd-dev-manage-team` | frontend-ui-engineer, senior-code-reviewer, test-engineer (installed automatically with the cmd-dev-manage skill) |
| `crm-dev-team` | dev-orchestrator, frontend-engineer, backend-architect, code-reviewer, playwright-test-engineer |
| `all` | all 9 agents |

Manual alternative: copy a folder from `skills\` into your project's `.claude\skills\`, and agent `.md` files from `agents\` into `.claude\agents\`. For **cmd-dev-manage** also copy its three agents.

## The agents

Sub-agents are a Claude Code feature: each is a single `.md` file in `<project>\.claude\agents\`. Where an agent appeared in several projects the copies were identical, except for `code-reviewer` (see `_variants`).

| Agent | Team | What it does | Copied from (copies found) |
|---|---|---|---|
| DocsExplorer | – (standalone) | Looks up library/framework docs on the web, several technologies in parallel | AgentSkill (5) |
| frontend-ui-engineer | cmd-dev-manage | Builds, refactors or reviews React / Next.js / Tailwind UI with accessibility in mind | testClaude/sub_agent_test (3) |
| senior-code-reviewer | cmd-dev-manage | Reviews finished code for quality, architecture, security and performance (model: opus) | testClaude/sub_agent_test (3) |
| test-engineer | cmd-dev-manage | Writes and validates unit, integration and end-to-end tests | testClaude/sub_agent_test (3) |
| dev-orchestrator | crm-dev-team | Splits a dev task and dispatches it: backend → frontend → Playwright tests → code review | testClaude/TestOrchestrator (1) |
| frontend-engineer | crm-dev-team | React 19, Redux Toolkit, Material UI, React Router v7 work in the CRM app | testClaude/TestOrchestrator (1) |
| backend-architect | crm-dev-team | Express REST APIs with Axios-compatible responses, following the project's backend guidelines | testClaude/TestOrchestrator (1) |
| code-reviewer | crm-dev-team | Reviews code against CLAUDE.md conventions (CRM stack) before commit/merge | testClaude/TestOrchestrator (1 of 4) |
| playwright-test-engineer | crm-dev-team | Designs and writes Playwright end-to-end, UI and integration tests | testClaude/TestOrchestrator (1) |

Notes on the agents:
- The **crm-dev-team** agents were written for the TestOrchestrator CRM project and refer to its `CLAUDE.md` and stack. Expect to adjust them for other stacks.
- **dev-orchestrator** sends backend work to an agent called `backend-engineer`, but the agent here is named `backend-architect`. Rename one of them so they match.
- Most agents use `memory: project`, so Claude Code builds a fresh `.claude\agent-memory\` per project. The old project memories were deliberately not copied.

## The skills and which copy was kept

Where versions differed, the kept copy is the newest **general-purpose** one. Versions tuned to a single project were moved to `_variants/`.

| Skill | Category | Copied from | Extra requirements |
|---|---|---|---|
| clean-typescript | TS / JS tooling | codex/finished-codex-project | – |
| npm-package-manager | TS / JS tooling | testClaude/ArcMob | – |
| bun-first | TS / JS tooling | codex/finished-codex-project | Bun |
| react-npm-compat | TS / JS tooling | testClaude/ArcMob | – |
| modern-best-practice-react-components | Frontend | codex/finished-codex-project | React 19+, data-library neutral; includes `references/` |
| modern-react-components | Frontend | codex/jde/improvements (v1.1) | for Redux Toolkit + RTK Query projects; includes `references/` |
| modern-accessible-html-jsx | Frontend | codex/finished-codex-project | – |
| modern-browser-apis | Frontend | codex/finished-codex-project | – |
| modern-tailwind | Frontend | codex/finished-codex-project | Tailwind v4 syntax (v3 fallback noted) |
| modern-best-practice-nextjs | Frontend | codex/finished-codex-project | Next.js App Router only |
| vercel-react-next-best-practices | Frontend | testClaude/MyAgents/fitness-landing | includes `rules/` (68 files); ~15 rules are Next.js-only, SKILL.md says which to skip in plain React |
| vercel-react-native-skills | Mobile | testClaude/MyAgents/fitness-landing | React Native + **Expo**; includes `rules/` (38 files) |
| react-native-cli-guidelines | Mobile | adapted from vercel-react-native-skills | **bare React Native CLI** (no Expo); includes `rules/` (38 files); not in a bundle |
| modern-best-practice-react-native-expo-components | Mobile | testClaude/arcade-ged-prompted_experiment (was folder `aa`) | Expo Router; includes `references/` |
| api-structure | Backend | codex/jde/improvements (rewritten generic, v2.0) | Express + Sequelize + PostgreSQL, ES modules; JDE original in `_variants` |
| react-express-starter | Backend | codex/jde/improvements (v1.1, de-JDE'd) | React 18 + Vite + RTK Query / Express 4 ESM / Sequelize 6 + PostgreSQL, npm only |
| backend-api-structure | Backend | testClaude/n8nProjects/chatbotn8n | Express, **CommonJS** style (api-structure is the ESM + Sequelize one) |
| arcade-api | Backend | testClaude/ArcMob | Arcade HTTP API (Basic auth), axios |
| sqlite-explorer | Backend | codex/finished-codex-project | **Bun** (runs `scripts/sqlite-explorer.ts`); conflicts with npm-only starter if both are followed literally |
| web-security | Security | codex/finished-codex-project | – |
| better-auth-best-practices | Security | codex/finished-codex-project | Better Auth |
| code-review | Quality | codex/finished-codex-project | `agents/openai.yaml` is Codex UI metadata |
| playwright-cli | Testing | testClaude/playwrightest/CreatePlaywrightTests | `npm install -g @playwright/cli@latest` |
| cmd-dev-manage | Orchestration | testClaude/sub_agent_test | **needs `agents/` (frontend-ui-engineer, senior-code-reviewer, test-engineer)**, Claude Code only, frontend tracks only (no backend agent) |
| docx | Documents | testClaude/ArcMobWord | Python 3, `npm install -g docx`, pandoc / LibreOffice for some tasks |
| digitech-design | Design | testClaude/ArcMobWord | ⚠️ **incomplete**, see below |
| gemini-image-gen | AI | testClaude/MyAgents/fitness-landing | Python, `pip install google-genai`, `GEMINI_API_KEY`; script path is skill-relative |
| linkedin-post | Content | Claude Masterclass Materials / Module 2 | course example: hardcoded Notion IDs, "Tweet Lab" data and "0 Finance" SEC wording — rewrite before real use |
| paris-sport-hub-email-responder | Content | `paris-sport-hub-email-skill.skill` (unzipped) | Gmail connector; includes `references/store-info.md` |

## _variants (kept for reference, not installed)

| Folder | Why it's separate |
|---|---|
| api-structure__v1.1-jde-project | Original JDE Demo ERP version: read-only views, `schemaTable()`, `JDE_SCHEMA`, `SPEC.md` §6.x, connection-tester pitfall |
| clean-typescript__v1.1-jde-project | Longer v1.1 version; mentions `tsconfig.client.json`, RTK Query and `inventory-dashboard.tsx` from the JDE project |
| web-security__v1.1-jde-project | Longer v1.1 version with a JDE "connection tester" project appendix |
| modern-browser-apis__v1.1-dashboard-project | v1.1 with a "used in this dashboard project" section |
| code-review__v1.1-jde-project | v1.1 that cross-checks the JDE `SPEC.md` |
| modern-tailwind__general-best-practices | A different Tailwind skill (general best practices instead of modern syntax tips) |
| agents/code-reviewer__jde-project.md | A different, read-only `code-reviewer` agent (model: opus) written for the JDE Demo ERP; found in codex/jde/improvements, arcade-ged and old-non-git-arcade-ged-V1. It shares a name with the crm-dev-team reviewer, so only one can be in a project |

To use one of these instead, copy it into the project (`.claude\skills\` or `.claude\agents\`) and rename it to the plain name (e.g. `web-security`, `code-reviewer.md`).

## Known gaps

- **Conflicting conventions when skills are mixed**: `bun-first` vs `npm-package-manager`/`react-express-starter` (runtime), `api-structure` (ESM, Sequelize) vs `backend-api-structure` (CommonJS) vs the `backend-architect` agent (`{success,data}` envelope). Pick one per project.
- **linkedin-post** and **paris-sport-hub-email-responder** are demos tied to specific Notion/Gmail data.

- **digitech-design**: SKILL.md refers to `README.md`, `colors_and_type.css`, `assets/digitech-*.png`, `ui_kits/governance-console/` and `preview/*.html`. None of these exist anywhere in `C:\AI_Donncha`, so only SKILL.md is here. Add those files to `skills\digitech-design\` to make it complete.
- Skipped: older copies superseded by the kept ones, and the duplicate copies in `.claude/worktrees/` folders.
