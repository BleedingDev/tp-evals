# Lab 11: Agentic Eval Authoring

## Goal

Use a coding agent to create a new eval case and a small eval-code change, then verify the result yourself. The agent can draft the dataset and code changes, but QA owns the expected behavior, risk level, and release decision.

## Files To Inspect

- `docs/agent-prompts/lab-11-agentic-eval-authoring.md`
- `evals/11-agentic-eval-authoring.eval.ts`
- `data/evals/agent-authored-summary.jsonl`
- `src/scorers/summary.ts`
- `src/judges/rubrics.ts`

## Command

```sh
pnpm run lab:11
```

## Participant Task

Start by running the existing lab:

```sh
pnpm run lab:11
```

Then write your own task for Cline, GitHub Copilot Chat, or another coding agent. Do not start by pasting the fallback prompt. The point is to practice giving an agent a bounded QA engineering task.

Ask the agent to make two changes:

1. Add one new synthetic case to `data/evals/agent-authored-summary.jsonl`.
2. Add one small review check, scorer, or metadata assertion in `evals/11-agentic-eval-authoring.eval.ts` that makes the new case easier to review.

Pick one risk:

- unsupported claims,
- missing source information,
- warning handling,
- length or clarity regression,
- high-risk case that should not be hidden by the average.

Your agent task should include:

- the chosen risk,
- the allowed files,
- the requirement to use only synthetic share-safe data,
- the expected JSONL shape should match existing rows,
- the eval-code change should stay small and local to Lab 11,
- the verification commands: `pnpm run data:check` and `pnpm run lab:11`,
- the report you expect back: changed files, covered risk, and release decision.

If you get stuck, use `docs/agent-prompts/lab-11-agentic-eval-authoring.md` as a fallback prompt.

After the agent edits the repo, do not accept the change blindly. Review:

1. Is the case synthetic and safe to share?
2. Is `expectedBehavior` clear enough for another tester?
3. Are `requiredFacts` and `forbiddenClaims` concrete?
4. Does `risk` match the business impact?
5. Is the new eval-code check actually useful, or is it just a cosmetic assertion?
6. Does the scorer output explain the result?

Run:

```sh
pnpm run data:check
pnpm run lab:11
```

Decide whether the new case is:

- a release blocker,
- a review signal,
- or a weak case that should be rewritten.

## Stretch Task

Ask the agent to create a new eval file by cloning the Lab 11 pattern for a different capability, such as translation or mobile search. Keep the scope small:

- one dataset file,
- one eval file,
- one command or documented way to run it,
- one clear QA decision.
