---
name: Verification
overview: Verify the repository from clean local and Docker paths, with and without optional live model credentials, and ensure no sensitive or out-of-scope content has entered the workshop.
todos:
  - id: verify-001
    content: Verify fresh local setup using the primary Mise and Proto path.
    status: completed
  - id: verify-002
    content: Verify Docker setup from a clean checkout without host node_modules.
    status: completed
  - id: verify-003
    content: Verify every lab command in mock mode.
    status: completed
  - id: verify-004
    content: Verify optional live judge or live model mode separately without making it required.
    status: completed
  - id: verify-005
    content: Verify dataset validation, TypeScript typecheck, smoke tests, Evalite runs, and result export.
    status: completed
  - id: verify-006
    content: Scan repository content for sensitive data, customer-identifying strings, checkpoint leakage in participant docs, and unrelated topics.
    status: completed
isProject: false
---

# Verification

## Execution Notes

This plan defines the final quality gate for the workshop repository. Verification must prove that the repo works for testers, not just for the author.

Verification modes:

- Local primary path with Mise and Proto.
- Docker fallback path.
- Mock-only mode with no API key.
- Optional live mode with approved credentials.
- Fresh checkout from scratch.

## Constraints

- Mock-only verification is mandatory.
- Live mode verification is optional and must not block the workshop.
- Do not accept a lab that only works on the author's machine.
- Do not accept participant docs that expose checkpoint branches.
- Do not accept any sensitive or identifying content.

## Operator Guidance

Verification should be automated where possible. Anything that must be checked manually should be short, explicit, and recorded in the facilitator runbook.
