---
name: Runtime Tooling
overview: Prepare the TypeScript runtime, Evalite beta dependency, package scripts, Mise and Proto configuration, Docker fallback, and environment model so every participant can run the labs.
todos:
  - id: runtime-001
    content: Create package metadata with strict TypeScript, ESM, pnpm, tsx, zod, vitest, and evalite beta dependencies.
    status: completed
  - id: runtime-002
    content: Add TypeScript configuration with strict settings and predictable module resolution for Evalite lab files.
    status: completed
  - id: runtime-003
    content: Add Proto and Mise configuration with pinned Node and pnpm versions plus one-command setup and verification tasks.
    status: completed
  - id: runtime-004
    content: Add Dockerfile and compose service that can install dependencies and run all mock-mode verification without host tooling.
    status: completed
  - id: runtime-005
    content: Add environment configuration for mock mode by default and optional live model or live judge mode through explicit env variables.
    status: completed
  - id: runtime-006
    content: Add stable package scripts for smoke, dataset validation, individual labs, all evals, and result export.
    status: completed
isProject: false
---

# Runtime Tooling

## Execution Notes

This plan makes the empty repository runnable. The repository should follow the successful shape of the reference training repository: pinned runtime, short task aliases, Docker fallback, and a verification command that works without external credentials.

Evalite must be installed from the beta channel, not from a conservative stable line. The workshop should track the current Matt Pocock v1 direction. Pin the resolved version in the lockfile at implementation time so participant machines behave consistently.

Expected participant commands should stay simple:

- `mise run start`
- `mise run verify`
- `mise run lab:01`
- `mise run lab:all`
- `mise run docker:verify`

## Constraints

- Default mode must not require an API key.
- Optional live mode must be explicit and safe to skip.
- Do not expose checkpoint branch names through package scripts.
- Do not require global npm installs, Corepack assumptions, or manually installed Evalite CLI.
- Docker must be a fallback path, not a separate workshop implementation.

## Operator Guidance

Keep command names stable even if Evalite beta CLI behavior changes. If needed, hide CLI churn behind TypeScript wrapper scripts in `scripts/` while preserving participant-facing commands.
