---
description: "Step 1 of the harness flow: brainstorm a feature/bug/enhancement — clarifying questions + knowledge-tree reflection → an approved spec-<x>.md."
argument-hint: "<one-line description of the feature / bug / enhancement>"
---

# Brainstorm → Spec

You are running **Step 1 (brainstorming)** of the 3-step harness flow
(`/brainstorm` → `/write-plan` → `/team-code-feature`).

The raw requirement: `$ARGUMENTS`
(if empty, ask the user what they want to build / fix / improve, then continue).

Your single deliverable is an **APPROVED spec** at
`docs/superpowers/specs/spec-YYYY-MM-DD-<slug>.md` (today's date, short kebab-case slug).
In this step you clarify WHAT and decide the approach. You do NOT write implementation
detail and you NEVER write code.

## Phase A — Ground yourself in the knowledge tree

Before asking the user anything:

1. Read `docs/system-knowledge/architecture.md` + `srs.md` (root), then every cluster /
   service node plausibly affected by the requirement.
2. Skim `docs/superpowers/specs/` and `plans/` for overlapping or predecessor initiatives,
   and `docs/superpowers/context/` for cross-session recaps.
3. **Greenfield case** (the tree still holds template placeholders): note it explicitly —
   your questions shift from "how does this fit existing contracts" to "what should exist"
   (stack, hosting, conventions, first service boundaries).

Produce for yourself: the list of affected (or to-be-created) nodes, existing contracts
touched, and constraints/invariants that bound the design.

## Phase B — Clarifying-question loop

Run question rounds, not one giant dump:

1. Ask **at most 5 numbered questions per round**, highest-information first, drawn from
   two sources:
   - **Requirement gaps** — actors, scope boundaries, happy path, error behavior, data
     in/out, what "done" means, priorities.
   - **Knowledge-tree reflection** — for each constraint/contract found in Phase A that
     the requirement might violate or change, ask one question and cite the node
     (e.g. "`docs/system-knowledge/<node>/srs.md` BR-2 says X — does this change X?").
2. Prefer multiple-choice with a recommended default so the user can answer fast.
3. After each answer round, **re-reflect against the tree** (answers may make new nodes
   relevant) and decide: another round, or done.

Stop when actors + scope + acceptance behavior are unambiguous AND no knowledge-tree
conflict is unresolved. 2–4 rounds is typical.

## Phase C — Approach check

Propose 2–3 candidate approaches (one short paragraph each, with trade-offs), recommend
one, and let the user pick. Skip this ONLY when exactly one reasonable approach exists —
and say so explicitly.

## Phase D — Write the spec

Write `docs/superpowers/specs/spec-<date>-<slug>.md`:

```markdown
# Spec — <Title>

**Date:** <YYYY-MM-DD>
**Status:** Draft — awaiting user approval
**Predecessors:** <links to related specs, or "none">

## Problem
<the user's requirement distilled + why now>

## Decisions (with user)
<numbered Q → A log from Phases B/C — this is the history of work; keep every decision>

## Chosen approach
<1–2 paragraphs + why it beat the alternatives>

## Scope
### In
### Out (explicit non-goals)

## Affected knowledge-tree nodes
<paths under docs/system-knowledge/ + what changes in each; or "new node: <path>">

## Acceptance criteria
<numbered, externally testable — the Tester in Step 3 will execute these literally>

## Open questions
<anything consciously deferred, each with an owner>
```

## Phase E — Confirm

Show the user the spec path + a ≤10-line summary. Iterate until they approve.
On approval: set `Status: Approved — ready for /write-plan`, commit the spec, and tell
the user the next command:

```
/write-plan docs/superpowers/specs/spec-<date>-<slug>.md
```

## Red flags

| Temptation | Rule |
|---|---|
| Jump straight to writing the spec | Phases A + B are mandatory; minimum one question round unless the user already answered everything. |
| 15 questions in one wall | ≤5 per round, multiple rounds. |
| Put implementation detail (file paths, function names, libraries) in the spec | The spec is WHAT + decisions. HOW lives in the plan (Step 2). Stack choices the user made are decisions, fine. |
| Skip the tree because "it's a small change" | Tree reflection IS the step. Greenfield → say so and ask foundation questions instead. |
| Mark the spec Approved yourself | Only the user approves. |
| Acceptance criteria like "works correctly" | Each criterion must be executable by an outside tester (URL to open, request to send, expected observable result). |
