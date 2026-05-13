# Lab 11 Fallback Agent Prompt: Author A New Eval Case And Check

Use this only as a fallback if you are stuck writing your own task. The primary lab path is to formulate your own bounded coding-agent assignment from the repository root.

```text
You are helping with an Evalite QA workshop repository.

Goal:
Add one new synthetic eval case for Lab 11 and one small eval-code check that makes the case reviewable. The case should test travel summary quality, unsupported claims, warning handling, or missing source information.

Allowed files:
- data/evals/agent-authored-summary.jsonl
- evals/11-agentic-eval-authoring.eval.ts

Rules:
- Do not use real company, customer, passenger, booking, airport, or route data.
- Keep the case synthetic and safe to share.
- Follow the existing TravelSummaryRecord JSONL shape exactly.
- Add clear expectedBehavior, labels, risk, metadata.reviewHint, requiredFacts, forbiddenClaims, and notes.
- Add one small scorer, metadata assertion, or review check in evals/11-agentic-eval-authoring.eval.ts.
- Keep the eval-code change local to Lab 11 and easy for a QA reviewer to understand.
- Prefer one focused high-value case over a large dataset dump.
- Do not change unrelated labs.

After editing:
- Run pnpm run data:check.
- Run pnpm run lab:11.
- Report the files changed, what code check you added, what risk the new case covers, and whether the eval result is a release blocker or a review signal.
```

Review the agent's diff before accepting it. The agent can draft the case, but QA owns the final expected behavior and scoring decision.
