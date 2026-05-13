# Lab 06: Prompt And Model-Like Variants

## Goal

Compare two deterministic translation variants and decide which failures are prompt-like, model-like, or expectation-related.

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

Look at the variant names and the three filtered translation cases. In Evalite, compare the plain variant with the guarded variant for placeholder, tag, and glossary behavior.

Make one small edit to the variant list or the filtered case list in the lab file. Re-run the lab and confirm that the comparison now focuses on the case you intended to study.
