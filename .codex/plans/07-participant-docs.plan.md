---
name: Participant Docs
overview: Write concise participant-facing setup and lab instructions that explain commands, expected edits, and troubleshooting without exposing checkpoint branch names.
todos:
  - id: docs-001
    content: Create README with workshop purpose, prerequisites, supported setup paths, and first verification command.
    status: completed
  - id: docs-002
    content: Create setup documentation for Mise, Proto, direct pnpm, and Docker paths.
    status: completed
  - id: docs-003
    content: Create one short lab handout per Evalite lab with goal, files to inspect, command to run, and participant task.
    status: completed
  - id: docs-004
    content: Create troubleshooting guide for dependency install, Docker, Evalite UI, port conflicts, and missing optional API keys.
    status: completed
  - id: docs-005
    content: Review all docs to remove checkpoint branch references and any sensitive or customer-identifying language.
    status: completed
isProject: false
---

# Participant Docs

## Execution Notes

Participant docs should be practical and short. They should help testers run the lab, understand what file to inspect, and know what outcome to look for in Evalite UI.

The docs must not teach implementation theory in depth. Deeper notes belong in facilitator materials or the later presentation content.

## Constraints

- Do not mention checkpoint branch names.
- Do not expose internal rescue workflows.
- Do not include customer names or private context.
- Keep commands copy-pasteable.
- Keep lab instructions focused on observable behavior and small edits.

## Operator Guidance

Use the docs to reduce workshop friction. Anything likely to derail a tester should be turned into a direct command, screenshot-free instruction, or troubleshooting entry.
