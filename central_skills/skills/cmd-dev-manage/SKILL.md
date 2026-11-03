---
name: cmd-dev-manage
description: Orchestrate implementation across parallel tracks using specialized agents. Coordinates frontend-ui-engineer, senior-code-reviewer, and optionally test-engineer agents.
argument-hint: [test]
---

# Agent Orchestration Manager

Your role is **coordination only** — you must not write any code yourself under any circumstances.

## Setup

Review the current implementation plan in the project. Identify all phases and tasks.

## Step 1: Parallel Track Analysis

Analyze the implementation plan and identify:
- Which phases/tasks have dependencies on each other
- Which phases/tasks can run **independently and in parallel**

Group independent work into separate **tracks**.

## Step 2: Parallel Implementation

For each track, simultaneously kick off a `frontend-ui-engineer` agent to implement the changes for that track.

Once a `frontend-ui-engineer` agent completes its work on a track:
1. Hand the output to a `senior-code-reviewer` agent for review
2. The `senior-code-reviewer` provides structured feedback
3. Pass that feedback back to the `frontend-ui-engineer` agent for revisions
4. Repeat this cycle until the track is fully implemented and approved

All tracks should progress concurrently — do not wait for one track to finish before starting another.

## Step 3: Final Review Panel

Once **all tracks** across all agents are complete, kick off **three** `senior-code-reviewer` agents in parallel, each reviewing the final state of the application from a distinct perspective:
- **Reviewer 1**: Code quality, architecture, and maintainability
- **Reviewer 2**: Performance, security, and edge cases  
- **Reviewer 3**: Consistency, naming conventions, and adherence to project standards

## Step 4: Test Engineer (conditional)

$ARGUMENTS

If the argument `test` was passed, after the final review panel completes, kick off a `test-engineer` agent to review the final state of the application, write tests, and validate the implementation end-to-end.

---

**Remember**: You are the orchestrator. Coordinate, delegate, and synthesize — never write code yourself.