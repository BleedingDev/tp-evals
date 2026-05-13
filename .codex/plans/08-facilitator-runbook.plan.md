---
name: Facilitator Runbook
overview: Prepare instructor-only guidance for lab sequencing, expected failures, discussion prompts, rescue procedures, and branch-based checkpoints.
todos:
  - id: runbook-001
    content: Document the intended learning point and expected failure mode for each lab.
    status: completed
  - id: runbook-002
    content: Document instructor-only rescue steps using checkpoint branches without copying those branch names into participant materials.
    status: completed
  - id: runbook-003
    content: Document optional deeper discussion prompts for dataset design, scorer reliability, judge calibration, and release gating.
    status: completed
  - id: runbook-004
    content: Document how to switch between mock mode and optional live model mode during facilitation.
    status: completed
  - id: runbook-005
    content: Document pre-workshop dry-run checklist and last-minute environment checks.
    status: completed
isProject: false
---

# Facilitator Runbook

## Execution Notes

This plan owns material that participants should not need. It is where checkpoint branch names can exist, because the instructor needs a reliable way to recover participants who get stuck.

The runbook should include expected outputs, likely mistakes, and a concise "what to say" for important conceptual points.

## Constraints

- Keep this separate from participant docs.
- Do not let branch names or answer keys leak into participant-facing files.
- Keep rescue instructions deterministic and tested.
- Keep optional live model mode clearly optional.

## Operator Guidance

The runbook is the place for operational reality: port conflicts, failed installs, one participant far behind, and what to skip if time is tight. It should make the workshop resilient without simplifying the labs down to toy-only content.
