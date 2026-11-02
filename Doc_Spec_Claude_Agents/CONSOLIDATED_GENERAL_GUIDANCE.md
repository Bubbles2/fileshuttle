# Consolidated general guidance

Merged from `CLAUDE_GENERAL_GUIDANCE.md` and `AGENTS_GENERAL_GUIDANCE.md` on 21 October 2026. These documents summarize 20 CLAUDE instruction files and 14 AGENTS instruction files. Duplicate instructions and advice expressed in different wording have been combined below.

Apply recommendations where relevant to the project and task. Local implementation choices remain project decisions; this document provides general guidance.

## 1. Establish context and scope

- Read the relevant requirements and engineering instructions, then inspect the affected implementation and configuration before editing.
- Confirm current behavior, conventions, and structure. Resolve discrepancies between documentation, reference material, and code explicitly.
- Distinguish working functionality from mocks, placeholders, planned work, and unused scaffolding.
- Keep changes focused on the requested outcome; preserve working behavior, organization, and visual direction unless the requirements justify changing them.
- Respect externally owned systems and reference material, including vendored guidance; modify them only within the authorized scope.
- Consult applicable project workflows and skills while respecting the project's constraints.

## 2. Choose simple solutions and compatible dependencies

- Build the smallest maintainable solution that satisfies the request, using focused changes that are easy to review.
- Reuse existing capabilities before adding libraries, abstractions, infrastructure, or custom automation.
- Verify third-party behavior against official documentation for the installed version, including bundled guides and deprecation notices where available.
- Before adding a dependency, check maintenance, runtime and platform compatibility, overlap with installed packages, and the project's approval requirements.
- Use the established installation method and verify any additional configuration a package requires.
- Use verified commands, references, and tool behavior rather than inventing them.

## 3. Maintain clear architectural boundaries

- Group related code by feature or domain, with predictable boundaries between presentation, business logic, external communication, and persistence.
- Keep entry points and route declarations thin; delegate behavior to focused components and services with clear public interfaces.
- Centralize external access and environment-specific endpoints through the established integration layer and configuration.
- Use existing initialization, provider, and registration mechanisms consistently, and ensure initialization remains safe at its intended lifecycle scope.
- Avoid circular dependencies and unnecessary coupling between features, state, and services.

## 4. Keep code and contracts consistent

- Follow the project's formatter, linter, naming, encoding, and export conventions; keep functions readable and names meaningful.
- Define precise contracts for inputs, outputs, properties, and callbacks where supported. Narrow unknown values rather than bypassing useful type checks.
- Validate request and response shapes at integration boundaries and normalize external naming and value representations for consumers.
- When a data shape changes, update every affected layer, including persistence mapping, service responses, consumer types, and interface. Keep shared definitions near their owner.
- Keep mock and live integrations interchangeable through consistent interfaces and explicit configuration.
- Keep display labels separate from stored identifiers and submitted values.
- Use explicit conditions where implicit truthiness could produce unintended output, and preserve immutability where shared data depends on it.

## 5. Represent state accurately

- Store authoritative information and derive values that can be calculated from it.
- Keep temporary interaction state local; use the established shared-state mechanism when multiple consumers need it. Keep navigation parameters focused on navigation.
- Keep state transformations pure and handle external side effects in the appropriate services or event handlers.
- Base dependent updates on the latest state to avoid stale values.
- Subscribe only to information a consumer needs; keep high-frequency transient values out of state that triggers unnecessary interface updates.
- Keep persisted client data minimal and version its format when compatibility requires it.

## 6. Use resources efficiently

- Prioritize improvements that materially affect loading, interaction, and scrolling before minor code optimizations.
- Start independent work concurrently where appropriate, respect dependencies and resource limits, and avoid unnecessary sequential requests.
- Deduplicate repeated requests and subscriptions through the established mechanisms.
- Transfer only required data, avoid repeated serialization, and perform aggregation in the data system where appropriate.
- Defer heavy components, optional libraries, and nonessential work until needed.
- Reuse stable resources and inputs where doing so prevents expensive repeated work; avoid caching trivial calculations.
- Use appropriately sized, compressed assets, lightweight repeated items, and efficient rendering for large collections.
- Minimize layout measurement and avoid interleaving layout reads and writes; prefer efficient animation properties and platform-supported interactions where suitable.

## 7. Reuse the interface system

- Build on shared components, layouts, and interaction patterns rather than duplicating implementations.
- Centralize reusable design values such as color, spacing, typography, and depth; extend design tokens instead of scattering hardcoded values.
- Preserve accessibility, responsive behavior, platform safe areas, consistent formatting, and shared component contracts.
- Represent pending, completed, and failed operations clearly so the interface reflects the actual result.

## 8. Protect access and sensitive information

- Store secrets in the approved credential or environment system, outside committed source, exported artifacts, and configuration examples.
- Use placeholder values in examples and exclude local secrets, caches, dependency directories, and generated output from version control as appropriate.
- Validate and sanitize external input in trusted code, and enforce authorization for protected operations regardless of interface controls.
- Preserve intentional restrictions on permissions, network exposure, allowed queries, and data modification. Follow the applicable authorization process before broadening protected boundaries or changing shared history.
- Configure cross-origin access and transport protections for the intended environment, and avoid unnecessary persistence of authentication material.
- Keep credentials and private data out of logs, assertions, screenshots, and diagnostic output; protect generated session artifacts and flag exposed credentials for replacement.
- Document security limitations accurately, including the distinction between interface permissions and trusted-side enforcement.

## 9. Make failures understandable

- Use the established error-handling mechanism and consistent response shapes.
- Translate validation, integrity, and operational failures into clear, actionable user messages without exposing raw database errors, stack traces, or internal details.
- Keep useful technical diagnostics in appropriate logs, following the sensitive-information rules above.
- Preserve error behavior when changing integrations; never present a failed operation as successful.

## 10. Build stable, meaningful tests

- Follow the existing test structure and use descriptive names that explain the behavior under test.
- Cover meaningful success paths, invalid input, failure feedback, and regressions for fixed defects where appropriate; test focused logic directly and important journeys through the integrated application.
- Prefer accessible roles, names, and labels for interface selectors; use stable test identifiers when necessary and avoid dependence on incidental styles, layout, or element position.
- Keep tests deterministic and remove redundant actions. Use bounded, condition-based retries for asynchronous behavior.
- Confirm required services and layer-appropriate configurations are available, target the intended application, and account for its actual session-storage mechanism.
- Preserve agreed coverage expectations and distinguish real test coverage from commands that succeed with no tests.

## 11. Verify work and tool capabilities

- Confirm required tools, services, credentials, and access settings are available; distinguish offline capabilities from operations requiring a live connection.
- Check that tools return the evidence and fields the task needs. Diagnose unavailable integrations instead of retrying an unchanged setup, and use a supported fallback where possible.
- Bound automated iterations and retries, use purpose-built tools where they improve reviewability and permission handling, and parallelize independent inspection while keeping dependent edits and checks ordered.
- Run applicable formatting, lint, type, test, and build checks using canonical project scripts. Fix relevant failures and broaden verification when the scope warrants it; automate routine checks where useful.
- Exercise interface changes in a browser or target device. For externally executed artifacts, check structure, references, and connections locally, then verify execution in the target system.
- Record useful validation evidence and state which checks passed, failed, or could not run. Distinguish verified behavior from assumptions and unfinished work.

## 12. Communicate and document clearly

- Keep replies concise and focused on the result, material decisions, and limitations; include explanation or code excerpts when they help the user act or review.
- Keep persistent instructions short, link to deeper documentation, and record durable decisions and known pitfalls once in the appropriate reference location.
- Update requirements, architecture notes, setup instructions, contracts, and configuration guidance when the corresponding behavior changes.
- Keep commits focused on one logical change with concise, action-oriented subjects.
- In review requests, explain what changed and why, link relevant requirements, include verification evidence, and identify material configuration, migration, or security implications.
