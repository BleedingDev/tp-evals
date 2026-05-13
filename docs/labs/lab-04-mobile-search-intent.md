# Lab 04: Mobile Search Intent

## Goal

Evaluate single-turn mobile search intent extraction, required slots, missing slots, ambiguity, and disallowed invented fields.

## Files To Inspect

- `evals/04-mobile-search-intent.eval.ts`
- `data/evals/mobile-search-intents.jsonl`
- `src/apps/mobile-search.ts`
- `src/scorers/structured-output.ts`

## Command

```sh
pnpm run lab:04
```

## Participant Task

Pick one direct search case and one ambiguous utterance. Compare the dataset's `expected` object with the mock output in Evalite.

Make one small dataset edit, such as adding a disallowed slot, clarifying a missing slot, or adjusting `minIntentConfidence`. Re-run the lab and confirm whether the structured-output score explains the change.
