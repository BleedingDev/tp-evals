# Lab 10: Consistency Regression

## Goal

Check whether equivalent prompts produce stable answers and whether current scores stay close enough to stored baseline scores.

## Files To Inspect

- `evals/10-consistency-regression.eval.ts`
- `data/evals/consistency.jsonl`
- `src/scorers/consistency.ts`

## Command

```sh
pnpm run lab:10
```

## Participant Task

Inspect the paraphrase variants for each case. Compare the expected invariant answer, fields that must match, allowed differences, and consistency threshold.

Make one small edit to `allowedDifferences`, `mustMatchFields`, or `minConsistencyScore`. Re-run the lab and decide whether the regression signal is easier to interpret.
