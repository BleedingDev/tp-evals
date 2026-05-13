# Lab 04: Mobile Search Intent

## Goal

Evaluate single-turn mobile search intent extraction, required slots, missing slots, ambiguity, and disallowed invented fields.

## Terms

- `intent`: what the user wants to do, for example `find_item`, `filter_results`, or `ask_clarification`.
- `slots`: extracted values needed by the app, for example `category`, `maxPrice`, `material`, `color`, or `resultPositions`.
- `missingSlots`: values the model says are missing before the app can safely continue.
- `confidence`: how sure the model claims to be about the selected intent.

## Files To Inspect

- `evals/04-mobile-search-intent.eval.ts`
- `data/evals/mobile-search-intents.jsonl`
- `src/providers/openrouter.ts`
- `src/scorers/structured-output.ts`

## Command

```sh
pnpm run lab:04
```

## Participant Task

Pick one direct search case and one ambiguous utterance. Compare the dataset's `expected` object with the live model output in Evalite.

Make one small dataset edit, such as adding a disallowed slot, clarifying a missing slot, or adjusting `minIntentConfidence`. Re-run the lab and confirm whether the structured-output score explains the change.
