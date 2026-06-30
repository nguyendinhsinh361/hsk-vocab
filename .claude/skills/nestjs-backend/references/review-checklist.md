# Review mode — rubric and hit-list

For PRs, modules, or whole-repo audits. Be specific and kind: issue → why it matters (consequence) → concrete fix with code. Prioritize by blast radius, not by ease of fixing. Run `scripts/repo_survey.py` first for whole-repo reviews — it finds the mechanical flags so you spend judgment on logic.

## Output structure

```
## Critical (fix before merge/release)
- [Issue] — file:line — consequence — fix

## Improve (worth doing soon)
- [Issue] — why — fix

## Working well (keep)
- [What's good and why]

## Top 3 if time is short
```

Quantify when possible ("this list endpoint returns all rows — at 100k orders that's ~80MB/request") and provide the fixed code snippet for Criticals.

## The hit-list (what reviewers actually miss, ordered by frequency × damage)

**Security (see security.md §10 for the grep-list)**
1. No global ValidationPipe / DTOs without decorators → every input unvalidated.
2. Unguarded mutating route; missing resource-ownership check on `:id` routes (IDOR).
3. String-built SQL / `$queryRawUnsafe` / `ORDER BY ${sort}`.
4. Hardcoded secrets, `|| 'secret'` fallbacks, committed `.env`.
5. Entities/models returned raw (password hash, internal fields in JSON).
6. Weak/sync bcrypt, eternal JWTs, no rate limit on auth.

**Correctness**
7. Multi-write without transaction; transaction block using ambient repos (writes escape the tx).
8. Check-then-act races (check stock then decrement; check-unique then insert) — fix with atomic conditional update / unique constraint + catch.
9. Swallowed errors (`catch (e) {}`, `.then()` without catch, floating promises — un-awaited async calls that fail silently).
10. Invalid state transitions unguarded (cancel a shipped order; pay twice).
11. Float math on money; timezone-naive date logic.

**Performance**
12. N+1 (await inside loop over rows; lazy relations; GraphQL resolvers without DataLoader).
13. Unbounded queries (no limit / pagination) and missing indexes for new query patterns.
14. Event-loop blockers: `bcrypt.hashSync`, sync fs/zlib, huge JSON ops in request path.
15. Slow third-party calls inline in the request (should be queued) ; no timeout on outbound HTTP (default = infinite).

**Maintainability**
16. Business logic in controllers; HTTP objects (`Request/res`) leaking into services.
17. Duplicated existing helper/component instead of reuse; new pattern diverging from repo convention without reason.
18. Module-boundary violations (importing another module's repository/entity directly).
19. `synchronize: true`, schema change without migration, migration without `down`.
20. Tests asserting mocks-were-called instead of behavior; no test for the bug being fixed; e2e wiring that doesn't mirror main.ts.

**Operability**
21. `console.log`; logs with tokens/PII; errors thrown without context (which order? which user?).
22. No graceful shutdown with queue workers; `@Cron` without multi-instance guard.
23. Failed-job black hole (no retry config, no DLQ/alerting).

## Review tone

State what's solid first when it's true (tests present, boundaries clean). For each Critical, give the minimal safe fix now and the better refactor later if they differ. If the codebase has a systemic gap (no validation anywhere), flag it once as architecture, not 40 times per field.
