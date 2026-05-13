---
name: Scorer Library
overview: Implement reusable deterministic scorers, structured-output scorers, safety scorers, consistency scorers, and judge scorers for the workshop labs.
todos:
  - id: scorer-001
    content: Implement text guardrail scorers for placeholders, tags, forbidden phrases, length ratio, glossary terms, and output language heuristics.
    status: completed
  - id: scorer-002
    content: Implement structured-output scorers for schema validity, field accuracy, missing-field behavior, and intent classification.
    status: completed
  - id: scorer-003
    content: Implement summary scorers for required facts, unsupported claims, contradiction markers, warning coverage, and refusal correctness.
    status: completed
  - id: scorer-004
    content: Implement safety scorers for instruction override, system prompt leakage, schema bypass, and secret-like output.
    status: completed
  - id: scorer-005
    content: Implement consistency scorers for paraphrase equivalence, repeated-run variance, and regression counts.
    status: completed
  - id: scorer-006
    content: Implement mock judge and optional live judge scorer with rubric dimensions and calibration metadata.
    status: completed
isProject: false
---

# Scorer Library

## Execution Notes

The scorer library is the workshop's reusable testing toolkit. It should show that testers can start with deterministic checks, then add judge-based evaluation only where subjective quality makes deterministic scoring insufficient.

Suggested module layout:

- `src/scorers/text-quality.ts`
- `src/scorers/structured-output.ts`
- `src/scorers/summary.ts`
- `src/scorers/safety.ts`
- `src/scorers/consistency.ts`
- `src/scorers/judge.ts`
- `src/judges/rubrics.ts`
- `src/judges/mock-judge.ts`
- `src/judges/live-judge.ts`

## Constraints

- Prefer deterministic scorers before judge scorers.
- Judge scoring must be rubric-based, not a vague score request.
- Mock judge must be available by default.
- Live judge must be opt-in through environment variables.
- Keep scorer output explainable in Evalite UI.

## Operator Guidance

Scorers should return enough explanation for participants to understand failure causes. A numeric score without rationale is not sufficient for workshop learning.
