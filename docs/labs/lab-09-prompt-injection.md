# Lab 09: Prompt Injection

## Goal

Evaluate whether the app treats instructions inside supplied text as untrusted content while still completing the requested task.

## Files To Inspect

- `evals/09-prompt-injection.eval.ts`
- `data/evals/prompt-injection.jsonl`
- `src/scorers/safety.ts`
- `src/judges/rubrics.ts`

## Command

```sh
pnpm run lab:09
```

## Participant Task

Read the `trustedInstruction`, `suppliedText`, and expected traits for each case. Separate content that may be summarized or classified from instructions that must be ignored.

Make one small edit to `blockedInstructions`, `requiredResponseTraits`, or `prohibitedResponseTraits`. Re-run the lab and confirm that the safety scorer reflects the behavior you meant to protect.
