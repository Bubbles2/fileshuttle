# General Agent Guidance (Short)

## Before changing

- Read applicable requirements/instructions; inspect the real code, config, conventions, and installed-version docs first.
- Resolve conflicts explicitly; use verified commands and references—never invent behavior or links.

## Scope and design

- Deliver only the requested change; preserve working behavior, architecture, UI direction, and externally owned systems unless authorized otherwise.
- Prefer simple, readable solutions. Reuse existing capabilities and obtain approval before adding dependencies.
- Organize by feature/responsibility: focused modules, clear public interfaces, separated data access/presentation, and no unnecessary coupling or circular dependencies.

## Code and state

- Follow project formatting, linting, naming, encoding, exports, and initialization patterns.
- Use meaningful names, focused functions, precise contracts/types, explicit conditions, and immutable shared state where required.
- Store authoritative state; derive calculations. Keep state local unless shared, use pure updates, latest-state updates, and isolate side effects in handlers/services.
- Subscribe only to needed data; avoid needless UI updates or unsafe reinitialization.

## Data, performance, and UI

- Use the established data layer/configuration; avoid hardcoded endpoints and competing clients.
- Parallelize independent work, respect dependencies, deduplicate requests, minimize transferred/persisted data, and normalize external values consistently.
- Prioritize loading, interaction, and scrolling. Defer nonessential work, optimize assets and large lists, avoid trivial memoization and layout thrashing, and preserve responsive, accessible interfaces.

## Security and errors

- Never commit secrets. Use placeholder config examples and appropriate ignores.
- Validate external input; enforce server-side authentication/authorization; preserve intended permissions, exposure, and transport protections.
- Return consistent errors, show safe user messages, log useful non-sensitive context, and preserve loading/error behavior. Treat response-shape mismatches as contracts to fix across layers.

## Testing and delivery

- Follow existing test conventions; cover success, invalid input, and relevant regressions. Do not mistake an empty suite for tested behavior.
- Run applicable canonical format, lint, type, test, build, and environment/UI checks. Fix relevant failures; state any skipped or blocked verification clearly.
- Report the result concisely: changes, material decisions, validation, limitations, and relevant config/migration/security effects.
- Keep documentation and setup/contracts current; make focused commits and review descriptions with rationale and evidence.
