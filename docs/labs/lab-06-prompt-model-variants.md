# Lab 06: Live Prompt Variants

## Goal

Compare two live OpenRouter prompt variants on the same translation cases and decide which failures are caused by the prompt, the model behavior, or the expectation.

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

- `plain-ui-translation`: a weaker prompt with fewer instructions,
- `guardrailed-translation`: a stricter prompt with explicit guardrails,
- three selected cases from `data/evals/translations-edge-cases.jsonl`.

Both variants call the same live OpenRouter model. The lab changes the prompt instructions and payload.

In Evalite, compare the two variants case by case:

- Did placeholders stay unchanged?
- Did tags stay balanced?
- Did protected product codes stay exact?
- Did glossary terms improve or regress?
- Is a single high-risk failure hidden by a better average?

Run one controlled experiment:

1. In `records.filter(...)`, add `translation-edge-mode-de` to the selected case IDs.
2. Re-run `pnpm run lab:06`.
3. Compare whether the average score and the case-level failures tell the same story.

This is not a random edit. You are changing the scope of the eval suite to see whether the QA conclusion still holds when the dataset selection changes.

Optional stronger contrast: change the first variant input from `translation.baseline` to `translation.flawed`, then rerun `pnpm run lab:06`.

Re-run `pnpm run lab:06` and confirm that the comparison now focuses on the cases you intended to study.
