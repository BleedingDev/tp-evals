# Lab 07: Travel Info Summary

## Goal

Evaluate summaries against supplied source text, required facts, forbidden claims, source uncertainty, and warning handling.

## Files To Inspect

- `evals/07-travel-info-summary.eval.ts`
- `data/evals/travel-info-summary.jsonl`
- `src/apps/travel-summary.ts`
- `src/scorers/summary.ts`

## Command

```sh
pnpm run lab:07
```

## Participant Task

Pick a case where the source text is complete and a case where the source text is insufficient. Compare the summary output with `requiredFacts`, `forbiddenClaims`, `includeWarning`, and `insufficientSource`.

Make one small edit to a summary expectation, such as adding a forbidden claim or changing `maxSentences`. Re-run the lab and check whether the scorer highlights the summary behavior you wanted to test.
