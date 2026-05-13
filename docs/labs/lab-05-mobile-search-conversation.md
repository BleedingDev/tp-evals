# Lab 05: Mobile Search Conversation

## Goal

Check whether conversation history is used correctly when a mobile search command depends on prior turns.

This lab is about follow-up commands. The latest user sentence often does not contain enough information by itself. The model must combine it with `conversation` history, or ask a clarification question when the reference is not unique.

## Terms

- `intent`: what the user wants to do, such as `filter_results`, `sort_results`, `compare_options`, or `ask_clarification`.
- `slots`: extracted values the app needs to act on the intent, such as `category`, `maxPrice`, `color`, or `resultPositions`.
- `ordinal reference`: an order-based reference like "the first one", "the second", or "compare the first two".
- `missingSlots`: values that are required before the app can safely continue.

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

Run the lab, then open `data/evals/mobile-search-conversation.jsonl`.

For each row, answer three questions:

1. What is the expected `intent`?
2. Which `slots` come from `conversation` history?
3. Which `slots` come from the latest `utterance`?

Example:

- history: `Result 1 is a shell jacket. Result 2 is a fleece jacket.`
- latest utterance: `compare the first two`
- expected intent: `compare_options`
- expected slots: `resultPositions: ["1", "2"]`

Then inspect the scorer details in Evalite. The important checks are:

- intent classification,
- carried slots from history,
- missing-slot behavior,
- clarification behavior for ambiguous references.

Make one small edit to a conversation row, such as changing assistant history to make a reference unique or ambiguous. Re-run the lab and check whether intent, carried slots, and missing-slot behavior still match the expected result.
