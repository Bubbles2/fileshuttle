---
name: code-review
description: Read-only, evidence-based code review of a codebase, branch, or named files. Use when the user asks for a review of logic bugs, type errors, security issues, performance problems, regressions, maintainability risks, or any other named focus area. Never modifies files.
version: 1.1.0
last_updated: 2026-05-08
---

# Code Review

## When to use

Use this skill when the user asks to:

- "Review this PR / branch / file."
- "Check this code for bugs / security / perf / regressions."
- "Audit this for <focus area>."
- Run a comprehensive review before a release.

## When NOT to use

- For active refactoring or fixing what you find — that's the `simplify` skill or a follow-up task. Do **not** edit files during a review.
- For one-off "does this work?" questions — answer directly without invoking the full review workflow.
- For UI/UX redesign feedback — this skill targets correctness, not visual judgement.

## Invocation

In Claude Code, the user typically requests a review with `/code-review` or in plain language. The skill handler should:

- Treat user-named focus areas as **mandatory** priorities.
- Default to a thorough scan when scope is unbounded.
- Never modify, create, or delete files as part of review output.

---

## Inputs

| Input              | Notes                                                                      |
| ------------------ | -------------------------------------------------------------------------- |
| Scope              | "all changed files", "the whole repo", or a list of paths                  |
| Focus areas        | Optional — security, perf, accessibility, API consistency, etc.            |
| Severity threshold | Optional — e.g. "only Critical / High"                                     |

## Outputs

A structured Markdown report (see §6).

---

## 1. Define scope

- Determine whether scope is the entire codebase, a branch diff, or specific files.
- Expand scope to directly related files when needed to validate behaviour.
- Record scope boundaries in the final report.

## 2. Build file inventory

- Enumerate every file in scope **before** analysis.
- Group by area: runtime code, config, infra, tests, schemas, migrations, scripts.
- Do **not** sample when full coverage was requested.

## 3. Analyse every in-scope file

For each file, check at minimum:

- Logic correctness and edge cases
- Type safety and type drift risk
- Security: untrusted input, injection, auth bypass, secret exposure
- Performance: unnecessary work, N+1, blocking calls
- Reliability: error handling, retries, races, resource leaks
- Regression risk from implicit assumptions or fragile coupling

If the user requested an extra focus axis (accessibility, API consistency, architecture), include it as a first-class review dimension.

## 4. Validate finding quality

- Report only issues with concrete evidence (file + line).
- Prefer high-signal findings over speculative comments.
- Mark uncertainty explicitly and state what would confirm it.
- Distinguish bugs from improvements.

## 5. Cross-reference project rules

For this repo specifically, cross-check against:

- `CLAUDE.md` Safety Constraints — flag any violation.
- `SPEC.md` non-functional requirements (read-only, 127.0.0.1 listen, generic error envelope, etc.).
- Conventions: per-domain folders, lazy model init, RTK Query for fetching, `toNumber()` on Decimals, `schemaTable()` for raw SQL.

## 6. Produce the final report

Order findings by severity:

1. Critical — broken in production, data loss, exploitable
2. High — incorrect behaviour, regressions, real perf hits
3. Medium — bug-prone code, fragile patterns, drift from spec
4. Low — minor, style-adjacent, nice-to-have

For each finding include:

- Severity
- File & line reference
- What is wrong
- Why it matters (impact)
- Minimum recommended fix direction (do not write the fix)

Then include:

- Scope summary (what was reviewed)
- Areas with no issues found
- Open questions or assumptions
- Residual risk or testing gaps

---

## Reporting standards

- Be precise and concise.
- Use direct file references (`server/api/foo/fooController.js:42`) for every non-trivial claim.
- Avoid generic advice without evidence.
- Prefer actionable remediation guidance.
- If no issues are found, say so explicitly and list residual risks.

---

## Reviewer mindset

- **Attacker mindset** for security paths.
- **Production traffic mindset** for performance paths.
- **Future maintainer mindset** for reliability and clarity.
- Focus on behaviour and risk, not personal style preferences.

---

## Non-negotiables

- Never modify code during review.
- Never create, delete, or rewrite project files.
- Never claim a file was reviewed unless it was actually opened and analysed.
- Never gate on every nit — separate "must fix" from "consider".
