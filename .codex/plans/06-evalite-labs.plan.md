---
name: Evalite Labs
overview: Create at least six hands-on Evalite lab files that exercise dataset quality, translation evaluation, mobile search intent testing, variant comparison, summary evaluation, judge calibration, prompt injection, and consistency regression.
todos:
  - id: lab-001
    content: Create Lab 1 for dataset quality checks over intentionally flawed JSONL records.
    status: completed
  - id: lab-002
    content: Create Lab 2 for deterministic translation guardrail evaluation.
    status: completed
  - id: lab-003
    content: Create Lab 3 for translation quality evaluation with rubric-backed judge scoring.
    status: completed
  - id: lab-004
    content: Create Lab 4 for mobile search single-turn intent extraction and structured output scoring.
    status: completed
  - id: lab-005
    content: Create Lab 5 for mobile search conversation history, missing details, changed intent, and follow-up behavior.
    status: completed
  - id: lab-006
    content: Create Lab 6 for prompt and model variant comparison using Evalite beta patterns.
    status: completed
  - id: lab-007
    content: Create Lab 7 for travel information summary evaluation against supplied source text and expected facts.
    status: completed
  - id: lab-008
    content: Create Lab 8 for judge calibration using known good, bad, and borderline examples.
    status: completed
  - id: lab-009
    content: Create Lab 9 for prompt injection and data leakage regression checks.
    status: completed
  - id: lab-010
    content: Create Lab 10 for consistency, paraphrase stability, repeated-run variance, thresholds, and result export.
    status: completed
isProject: false
---

# Evalite Labs

## Execution Notes

This plan owns the actual workshop exercises. There must be at least six labs; the intended repo design includes ten so the instructor can choose depth and pacing later without changing the repository architecture.

Expected lab files:

- `evals/01-dataset-quality.eval.ts`
- `evals/02-translation-guardrails.eval.ts`
- `evals/03-translation-quality.eval.ts`
- `evals/04-mobile-search-intent.eval.ts`
- `evals/05-mobile-search-conversation.eval.ts`
- `evals/06-prompt-model-variants.eval.ts`
- `evals/07-travel-info-summary.eval.ts`
- `evals/08-judge-calibration.eval.ts`
- `evals/09-prompt-injection.eval.ts`
- `evals/10-consistency-regression.eval.ts`

## Constraints

- Every lab must run in mock mode.
- Every lab must have a visible failure that participants can inspect and reason about.
- Every lab must keep participant edits small: dataset case, expected value, prompt variant, threshold, or scorer parameter.
- Avoid hidden magic. Labs should be inspectable TypeScript.
- Do not include checkpoint branch names in lab files or lab docs.

## Operator Guidance

Each lab should have a clear "what this teaches" note in facilitator materials, but participant-facing docs should stay task-oriented. The repo should support deeper discussion without forcing every participant to finish every lab.
