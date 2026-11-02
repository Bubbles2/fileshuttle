# FileShuttle

Pick skills from a skills inventory CSV and copy their folders into a project.

FileShuttle is a small local web app built from the **FileShuttle** Claude Design. You load a skills inventory (for example `SKILLS_INVENTORY.csv`), browse each skill as a card, tick **Show details** for the full record, drag the skills you want into a copy basket, choose a destination such as a project's `.claude\skills` folder, and copy. A local server does the real file work; nothing is uploaded anywhere.

## Requirements

- Node.js **22.18 or later** (Node 24 recommended). The server runs its TypeScript directly with Node's built-in type stripping.
- Windows, macOS or Linux.
- Run it from a **normal terminal**, not "Run as administrator"; otherwise FileShuttle refuses to start. On PCs where Windows UAC is turned off, every program has administrator rights, so FileShuttle starts anyway and prints a warning (see [SECURITY.md](SECURITY.md)).

## Getting started

```bash
npm install
npm run dev
```

FileShuttle opens http://localhost:3000 in your default browser (add `-- --no-open` to stop that). Nothing else is needed.

**Shared computers:** other programs and other people signed in to the same computer can reach `localhost` too. On a shared or multi-user machine, start FileShuttle with `npm run dev -- --require-key`. It then only accepts browsers that opened its launch link (`http://localhost:3000/#key=…`, opened for you automatically). The key is saved privately in your user profile, so each browser needs the link only once; `--new-key` signs every browser out.

To try it without preparing your own data, generate a sample folder and CSV:

```bash
npm run sample
```

This creates `sample-data/` (ignored by Git) with a few skill folders, `SKILLS_INVENTORY_example.csv` pointing at them (one skill deliberately has no folder), and an empty `my-project\.claude\skills` destination.

## The CSV format

One row per skill or agent (e.g. `SKILLS_INVENTORY.csv`, `AGENTS_INVENTORY.csv` or the combined `AGENT_SKILL_INVENTORY.csv`). Columns can be in any order and capitalisation; only **Skill** (or **Agent**), **Description** and **Central copy** are required.

| Column | Shown as |
| --- | --- |
| `Skill` or `Agent` | Card title, and the name in the basket |
| `Type` | `S` (skill) or `A` (agent). Without it, an `Agent` name column or a central copy ending in `.md` means agent |
| `Description` | Card text (two lines; the full text under **Show details**) |
| `Category` | Tag on the card, and in the details |
| `Technology` | Details |
| `Copies`, `Distinct versions`, `Copies in worktree folders` | Details, e.g. "13 copies · 3 distinct versions · 2 in worktree folders" |
| `Found in projects` | Details, as a list (entries separated by `;`) |
| `Other names used in SKILL.md` | Details, as a list (entries separated by `;`) |
| `Central copy` | The skill folder that gets copied |

`Central copy` is the skill folder that gets copied. It can be a full path (`C:\Skills\docx`) or relative to the inventory's folder (`central_skills\skills\docx`). Loading and picking skills works either way. For relative paths, the copy card asks once for the **Copy from folder** they start from (for your inventory, `C:\AI_Donncha\fileshuttle`, which holds `central_skills`), and remembers it. A folder remembered from before `central_skills` moved there from `C:\AI_Donncha` is updated automatically.

Comma, semicolon and tab delimiters are detected, and UTF-8 (with or without BOM) and Excel's Windows‑1252 encoding are both handled. Rows without a skill name or central copy, and repeated central copies, are counted and skipped. Limits: CSV up to 5 MB and 5,000 rows.

## Using it

1. **Load CSV** – **Choose a CSV** (later **Choose another CSV**) opens FileShuttle's own file browser in the folder FileShuttle was started from (the project folder when you use `npm run dev` / `npm start`). It lists only folders and `.csv` files; open folders to look elsewhere, or **Drives and home** to switch drive. Click a CSV to load it, and its skills appear in the list on the left straight away. The local server reads the file from disk; nothing is uploaded anywhere. **Use the system file dialog…** at the bottom falls back to the browser's own dialog (which can't be told where to open), for example when the server isn't running; a file chosen there is read in the browser.
2. **Pick skills** – each skill is a card with its name and description. Tick **Show details** to see category, technology, copy counts, the projects it was found in, other names and the central copy path. Add a skill with the round **+** in the top-right corner of its card, by dragging the card anywhere onto the Copy basket, or add every skill with **Add all available**. The filter searches names, descriptions, categories and technologies. If two skills would land in the same folder name, the basket says so. After a copy finishes, adding another skill starts a new batch.
3. **Copy** – each item goes into a subfolder of the destination, added after you type or browse to it. The card shows the exact folders:

   | | **Claude** ticked (default) | **Claude** unticked |
   | --- | --- | --- |
   | Skills (folders) | `.claude\skills` | `.agents\skills` |
   | Agents (`.md` files) | `.claude\agents` | `.codex\agents`, renamed to `.toml` (only the extension changes, not the contents) |

   Use the bean-shaped **A** / **S** filter at the top of the list to show agents or skills. A basket can mix both; each item goes to its own folder. **Copy from folder** starts as `C:\AI_Donncha\fileshuttle\` and **Destination folder** as `C:\Users\D.Finlay\SaveCrap`; change the defaults in `src/app/defaults.ts`. Copy from accepts either the folder holding `central_skills` or a folder further down, such as `…\central_skills\skills`. Each basket row shows the folder its skill is copied from. Change either folder with **Browse…** or by typing, e.g. `D:\MyProject\.claude\skills` (it is created if needed), choose a policy and copy. Each skill folder is copied with everything inside it, one at a time, and each row shows its result. **Stop copying** halts the batch.

| If a skill folder already exists | What happens |
| --- | --- |
| **Skip** (default) | The existing folder is left untouched and the skill is marked *Skipped*. |
| **Overwrite** | The folders are merged: matching files are replaced, nothing is deleted. |
| **Keep both** | The copy gets a number, e.g. `docx (1)`. |

### Network paths

UNC paths such as `\\server\share\file.pdf` are **off by default**. Touching one makes Windows contact that machine and send your sign-in credentials, so a CSV could otherwise make FileShuttle reach out to any host. Such rows show *Network path – not checked*. If you trust your network shares, start FileShuttle with:

```bash
npm run dev -- --allow-network-paths
```

### Sidebar and guides

The sidebar on the left switches between **Skills & Agents** (the copy screen) and two guidance documents, shown as formatted Markdown:

- **Spec** – `C:\AI_Donncha\fileshuttle\Doc_Spec_Claude_Agents\CLAUDE_GENERAL_GUIDANCE.md`
- **Agents** – `C:\AI_Donncha\fileshuttle\Doc_Spec_Claude_Agents\AGENTS_GENERAL_GUIDANCE.md`

The folder is found relative to the FileShuttle folder (`Doc_Spec_Claude_Agents` next to `server\`), so it moves with the project.

On each guide, **Summary** switches to its short version (`CLAUDE_GENERAL_GUIDANCE_SHORT.md` / `AGENTS_GENERAL_GUIDANCE_SHORT.md` in the same folder), and **Copy** saves the version on screen as `spec.md` in the **Destination folder** set on the Skills & Agents screen. If `spec.md` is already there, the "If a file already exists" choice applies (Skip by default). Each guide is read fresh when opened (**Reload** fetches it again). To point them at other files, edit `GUIDE_FILES` in `server/services/guides.ts`. The copy screen keeps its state while a guide is open. In the list header, **Details** opens the details of every card at once.

## Production use

```bash
npm run build
npm start
```

`npm start` serves the optimised build with a strict Content Security Policy and opens it in your browser, like `npm run dev`. Options: `PORT=3100 npm start` for another port; `npm start -- --allow-network-paths` as above; `npm start -- --require-key` on shared computers. The server only listens on `127.0.0.1` and is never reachable from other machines.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Server + Vite with hot reload on port 3000 |
| `npm run build` | Type-check everything, then build the front end into `dist/` |
| `npm start` | Serve `dist/` and the API (production mode) |
| `npm run test` | All unit, component, accessibility and server tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run lint` | ESLint with strict type-aware rules |
| `npm run typecheck` | TypeScript only |
| `npm audit` | Check dependencies for known vulnerabilities (`npm run audit:prod` for runtime deps only) |
| `npm run sample` | Create the sample data described above |

## Troubleshooting

- **"Open FileShuttle from its launch link"** – FileShuttle was started with `--require-key` and this browser has no key yet (or an old one after `--new-key`). Open the link printed in the terminal once, or start FileShuttle without `--require-key` on a single-user PC.
- **"FileShuttle's server isn't running"** – start it with `npm run dev`. The notice clears by itself once the server answers.
- **"FileShuttle is running as Administrator/root"** – start it from a normal terminal, not "Run as administrator". If you really must run elevated, add `-- --allow-elevated` (not recommended).
- **"Windows UAC is turned off on this PC"** – this is only a warning: FileShuttle has administrator rights because every program on this PC does. Double-check destinations and take care with **Overwrite**.
- **"Port 3000 is already in use"** – stop the other program, or run `npx kill-port 3000`.
- **"Could not reach the FileShuttle server"** – the terminal running FileShuttle was closed. Start it again, open the new link and press **Try again**.
- **"An earlier copy is still running"** – after **Stop copying**, the skill that was in progress finishes on the server. Wait a moment, then copy again.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) – how the code is organised and how data flows.
- [SECURITY.md](SECURITY.md) – security controls, review findings, limitations and deployment requirements.
