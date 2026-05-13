# Lab 11 Agent Prompt: Author A New Eval Case

Use this prompt in Cline, GitHub Copilot Chat, or another coding agent from the repository root.

```text
You are helping with an Evalite QA workshop repository.

Goal:
Add one new synthetic eval case for Lab 11. The case should test travel summary quality, unsupported claims, warning handling, or missing source information.

Allowed files:
- data/evals/agent-authored-summary.jsonl
- evals/11-agentic-eval-authoring.eval.ts only if the new case requires a small scoring or filtering adjustment

Rules:
- Do not use real company, customer, passenger, booking, airport, or route data.
- Keep the case synthetic and safe to share.
- Follow the existing TravelSummaryRecord JSONL shape exactly.
- Add clear expectedBehavior, labels, risk, metadata.reviewHint, requiredFacts, forbiddenClaims, and notes.
- Prefer one focused high-value case over a large dataset dump.
- Do not change unrelated labs.

After editing:
- Run pnpm run data:check.
- Run pnpm run lab:11.
- Report the files changed, what risk the new case covers, and whether the eval result is a release blocker or a review signal.
```

Review the agent's diff before accepting it. The agent can draft the case, but QA owns the final expected behavior and scoring decision.
