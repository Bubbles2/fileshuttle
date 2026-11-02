# Consolidated general agent guidance

Distilled from 14 `AGENTS.md` files found under `C:/AI_Donncha`, including capitalization variants, hidden subfolders, and embedded skill directories, on 21 October 2026. The collection contains 10 distinct file contents before whitespace normalization.

Repeated and overlapping advice has been merged. Product features, project layouts, named technologies, version numbers, commands, and implementation examples have been omitted. Conflicting local conventions have been generalized; apply recommendations where relevant to the project and task.

## 1. Read before changing

- Read the relevant requirements and engineering instructions, then inspect the affected code before editing.
- Confirm the actual package structure, configuration, and conventions rather than relying on an old example or remembered layout.
- Verify third-party behavior against documentation for the installed version, including bundled guides and deprecation notices where available.
- Identify conflicts between instructions, reference material, and implementation. Resolve the discrepancy explicitly instead of silently carrying stale assumptions forward.
- Use verified references and executable commands; do not invent documentation links or tool behavior.

## 2. Stay within scope

- Keep changes focused on the requested outcome and avoid unrelated refactoring.
- Prefer simple, readable code over premature abstraction.
- Preserve the existing visual direction, project organization, and working behavior unless the requirements call for a change.
- Review existing capabilities before proposing new dependencies, and follow the project's approval requirements for adding them.
- Preserve externally owned systems and data structures unless changing them is part of the authorized work.

## 3. Organize code by responsibility

- Use predictable module boundaries and group related code by feature or domain.
- Keep entry points and route declarations focused; delegate reusable presentation, business logic, and external access to appropriate modules.
- Separate data acquisition from presentation so reusable components receive clear inputs.
- Keep modules small and expose a focused public interface.
- Avoid circular dependencies and unnecessary coupling between features, state, and services.
- Reuse established initialization and registration mechanisms when extending the application.

## 4. Follow consistent coding conventions

- Use the project's formatter, linter, naming rules, encoding, and export conventions.
- Keep functions and components focused, with readable lines and meaningful names.
- Define precise data contracts where the language supports them; narrow unknown values rather than bypassing type checks.
- Keep shared definitions close to the code that owns them and update affected consumers when contracts change.
- Use explicit conditions when implicit truthiness could display an unintended value or violate a rendering constraint.
- Preserve immutability where shared data or state management depends on it.

## 5. Represent state accurately

- Store authoritative information and derive values that can be calculated from it.
- Keep local interaction state local; share it when multiple parts of the application need it.
- Keep state transformations pure and move external side effects into the appropriate handlers or services.
- Handle direct user interactions in their event handlers rather than indirectly through state synchronization.
- Base dependent updates on the latest state to avoid stale values.
- Subscribe only to information a consumer needs, and keep high-frequency transient values out of state that triggers unnecessary interface updates.
- Ensure initialization runs at the intended lifecycle scope and remains safe when components or modules are reinitialized.

## 6. Keep data access efficient

- Use the established data-access layer and configuration instead of adding competing clients or hardcoded endpoints.
- Run independent operations concurrently when appropriate, while respecting real dependencies and resource limits.
- Start required work early and wait for it where the result is needed, avoiding unnecessary chains of sequential requests.
- Deduplicate repeated requests and subscriptions through the project's existing mechanisms.
- Transfer only the data consumers need and avoid serializing the same information repeatedly.
- Normalize external values consistently and use the data system for aggregation where appropriate.
- Keep persisted client data minimal and version its format when compatibility requires it.

## 7. Keep the interface responsive

- Prioritize improvements with the greatest effect on loading, interaction, and scrolling before minor code optimizations.
- Defer heavy components, optional libraries, and nonessential work until needed.
- Use appropriately sized, compressed assets and reuse stable resources instead of repeatedly loading or recreating them.
- Keep repeated interface items lightweight and render visible content efficiently for large collections.
- Preserve stable inputs where reference changes would cause expensive repeated work. Avoid adding caching or memoization around trivial calculations.
- Minimize repeated layout measurement and avoid interleaving layout reads and writes.
- Prefer platform-supported interactions and efficient animation properties where suitable.
- Preserve responsive layouts, accessibility, safe areas, and consistent formatting across supported devices.

## 8. Protect access and configuration

- Keep secrets, credentials, and private keys outside committed code and generated examples.
- Provide configuration examples with placeholder values and exclude local secrets, caches, dependencies, and generated output from version control as appropriate.
- Validate and sanitize external input in trusted code.
- Enforce authentication and authorization on protected operations, regardless of how the interface exposes them.
- Preserve intentional restrictions on permissions, network exposure, allowed queries, and data modification.
- Follow the applicable authorization process before broadening a protected boundary or changing shared history.
- Configure cross-origin access and transport protections for the intended environment, and avoid unnecessary persistence of authentication material.

## 9. Make errors useful and safe

- Return consistent response shapes and use the established error-handling mechanism.
- Show concise, user-friendly failure messages without exposing stack traces, database details, or sensitive implementation information.
- Log enough diagnostic context to investigate failures while excluding credentials and private data.
- Preserve loading and error behavior when changing integrations or state management.
- Treat missing fields and incompatible response shapes as contract problems to resolve across all affected layers.

## 10. Test meaningful behavior

- Follow the existing test structure and use descriptive names that explain the behavior under test.
- Cover successful behavior, invalid input, and regressions for fixed defects where appropriate.
- Test focused, deterministic logic directly and verify important journeys through the integrated application.
- Keep test environments and configurations appropriate to the layer being tested.
- Distinguish a passing test suite from a command that succeeds because no tests exist.
- Preserve agreed coverage expectations and discuss changes to those expectations explicitly.

## 11. Verify before reporting completion

- Run applicable formatting, lint, type, unit-test, integration-test, and build checks using the project's canonical scripts.
- Fix relevant validation failures before delivery and use broader checks when the scope of the change warrants them.
- Exercise interface changes in a browser or target environment and retain useful screenshots or verification notes.
- State clearly when a check cannot run; do not silently skip it or imply that unverified behavior works.
- Use purpose-built tools where they improve reviewability and permission handling. Parallelize independent inspection work while keeping dependent edits and checks ordered.

## 12. Communicate and document clearly

- Keep responses concise and focused on the result, material decisions, verification, and limitations.
- Keep persistent instructions short and link to deeper references instead of duplicating them.
- Update setup instructions, contracts, and configuration guidance when the corresponding behavior changes.
- Keep commits focused on one logical change and use concise, action-oriented subjects.
- Describe what changed and why in review requests; link relevant requirements and include validation evidence.
- Call out configuration, migration, or security implications when relevant to the change.
