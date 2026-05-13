# Lab 08: Judge Calibration

## Goal

Check whether known good, borderline, and bad examples land in the expected judge score bands.

## Before You Start

LLM as a Judge means that one model evaluates the output produced by the application or another model. This is useful for quality questions that are hard to check with simple code, such as:

- Did the answer keep the important meaning?
- Did it include the required warning?
- Did it add unsupported claims?
- Is it clear enough for a user?

Calibration means checking the judge against examples where we already know the expected outcome:

- `known good`: should receive a high score,
- `known bad`: should receive a low score,
- `borderline`: should land in a review band, not be treated as clearly good or clearly bad.

If calibration fails, do not immediately assume the tested app is bad. First inspect:

- the judging criteria,
- the calibration examples,
- the score bands,
- the judge model output.

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

Run the lab:

```sh
pnpm run lab:08
```

Then open `evals/08-judge-calibration.eval.ts` and inspect `calibrationData`.

For each calibration example, compare:

1. `output`: the text being judged,
2. `expectedBehavior`: what should happen,
3. `expected.targetBand`: expected band (`good`, `borderline`, `bad`),
4. `judgeScore`: actual score from the judge,
5. `dimensionScores`: which criterion pulled the score up or down.

Make one small calibration edit, such as narrowing or widening the score band for the borderline example. Re-run `pnpm run lab:08` and decide whether the band is useful for tester review.
