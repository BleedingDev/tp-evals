# Operator Log

## Handoff Bundle

- plans root: `./.codex/plans`
- selection: `--glob '*.plan.md'`
- graph id: `01-workshop-repo-scope-plus-9-plans-b770550c01`
- selection hash: `b770550c01`
- snapshot path: `/Users/satan/work/clients/tp-evals/.codex/plan-graphs/01-workshop-repo-scope-plus-9-plans-b770550c01/snapshot.json`
- state dir: `/Users/satan/work/clients/tp-evals/.codex/plan-graphs/01-workshop-repo-scope-plus-9-plans-b770550c01`
- dependency overlay:
  - `01-workshop-repo-scope:02-runtime-tooling`
  - `01-workshop-repo-scope:03-domain-fixtures-datasets`
  - `02-runtime-tooling:04-capability-mocks`
  - `03-domain-fixtures-datasets:04-capability-mocks`
  - `03-domain-fixtures-datasets:05-scorer-library`
  - `04-capability-mocks:06-evalite-labs`
  - `05-scorer-library:06-evalite-labs`
  - `06-evalite-labs:07-participant-docs`
  - `06-evalite-labs:08-facilitator-runbook`
  - `06-evalite-labs:09-checkpoint-branches`
  - `07-participant-docs:10-verification`
  - `08-facilitator-runbook:10-verification`
  - `09-checkpoint-branches:10-verification`

## Limits

- resolved `max_threads=50`
- resolved `max_depth=3`
- launch posture: keep the main agent on the critical path; use 2 write-capable sidecars initially because only runtime tooling and datasets are unblocked and their write scopes can stay disjoint.

## Launch Graph

Goal: build the TypeScript Evalite beta workshop repository from the plan-backed DAG without introducing customer-specific data, unrelated methodology, or participant-visible checkpoint branch references.

Critical path:
`Workshop Repo Scope -> Runtime Tooling + Domain Fixtures And Datasets -> Capability Mocks + Scorer Library -> Evalite Labs -> Participant Docs + Facilitator Runbook + Checkpoint Branches -> Verification`

Wave 0:
- `Workshop Repo Scope`: completed locally by the primary agent.

Wave 1:
- `Runtime Tooling`: write-capable worker, owns package/runtime/config/container files only.
- `Domain Fixtures And Datasets`: write-capable worker, owns dataset schemas, dataset loader/validation utilities, and JSONL data files only.

Likely Wave 2:
- `Capability Mocks`: after runtime and datasets land.
- `Scorer Library`: after datasets land.

Merge points:
- Runtime plus dataset integration before capability mocks.
- Capability mocks plus scorer library before Evalite lab files.
- Evalite labs before participant docs, facilitator runbook, and checkpoint branch finalization.

Conflict hotspots:
- `package.json`, lockfile, `tsconfig.json`, `mise.toml`, `.prototools`, Docker files: runtime worker only.
- `src/datasets/**`, `data/**`: dataset worker only.
- Shared app/scorer interfaces should not be edited by Wave 1 workers unless explicitly in their scope.
- Participant docs must not be created in Wave 1.

## Live Lanes

| Lane | Agent | Owner / Write Scope | Status | Next Action |
| --- | --- | --- | --- | --- |
| Runtime Tooling | `019e22c4-b1f5-7bd0-a3e2-4c11d09f0837` / Lovelace | `package.json`, TypeScript config, Evalite config, Mise/Proto, Docker, env example, runtime scripts only | completed | integrated; typecheck/smoke/data:check passed before Wave 2 |
| Domain Fixtures And Datasets | `019e22c4-b273-78a3-98e6-be7fd43c85ab` / Einstein | `src/datasets/**`, `data/**`, dataset validation scripts only | completed | reviewed initial files; wait for Runtime Tooling before Wave 2 |
| Capability Mocks | `019e22d0-a479-7ae2-8668-a73f25cba1b9` / Galileo | `src/apps/**`, `src/variants/**` only | completed | integrated; typecheck passed after scorer lane completed |
| Scorer Library | `019e22d0-a4dc-7e53-9fd0-7ad6194e0350` / Gauss | `src/scorers/**`, `src/judges/**` only | completed | integrated; typecheck/smoke/data:check passed |
| Evalite Labs | `019e22de-17cf-70a2-b20e-e4dde4d6aebb` / Raman | `evals/**` and `.codex/plans/06-evalite-labs.plan.md` only | completed | integrated; local `typecheck`, `lab:all`, and `data:check` passed |
| Participant Docs | `019e22e5-5a61-7551-ae3c-21343e80d73c` / Nietzsche | `README.md`, `docs/setup.md`, `docs/troubleshooting.md`, `docs/labs/**` only | completed | integrated; participant-facing leakage scan passed |
| Facilitator Runbook | `019e22e5-5aca-7f23-b601-59a9419d3595` / Dirac | `docs/facilitator/**` only | completed | integrated; instructor-only checkpoint guidance kept out of participant docs |
| Checkpoint Branches | local primary | git initialization/checkpoint branch state and `.codex/plans/09-checkpoint-branches.plan.md` only | completed | created 12 local checkpoint branches and verified `checkpoint/04-mobile-search-intent` with `pnpm run lab:04` |

## Integration Notes

- Fixed lab port isolation in `scripts/run-lab.ts`: individual labs now use deterministic per-lab ports and can be manually overridden with `EVALITE_LAB_PORT`.
- Added `.gitignore` and `.dockerignore` so generated Evalite output, dependencies, and local secrets stay out of repo and Docker contexts.
- Added `mise trust` to setup/troubleshooting after local verification showed Mise blocks untrusted repo configs.

## Verification Record

- `pnpm run verify`: passed locally in mock mode.
- Parallel `pnpm run lab:06` + `pnpm run lab:10`: passed without port collision.
- `pnpm run eval:all`: passed 10 eval files / 44 evals / 84% suite score.
- `pnpm run eval:export`: exported run with 11 suites / 44 results.
- Optional live judge fallback: passed with `TP_EVALS_LIVE_JUDGE=1` and no endpoint, returning mock fallback metadata.
- `pnpm run docker:build`: passed.
- `pnpm run docker:verify`: passed through Docker Compose with dependency volume.
- `mise trust && mise run smoke && mise run data:summary`: passed.
- Local checkpoint branches created: `checkpoint/00-runtime` through `checkpoint/11-final`; participant-facing docs contain no branch names or rescue commands.
- Repository scan for sensitive/customer strings and unrelated eval methodology terms: passed after removing the stale internal mention from scope/operator notes.
