# Lab 06: Prompt And Model-Like Variants

## Goal

Compare two deterministic translation variants and decide which failures are prompt-like, model-like, or expectation-related.

The point is not to trust the average score. The point is to compare the same cases across variants and find which exact case got better, worse, or stayed risky.

## Files To Inspect

- `evals/06-prompt-model-variants.eval.ts`
- `data/evals/translations-edge-cases.jsonl`
- `src/variants/index.ts`
- `src/apps/translation.ts`

## Command

```sh
pnpm run lab:06
```

## Participant Task

Run the lab:

```sh
pnpm run lab:06
```

Then open `evals/06-prompt-model-variants.eval.ts` and find two things:

1. `variants`: this defines which variants are compared.
2. `records.filter(...)`: this defines which dataset cases are included.

The starting comparison is:

- `plain-ui-translation` backed by `translation.baseline`,
- `guardrailed-translation` backed by `translation.improved`,
- three selected cases from `data/evals/translations-edge-cases.jsonl`.

In Evalite, compare the two variants case by case:

- Did placeholders stay unchanged?
- Did tags stay balanced?
- Did protected product codes stay exact?
- Did glossary terms improve or regress?
- Is a single high-risk failure hidden by a better average?

Make one small edit:

- add or remove one case ID in `records.filter(...)`, or
- change one variant in `variants`.

Re-run `pnpm run lab:06` and confirm that the comparison now focuses on the case or variant you intended to study.
