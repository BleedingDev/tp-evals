# Lab 03: Translation Quality Judge

## Goal

Compare rule-based guardrails with a judge-style quality score for translation output.

## Files To Inspect

- `evals/03-translation-quality.eval.ts`
- `data/evals/translations-basic.jsonl`
- `data/evals/translations-edge-cases.jsonl`
- `src/judges/rubrics.ts`

## Command

```sh
pnpm run lab:03
```

## Participant Task

Review one passing, one borderline, and one failing translation case. Look at how `idealText`, `mustPreserve`, `forbiddenPatterns`, and `minQualityScore` guide the scorer.

Make one small edit to a dataset expectation or threshold, then re-run the lab. The goal is to decide whether the changed expectation makes the eval clearer for a QA review, not to make every case pass.
