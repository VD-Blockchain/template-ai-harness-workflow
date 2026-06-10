---
description: "Step 3 of the harness flow: execute a written plan with an agent team (Developer → DevOps → Tester loop) until a fresh Tester confirms zero issues."
argument-hint: "<path to plan file under docs/superpowers/plans/>"
---

# Code Feature with Agent Team

You are the **team lead**. Execute the plan at: `$ARGUMENTS`
(if no path was given, ask the user which plan file under `docs/superpowers/plans/` to run,
then stop until answered).

Precondition: this plan came out of `/brainstorm` → `/write-plan` (Steps 1–2). You do NOT
redesign anything here — the plan is the contract. If the plan is missing or has no task
breakdown, stop and tell the user to run Steps 1–2 first.

## Team setup

Create an agent team with these teammates (definitions in `.claude/agents/`):

1. **developer** — from `harness-developer`. Spawn prompt must include: `PLAN=<plan path>`
   and "implement all tasks in plan order, tick checkboxes in the plan file, then hand off
   to teammate 'devops'".
2. **devops** — from `harness-devops`. Spawn prompt must include the plan path and
   "wait for the developer's hand-off message before acting".
3. **tester** — from `harness-tester`, but DO NOT spawn it yet. See the freshness rule below.

As lead you ONLY coordinate: route messages, spawn/retire testers, track loop state.
You never write code, deploy, or test anything yourself.

> Fallback: if agent teams are unavailable in this session, run the same loop with
> sequential subagents (Task tool) using the same agent definitions and the same
> hand-off/freshness rules. The loop semantics below do not change.

## The loop

Repeat until exit condition:

1. **Developer** implements all pending work (initial plan tasks, or the latest bug list),
   ticks the corresponding `- [x]` boxes in the plan file, merges to `main`, pushes, then
   messages **devops** with the changed-services hand-off.
2. **DevOps** deploys every changed service (`scripts/deploy-service.sh <svc> local`),
   verifies the FULL local system is healthy (every compose service up + healthy, smoke
   checks per the runbook), then reports readiness to you.
   - If DevOps reports a code-level failure, route it to the developer and restart the
     loop — a deploy that cannot go fully healthy never reaches the Tester.
3. **Tester freshness rule (critical):** spawn a BRAND-NEW teammate `tester-r<N>` from
   `harness-tester` for every round (round 1 → `tester-r1`, round 2 → `tester-r2`, ...).
   Never reuse or resume a previous tester — its fresh, implementation-blind context is
   the point. Its spawn prompt must contain ONLY:
   - `PLAN=<plan path>`,
   - the DevOps readiness report (deployed services + entry points/URLs),
   - (rounds ≥ 2) the previous round's bug list marked "developer claims these are fixed —
     re-verify every one".
   Do NOT include the developer's implementation notes, diffs, or your own opinions about
   what probably works.
4. **Tester** runs its full two-level matrix (Level 1 user e2e + Level 2 pentest) and
   returns a verdict:
   - `ISSUES FOUND` → forward the complete bug list to **developer**, retire `tester-r<N>`,
     increment N, go to step 1.
   - `TESTER CONFIRMED: NO ISSUES` → exit the loop.

Keep a short round log for the user after each round: round number, tasks/fixes done,
deploy result, bugs found vs fixed.

## Exit condition (all three required)

- Tester verdict is `TESTER CONFIRMED: NO ISSUES` with its executed test matrix attached;
- DevOps confirms every service in the local environment is up and healthy;
- all plan tasks are checked off in the plan file.

A tester verdict from a round where ANY code changed afterwards is void — any new commit
requires a fresh deploy and a fresh tester round.

## After the loop (automatic — do NOT stop to ask the user)

Once the tester confirms:

1. Doc freshness check (CLAUDE.md rules): contract/use-case docs updated in the same
   commits; plan outcome folded into `docs/system-knowledge/**` tree nodes; new services
   registered (system map row, compose entry, runbook smoke row).
2. Ensure everything is merged to `main` and pushed.
3. If the project's `CLAUDE.md` defines a staging/production promotion flow, instruct
   **devops** to execute it and verify the same way it verified local. (The template
   ships local-only — skip otherwise.)
4. Shut down the team.
5. Summarize for the user: rounds needed, total bugs found/fixed by level, final entry
   points/URLs, and the tester's final matrix.

## Anti-shortcut rules

| Temptation | Rule |
|---|---|
| Lead "quickly verifies" instead of spawning a tester | Forbidden. Only a fresh `tester-r<N>` can produce a verdict. |
| Reuse `tester-r1` for round 2 "to save tokens" | Forbidden. Fresh context per round is the core design. |
| Tester found only minor bugs → skip the re-test round | Every fix triggers a full new round. |
| Developer and DevOps disagree about a failure | Lead routes evidence both ways; DevOps owns infra, Developer owns code. |
| "Tester confirmed — let me ask the user before wrapping up" | Don't. Tester confirmation IS the green light: docs fold → merge → summary. |
| Plan turns out to be wrong/incomplete mid-loop | Pause the team, surface it to the user — plan changes go back to Step 2 (`/write-plan`). |
