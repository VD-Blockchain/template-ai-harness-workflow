---
description: "Step 2 of the harness flow: turn an approved spec into an executable plan-<x>.md — epics → tasks, each with a short architecture note + code sketch + verification, checkbox-tracked."
argument-hint: "<path to an approved spec under docs/superpowers/specs/>"
---

# Write Plan

You are running **Step 2 (writing-plans)** of the 3-step harness flow
(`/brainstorm` → `/write-plan` → `/team-code-feature`).

Input spec: `$ARGUMENTS`
(if empty, list `docs/superpowers/specs/` and ask the user which one).

Preconditions — stop and tell the user if violated:
- The spec file exists and its `Status` is `Approved`. A Draft spec goes back to `/brainstorm`.

Your single deliverable: `docs/superpowers/plans/plan-<date>-<slug>.md` (same slug as the
spec). This file is the **anchor of Step 3**: agents execute it task by task and tick
`- [x]` checkboxes in it as they go — it is both the contract and the history of work.

## 1. Re-ground

- Read the spec fully. The spec is the contract — you do not re-litigate its decisions.
- Read every knowledge-tree node the spec lists, then read the ACTUAL code those nodes
  point to.
- **Verify conventions in code** — never trust docs or memory for anything the plan
  depends on: build commands, ports, helper scripts, framework versions, naming patterns,
  how `scripts/deploy-service.sh` discovers services. Record each verified fact as a
  bullet **with the real file path you checked**. Greenfield: record instead what you
  verified about the template (runbook conventions, compose service requirements).

## 2. Decompose

- Group work into **epics** (≤5 typical), each epic into **tasks** a developer can finish
  and verify in one sitting.
- Order by dependency; explicitly mark tasks that can run in parallel (e.g. independent
  services, backend vs frontend).
- Every task MUST contain:
  - **Files:** create/modify list with real paths.
  - **What & How:** 3–10 lines of technical specification — the implementation idea.
  - A SHORT illustrative sketch (code / config / schema, ≤25 lines) when it removes
    ambiguity. It is a sketch, not final code.
  - **Steps:** `- [ ]` checkboxes, ending with a verification step that RUNS something
    (exact test command / curl / URL + expected observable output).
- The final epic is always: **doc freshness** — update the knowledge-tree nodes named in
  the spec, register new services per `CLAUDE.md`, plus a short demo/spot-check script
  for a human.

## 3. Plan file format

```markdown
# Plan — <Title>

> **For agentic workers:** execute tasks in order; tick `- [x]` IN THIS FILE as each
> step completes — this file is the live progress tracker and the history of work.

**Goal:** <1 paragraph>
**Architecture:** <how the pieces fit; 1 paragraph + optional ascii diagram>
**Tech stack:** <...>
**Spec:** <spec path>
**Branch:** feature/<slug>

**Conventions verified in code (<date>):**
- <fact> — <file path checked>

**Acceptance criteria (from the spec — the Tester executes these):**
1. <copied verbatim>

---

### Epic A — <name>

#### Task A1: <name>
**Files:** ...
**What & How:** ...
<optional sketch>
**Steps:**
- [ ] Step 1: ...
- [ ] Step N: verify — `<command>` → <expected>
```

## 4. Adversarial sanity pass

Walk the plan once as a skeptic before showing it:
- Any acceptance criterion no task delivers?
- Any task whose verification an outside tester could not reproduce?
- Missing migration / seed data / CORS / auth wiring between tasks?
- Dependency order deadlocks? Forgotten compose/healthcheck/runbook registration?
Fix what you find.

## 5. Confirm

Show the user the epic/task tree (titles only) + the plan path. Iterate until approved.
On approval: commit the plan and tell the user the next command:

```
/team-code-feature docs/superpowers/plans/plan-<date>-<slug>.md
```

## Red flags

| Temptation | Rule |
|---|---|
| Plan re-litigates spec decisions | The spec is the contract. Real conflict → pause, send the user back to `/brainstorm`. |
| "Verify by reading the code" | Every task verifies by RUNNING something. |
| One giant task "implement the feature" | Split until one-sitting-sized. |
| Conventions from memory | Check the file; cite the path in the header section. |
| Write final production code in the plan | Sketches ≤25 lines only; the Developer owns final code. |
| Skip the doc-freshness epic | It is mandatory — the tree is cumulative. |
