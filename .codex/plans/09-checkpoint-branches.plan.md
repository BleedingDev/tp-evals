---
name: Checkpoint Branches
overview: Create instructor-only git checkpoint branches for each stable workshop state so participants can be rescued without exposing the mechanism in materials.
todos:
  - id: checkpoint-001
    content: Initialize git repository state and define checkpoint branch naming convention for instructor-only use.
    status: completed
  - id: checkpoint-002
    content: Create runtime-ready checkpoint after tooling, install, smoke, and Docker verification pass.
    status: completed
  - id: checkpoint-003
    content: Create lab checkpoints after each lab reaches a runnable and independently verifiable state.
    status: completed
  - id: checkpoint-004
    content: Create final polished checkpoint with all labs, docs, runbook, and verification complete.
    status: completed
  - id: checkpoint-005
    content: Verify no participant-facing material references checkpoint branch names or internal rescue procedures.
    status: completed
isProject: false
---

# Checkpoint Branches

## Execution Notes

The checkpoint branch system is an instructor safety net. It should exist in git, but not in participant-facing workshop instructions.

Intended internal branch sequence:

- `checkpoint/00-runtime`
- `checkpoint/01-dataset-quality`
- `checkpoint/02-translation-guardrails`
- `checkpoint/03-translation-quality`
- `checkpoint/04-mobile-search-intent`
- `checkpoint/05-mobile-search-conversation`
- `checkpoint/06-prompt-model-variants`
- `checkpoint/07-summary`
- `checkpoint/08-judge-calibration`
- `checkpoint/09-prompt-injection`
- `checkpoint/10-consistency-regression`
- `checkpoint/11-final`

## Constraints

- Do not mention these branches in README, setup docs, or lab handouts.
- Each checkpoint must be independently runnable after checkout.
- Each checkpoint must preserve all prior working labs unless intentionally scoped otherwise in the runbook.
- Do not create checkpoint branches before the corresponding state is verified.

## Operator Guidance

When implementation begins, treat checkpoint creation as part of done criteria for each lab. A checkpoint that does not run from a clean checkout is not a checkpoint.
