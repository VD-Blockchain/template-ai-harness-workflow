# System Knowledge Tree — Conventions

Source of truth for **contracts & intent**. Code is truth for implementation.
Precedence on contradiction: **code > feature specs (docs/superpowers/specs/) > older docs**.

## Structure

Every node (root, cluster, service) has exactly two docs: `srs.md` + `architecture.md`.
Small projects may have only root + service nodes (no cluster layer) — add clusters when
you pass ~6 services. Target size: 50–200 lines per file. Over 200 → cut detail, keep contracts.

## srs.md template (business truth)

```markdown
# <Node Name> — SRS

## Purpose
<why this exists, 2-4 sentences>

## Actors & Consumers
<who calls it / consumes its events — humans and services>

## Use Cases
### UC-1: <name>
<trigger, main flow, outcome, error outcomes — concise>

## Business Rules
- BR-1: <rule>

## States & Transitions
<only if stateful; table or list of state → event → state>

## Out of Scope
- <explicitly not handled here>

## Related
- Parent: [<parent node> SRS](../srs.md)
- <peer links>
```

## architecture.md template (structural truth)

```markdown
# <Node Name> — Architecture

## Overview & Key Components
<components with REAL repo-relative file/package paths>

## Contracts
### REST endpoints
| Method | Path | Purpose | Evidence |
|---|---|---|---|
### Events / queues (if any)
| Direction | Topic/queue | Purpose | Evidence |
|---|---|---|---|
### DB schema (main tables)
| Table | Purpose | Evidence |
|---|---|---|

## Invariants
- <e.g. balance never negative>

## Dependencies
- Calls: <service → why>
- Called by: <service → why>

## Design Decisions & Rationale
- <decision> — <why>. (Origin: docs/superpowers/specs/<file> if known)

## Known Gotchas
- <gotcha>

## Related
- Parent: [<parent node> architecture](../architecture.md)
- <peer links>
```

## Hard rules

1. **Evidence rule:** every contract row cites ≥1 real, repo-relative code path that
   exists (e.g. `landing/src/components/Hero.tsx`). No line numbers, no globs.
2. **Drift notes:** where an older doc contradicted code, add `> Drift note: <what changed>`.
3. **Links are the knowledge graph:** every doc ends with `## Related` linking parent,
   children (cluster/root docs only), and directly-interacting peers, relative paths.
4. **Freshness:** change a contract/use case in code ⇒ update the node doc in the same
   PR. Feature specs are episodic; this tree is cumulative — fold merged spec outcomes in.
