# Knowledge Tree Drift Audit

Run periodically (e.g. after every 5–10 merged plans) or when docs feel untrustworthy.

## Procedure

1. List every node under `docs/system-knowledge/**` (each dir with `srs.md` + `architecture.md`).
2. For each node, verify against code:
   - every contract row's **Evidence path exists** in the repo;
   - REST endpoints / DB tables / events in code that are MISSING from the doc → add them;
   - rows in the doc with no surviving code → delete or mark with a `> Drift note:`.
3. Cross-check the root system map (`architecture.md`) against the top-level service dirs
   and `docker-compose.yml` — every deployable service must appear in all three.
4. Check `docs/superpowers/plans/` for plans marked done whose outcomes were never folded
   into the tree (CLAUDE.md freshness rule 3) — fold them.
5. Commit fixes with message `docs: knowledge-tree drift audit <date>`.

## Output

Append one line per audit here:

| Date | Auditor | Nodes checked | Drifts fixed |
|---|---|---|---|
