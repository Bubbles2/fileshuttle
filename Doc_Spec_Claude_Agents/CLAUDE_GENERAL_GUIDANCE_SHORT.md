# General Guidance (Short)

## Context and scope

- Read applicable specifications and instructions; inspect current code/configuration before changing architecture, data, or integrations.
- Resolve documentation/code conflicts explicitly. Distinguish live behavior from mocks, placeholders, plans, and unused scaffolding.
- Use relevant project workflows and skills; treat referenced/vendor guidance as read-only unless the request includes it.
- Build the smallest maintainable solution. Preserve established structure and conventions; favor readable, reviewable changes, reuse, and composition over duplication.

## Dependencies and architecture

- Check existing capabilities, compatibility, maintenance, overlap, and required configuration before adding dependencies; follow the project's install method and installed-version official docs.
- Separate presentation, business logic, networking, and persistence. Keep entry points thin; use focused components/services.
- Use established integration layers, initialization helpers, providers, and clients. Respect boundaries with externally owned systems.

## Contracts, state, and interface

- Define precise contracts/types and validate data at integration boundaries. When data shapes change, update persistence, services, consumer types, and UI together.
- Normalize external values and naming; use the established shared-state mechanism. Keep navigation state minimal and mock/live integrations interchangeable through explicit configuration.
- Reuse the existing UI system and design tokens; add tokens instead of scattered hardcoded values. Preserve accessibility, platform layout needs, and component contracts.
- Keep displayed labels separate from stored IDs and submitted values.

## Failures and security

- Use established error handling and consistent responses. Show clear, actionable failures and explicit pending/success/failure states; keep internal diagnostics out of user messages.
- Keep credentials outside source/artifacts and out of logs, tests, screenshots, and diagnostics. Preserve access, query, network, and read-only restrictions; obtain authorization before broadening them.
- Enforce permissions on the trusted side, document limitations honestly, and flag exposed credentials for replacement.

## Testing and validation

- Prefer accessible element selectors, then stable test IDs; avoid layout/style/position selectors. Assert meaningful user outcomes, including errors.
- Keep tests deterministic; verify the intended app and required services. Protect test session artifacts and use bounded condition-based retries.
- Run applicable format, lint, type, test, and build checks. Exercise UI changes in the real target environment.
- Validate external artifacts, references, and connections—not just syntax. Report passed, failed, and unavailable checks accurately.

## Tools and communication

- Confirm required tools, services, credentials, and access before relying on integrations; distinguish offline from live operations.
- Diagnose unavailable tools instead of repeatedly retrying; use supported fallbacks. Verify outputs contain needed evidence, and bound automation/retries.
- Prefer built-in behavior and simple configuration before custom automation.
- Communicate concisely: result, key decisions, verification, and limitations. Keep top-level guidance short, link deeper docs, update durable docs when behavior changes, and distinguish verified work from assumptions or unfinished items.
