# Lab 02: Translation Guardrails

## Goal

Check that translation outputs preserve protected fragments such as placeholders, tags, codes, and glossary terms.

## Files To Inspect

- `evals/02-translation-guardrails.eval.ts`
- `data/evals/translations-edge-cases.jsonl`
- `src/apps/translation.ts`
- `src/scorers/text-quality.ts`

## Command

```sh
pnpm run lab:02
```

## Participant Task

Inspect the edge-case dataset rows and note which values must be preserved exactly. Then review the scorers that check placeholders, tags, glossary terms, and forbidden phrases.

Make one small expectation edit in a dataset row, such as tightening a forbidden pattern or adding a note that explains why a protected fragment matters. Re-run the lab and confirm the score change matches your intent.
