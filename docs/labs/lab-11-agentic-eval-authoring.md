# Lab 11: Agentic Eval Authoring

## Goal

Use a coding agent to create or extend an eval case, then verify the result yourself. The agent can draft the dataset and code changes, but QA owns the expected behavior, risk level, and release decision.

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

Then open `docs/agent-prompts/lab-11-agentic-eval-authoring.md` and paste the prompt into Cline, GitHub Copilot Chat, or another coding agent.

Ask the agent to add one new synthetic case to `data/evals/agent-authored-summary.jsonl`. Pick one risk:

- unsupported claims,
- missing source information,
- warning handling,
- length or clarity regression,
- high-risk case that should not be hidden by the average.

After the agent edits the repo, do not accept the change blindly. Review:

1. Is the case synthetic and safe to share?
2. Is `expectedBehavior` clear enough for another tester?
3. Are `requiredFacts` and `forbiddenClaims` concrete?
4. Does `risk` match the business impact?
5. Does the scorer output explain the result?

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
