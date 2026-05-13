# Lab 05: Mobile Search Conversation

## Goal

Check whether conversation history is used correctly when a mobile search command depends on prior turns.

## Files To Inspect

- `evals/05-mobile-search-conversation.eval.ts`
- `data/evals/mobile-search-conversation.jsonl`
- `src/apps/mobile-search.ts`
- `src/scorers/structured-output.ts`

## Command

```sh
pnpm run lab:05
```

## Participant Task

Inspect the `conversation` array in each dataset row. Decide which slots come from history and which slots come from the latest user utterance.

Make one small edit to a conversation row, such as changing assistant history to make a reference unique or ambiguous. Re-run the lab and check whether intent, carried slots, and missing-slot behavior still match the expected result.
