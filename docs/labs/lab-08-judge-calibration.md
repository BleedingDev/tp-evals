# Lab 08: Judge Calibration

## Goal

Check whether known good, borderline, and bad examples land in the expected judge score bands.

## Files To Inspect

- `evals/08-judge-calibration.eval.ts`
- `src/judges/live-judge.ts`
- `src/judges/rubrics.ts`
- `src/scorers/judge.ts`

## Command

```sh
pnpm run lab:08
```

## Participant Task

Inspect the three inline calibration examples. For each one, compare the rubric, sample output, expected behavior, and target score band.

Make one small calibration edit, such as narrowing or widening a score band for the borderline example. Re-run the lab and decide whether the band is useful for tester review.
