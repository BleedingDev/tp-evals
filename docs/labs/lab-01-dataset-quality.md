# Lab 01: Dataset Quality Repair

## Goal

Practice spotting broken dataset metadata before it reaches app or scorer logic.

## Files To Inspect

- `evals/01-dataset-quality.eval.ts`
- `data/evals/dataset-quality-broken.jsonl`
- `src/datasets/index.ts`

## Command

```sh
pnpm run lab:01
```

## Participant Task

Open the broken dataset and identify what is wrong in each row: empty labels, invalid anonymization flags, invalid risk, capability typo, empty participant edit targets, and out-of-range thresholds.

In the Evalite output, compare `detected_repair_issues` with `repair_checklist`. The expected edit is a small dataset-quality repair plan: write down the exact field changes you would make, then discuss which checks should be automated versus reviewed by a tester.
