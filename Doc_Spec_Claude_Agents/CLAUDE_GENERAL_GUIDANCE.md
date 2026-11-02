# Consolidated general guidance

Distilled from 20 `CLAUDE.md` files found under `C:/AI_Donncha`, including hidden subfolders and worktrees, on 21 October 2026. The collection contains 17 distinct file contents; some files only reference another instruction file.

Repeated and overlapping advice has been merged. Application features, named technologies, versions, commands, ports, credentials, and project-specific workflows have been omitted. Recommendations apply where relevant to the project; differing local conventions have been generalized rather than promoted into universal rules.

## 1. Establish the working context

- Read the relevant specification and engineering instructions before changing architecture, data structures, or integrations.
- Inspect the implementation and configuration to confirm the current structure and behavior. Identify stale documentation and resolve discrepancies explicitly.
- Distinguish working functionality from mocks, placeholders, planned work, and unused scaffolding.
- Consult relevant project workflows and skills when they apply, while respecting the project's constraints.
- Treat referenced and vendored guidance as reference material; change it only within the requested scope.

## 2. Keep changes focused

- Build the smallest maintainable solution that satisfies the request.
- Preserve the existing structure and conventions unless there is a clear reason to change them.
- Prefer simple, readable implementations and small changes that are easy to review.
- Add steps, abstractions, or dependencies when the problem requires them.
- Remove redundant work and favor composition and reuse over duplicated implementations.

## 3. Check dependencies and documentation

- Review installed packages and existing capabilities before adding a dependency.
- Verify third-party implementation details against official documentation appropriate to the installed version.
- Check compatibility with the runtime, framework, platform, and other installed packages before installation.
- Prefer maintained packages and avoid overlapping libraries that solve the same problem.
- Use the project's established installation method and verify whether a package needs additional configuration.

## 4. Maintain clear architectural boundaries

- Keep presentation, business logic, network communication, and persistence separate.
- Keep page and navigation entry points thin; assemble behavior through focused components and services.
- Centralize external access through the established integration layer instead of introducing competing access patterns.
- Use existing initialization helpers, providers, and shared clients consistently.
- Preserve the intended boundary between application code and systems owned or maintained elsewhere.

## 5. Keep contracts and state consistent

- Define precise types for inputs, outputs, component properties, and callbacks where supported. Avoid bypassing useful type checks.
- Validate request and response shapes at integration boundaries.
- When changing a field or data shape, update every affected layer: persistence mapping, service response, consumer types, and interface.
- Normalize naming and value representations before passing external data to consumers.
- Keep shared state in the established state mechanism and navigation parameters focused on navigation needs.
- Keep mock and live integrations interchangeable through consistent contracts and explicit configuration.

## 6. Reuse the interface system

- Build on the existing component library, shared layouts, and interaction patterns.
- Centralize reusable design values such as color, spacing, typography, and depth.
- Add missing design tokens rather than scattering hardcoded values across screens.
- Preserve accessibility, platform layout requirements, and shared component contracts when adding interface elements.
- Keep display labels separate from stored identifiers and submitted values.

## 7. Make failures visible and understandable

- Route errors through the established error-handling mechanism and return consistent responses.
- Translate validation and integrity failures into clear, actionable user messages.
- Ensure the interface reflects a failed operation rather than appearing to have succeeded.
- Keep technical diagnostics in appropriate logs; exclude raw database errors and internal details from user-facing messages.
- Represent pending, completed, and failed operations explicitly in the interface and its state.

## 8. Preserve security boundaries

- Keep keys, passwords, and tokens in the approved credential or environment configuration system, outside committed source and exported artifacts.
- Avoid exposing sensitive values through logs, test assertions, screenshots, or diagnostic output.
- Preserve intentional access restrictions, query guards, network exposure limits, and read-only boundaries.
- Obtain the required authorization before broadening an explicitly protected boundary.
- Distinguish interface permission controls from trusted-side enforcement; document security limitations accurately.
- Flag exposed credentials for replacement when discovered during relevant work.

## 9. Build stable tests

- Select interface elements by accessible role and name or label where possible. Use stable test identifiers when accessible identification is insufficient.
- Avoid selectors tied to changing styles, incidental layout, or element position.
- Assert meaningful user-visible outcomes, including useful feedback for failed operations.
- Make tests deterministic, simplify redundant actions, and review brittle selectors before delivery.
- Confirm required services are running and test the intended application rather than leftover example content.
- Account for the actual session-storage mechanism when restoring authenticated test sessions, and protect generated session artifacts.
- Use bounded, condition-based retries for asynchronous behavior while keeping sensitive values out of failure output.

## 10. Validate in the relevant environment

- Run the applicable formatting, lint, type, test, and build checks before reporting completion.
- For interface changes, exercise the affected behavior in a browser or target device. Static checks alone do not establish that the interface works.
- For imported or externally executed artifacts, validate their structure locally and verify execution in the target system.
- Check references and connections as well as syntax; a structurally valid artifact can still contain broken links between its parts.
- Use automated checks or hooks where appropriate to make routine validation repeatable.
- State which checks passed, which failed, and which could not be performed.

## 11. Use tools and automation deliberately

- Verify that required tools, services, credentials, and access settings are available before relying on an integration.
- Distinguish tools that work offline from operations that require a live connection.
- Diagnose unavailable integrations rather than repeatedly retrying an unchanged setup; use a supported fallback where possible.
- Check that a tool returns the evidence and fields the task requires before building further work around its output.
- Bound automated iterations and retries so incomplete results cannot cause unlimited execution.
- Prefer built-in behavior and straightforward configuration before introducing custom automation code.

## 12. Keep communication and documentation useful

- Keep replies concise and focused on the result, relevant decisions, and limitations.
- Avoid unnecessary explanation and long code excerpts unless they help the user act or review the work.
- Keep top-level instructions short and link to detailed documentation instead of repeating it.
- Update specifications and engineering guidance when behavior or architecture changes.
- Record durable decisions and known pitfalls once in the appropriate reference location.
- Describe completion accurately and distinguish verified behavior from assumptions or unfinished work.
