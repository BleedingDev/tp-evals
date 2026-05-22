# Follow-up After The Workshop

Use this repository as a starting point for a repo-first eval process. Keep production data out of the workshop fixtures. Real traces should be anonymized and reduced before they become eval cases.

## First Internal Pilot

Pick one AI feature and one narrow risk:

- translation: protected placeholders, tags, product codes, glossary drift,
- mobile search: wrong intent, invented slots, unsafe action without clarification,
- supplied-text summary: unsupported claim, missing warning, insufficient source handling,
- prompt injection: hostile instruction inside supplied text.

Create 10 to 20 synthetic or anonymized cases. Each case needs:

- `input`: the smallest reproducible user/app input,
- `expected`: concrete expected behavior and blocked behavior,
- `risk`: low, medium, or high,
- `labels`: searchable tags for triage,
- `notes` or `reviewHint`: why the case exists.

## Production Failure To Regression Case

```text
production trace
  -> remove secrets and personal data
  -> reduce to minimal input
  -> write expected behavior
  -> add risk and labels
  -> run data:check
  -> run relevant lab/eval
  -> review in merge request
```

Do not copy raw logs directly into JSONL. The dataset should explain the risk without requiring access to private production context.

## Release Gate Shape

Use deterministic scorers for hard rules:

- schema validity,
- protected fragments,
- forbidden claims,
- prompt-injection safety,
- required and disallowed slots.

Use LLM as a Judge for quality:

- meaning,
- completeness,
- naturalness,
- source grounding,
- work with uncertainty.

Judge results should be reviewable through visible criteria, dimension scores, and calibration examples.

## Suggested Commands

```sh
pnpm run docs:check
pnpm run data:check
pnpm run audit:mock
pnpm run workshop:audit
```

For live model checks:

```sh
pnpm run live:check
pnpm run lab:02
pnpm run lab:09
```

## What Good Looks Like

- Every prompt/model change has an eval case or updates an existing one.
- Every production failure becomes a regression case after anonymization and review.
- High-risk cases can block release even when suite average is green.
- Dashboard evidence is useful for debug, but the source of truth remains in Git.
- Coding agents may draft cases and checks; QA owns risk, criteria, and approval.
