# General development guidance

Reusable guidance distilled from the consolidated specification. Repeated advice has been merged, and project-specific requirements have been generalized. Apply each recommendation where relevant to the work.

## 1. Understand the existing project

- Read the project instructions, architecture documentation, and relevant code before making changes.
- Check what is implemented, mocked, planned, or out of scope. Keep these distinctions explicit.
- Follow the established language, tools, folder structure, and formatting conventions.
- Verify how existing dependencies and components are used before introducing alternatives.
- Record discrepancies between documentation and implementation, and update the affected documentation when resolving them.

## 2. Keep the solution simple

- Build the smallest clear solution that satisfies the current requirements.
- Prefer readable, focused modules with clear responsibilities.
- Add libraries, abstractions, and infrastructure when the complexity of the problem justifies them.
- Keep future integration possible through clear boundaries rather than speculative implementation.
- Preserve working behavior when extending the application.

## 3. Separate responsibilities

- Keep presentation, business logic, external communication, and persistence in appropriate layers.
- Keep interface components focused on displaying information and handling user interaction.
- Centralize shared data access and external service configuration.
- Reuse common components and utilities instead of copying their implementation.
- Define clear inputs, outputs, and error behavior at module boundaries. Use types or validation schemas where the project supports them.

## 4. Manage data and state consistently

- Keep one authoritative source for each piece of information.
- Derive values from existing data where practical, rather than storing duplicate state that must be synchronized.
- Keep temporary interaction state local; share state when multiple parts of the application need it.
- Normalize external data at the integration boundary so presentation code receives a predictable shape.
- Handle missing values, identifiers, numeric precision, and timestamps consistently.
- Keep mock data behind the same interface intended for real data, so integration changes remain localized.

## 5. Validate inputs and preserve integrity

- Validate incoming data at the boundary where it enters the system. Client validation improves usability; trusted-side validation enforces the rules.
- Check required values, formats, ranges, and payload sizes.
- Enforce uniqueness and relationships through appropriate persistence constraints.
- Use parameterized queries when constructing database operations.
- Apply related changes atomically where partial completion would leave inconsistent data.
- Version schema changes and make failed migrations stop clearly without leaving partial changes.

## 6. Protect access and sensitive information

- Enforce authorization in trusted code for every protected operation, including access to individual records.
- Give accounts and services only the permissions their work requires.
- Keep credentials and environment-specific configuration outside committed application code.
- Use the established authentication and session mechanisms consistently.
- Validate and sanitize untrusted content before rendering it, and restrict permitted links and embedded content.
- Configure network exposure and browser protections for the intended deployment environment. Reassess local development assumptions before deployment.

## 7. Handle errors clearly

- Use a consistent success and error contract across related operations.
- Distinguish invalid input, access failures, missing resources, conflicts, and unexpected failures.
- Show concise, useful messages to users while keeping internal diagnostics in appropriate logs.
- Exclude credentials, private data, database details, and stack traces from user-facing responses.
- Provide recovery or retry options where they are meaningful.
- Avoid responses that reveal whether a protected resource exists when that information should remain private.

## 8. Make the interface predictable

- Reuse shared styles and design tokens for color, typography, spacing, and common controls.
- Keep forms and navigation straightforward and consistent.
- Provide clear loading, empty, validation, success, and failure states.
- Make pending operations visible so users can tell whether their action is being processed or has completed.
- Preserve responsive layouts, keyboard usability, readable spacing, and platform safe areas where applicable.
- Handle missing or unsupported content with a clear fallback.

## 9. Use resources deliberately

- Avoid unnecessary requests, repeated calculations, and state synchronization.
- Send updates when data changes; debounce frequent interactions where appropriate.
- Cancel obsolete work or prevent stale responses from replacing newer state.
- Bound result sets, request sizes, and concurrent operations according to actual needs.
- Use caching or more advanced state management when the application's behavior warrants it.
- Define performance expectations for the relevant workload and verify them in the intended environment.

## 10. Verify and document the result

- Define observable acceptance criteria before considering work complete.
- Verify the main user journey and relevant invalid-input, access, missing-data, and failure cases.
- Run the project's applicable build, formatting, lint, type, and test checks.
- Confirm that related existing behavior still works after the change.
- Keep setup instructions, configuration guidance, interface contracts, and architecture notes aligned with the implementation.
- State what changed, how it was verified, and any remaining limitations. Identify placeholders and unfinished integrations clearly.
