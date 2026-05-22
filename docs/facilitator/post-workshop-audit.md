# Post-Workshop Audit

## Scope

This audit reviews the workshop repository after the live delivery with a focus on:

- deterministic behavior where the workshop should be deterministic,
- stable row ordering and scoring,
- clear separation between local harness stability and live model variance,
- minimal changes needed to polish the existing workshop without rebuilding it from scratch.

The current working tree contains a local Lab 05 dataset edit in `data/evals/mobile-search-conversation.jsonl`. The audit did not revert or overwrite it.

## Executive Summary

The core harness can be deterministic when Evalite runs are isolated correctly. In isolated mock mode, all 11 labs produced identical row order and identical scores across 10 repeated runs.

The original workshop was not operationally robust because the normal local environment made mock/live switching unreliable. `mise.toml` sets `WORKSHOP_MODE=live`, `.env` can also set `WORKSHOP_MODE=live`, and the old `src/env.ts` overwrote existing process env values from `.env`. That meant a command that appeared to force mock mode could still run live mode.

Current fix status: `.env` no longer overwrites already-defined process env values, `pnpm run lab:NN -- --mock` is handled by the workshop runner, single-lab exports are sanity-checked against the requested lab file, and audit commands use isolated Evalite DB paths.

Live runs without LLM-as-a-Judge are not stable when the task itself calls a live model. Lab 02 and Lab 04 showed stable row order but drifting scores across 10 live runs. Lab 01 and Lab 10 were stable in live-mode audit because they do not depend on live model generation.

## Audit Method

### Isolated Mock Determinism

Mock audit used:

```sh
WORKSHOP_MODE=mock
TP_EVALS_LIVE_JUDGE=0
LIVE_LLM_ENABLED=false
--threshold 0
--noCache
unique EVALITE_DB_PATH per run/lab
```

The `.env` file had to be temporarily moved aside during the audit because `src/env.ts` currently overwrites shell-provided environment values.

### Live No-Judge Subset

Live audit tested labs without LLM-as-a-Judge as the primary scorer:

- Lab 01
- Lab 02
- Lab 04
- Lab 10

This separates deterministic local checks from variance caused by live model task outputs.

Raw audit artifacts are written under `.audit/determinism/` and are intentionally ignored by Git.

## Results

### Mock Mode, 10 Runs

| Lab | Result |
| --- | --- |
| 01 | Stable average, row order, and scorer values |
| 02 | Stable average, row order, and scorer values |
| 03 | Stable average, row order, and scorer values |
| 04 | Stable average, row order, and scorer values |
| 05 | Stable average, row order, and scorer values |
| 06 | Stable average, row order, and scorer values |
| 07 | Stable average, row order, and scorer values |
| 08 | Stable average, row order, and scorer values |
| 09 | Stable average, row order, and scorer values |
| 10 | Stable average, row order, and scorer values |
| 11 | Stable average, row order, and scorer values |

Important caveat: Lab 05 is stable but currently below the normal threshold because the working tree has an uncommitted local dataset experiment.

### Live Mode Without Judge, 10 Runs

| Lab | Average Stability | Row Order | Score Stability | Observed Range |
| --- | --- | --- | --- | --- |
| 01 | Stable | Stable | Stable | 1.000000000 |
| 02 | Drift | Stable | Drift | measured by `pnpm run audit:live-nojudge` |
| 04 | Drift | Stable | Drift | measured by `pnpm run audit:live-nojudge` |
| 10 | Stable | Stable | Stable | 0.622640693 |

Lab 02 drift came from `translation-edge-tags-fr`. The live model consistently damaged protected fragments, but the exact damaged form varied, which changed `forbidden_phrases` and `text_guardrails`.

Lab 04 drift came from:

- `mobile-intent-denver-missing-origin-date`
- `mobile-intent-open-third-no-context`

The live model varied `missingSlots`, `confidence`, and sometimes the `intent`, which changed structured-output scoring.

## Findings

### F1: Mock Mode Is Not Reliably Selectable From Normal Commands

`mise.toml` sets `WORKSHOP_MODE=live`. The local `.env` also sets `WORKSHOP_MODE=live`. `src/env.ts` then overwrites process env values with values from `.env`.

Impact:

- `WORKSHOP_MODE=mock pnpm ...` can still run live.
- Instructor dry runs can accidentally consume live model calls.
- Determinism audits are misleading unless they isolate `.env`, mise, Evalite DB, and cache.

Fix status:

- Done: `loadWorkshopEnv` no longer overwrites already-defined process env values.
- Done: `pnpm run lab:NN -- --mock` forces mock mode in the child Evalite process.
- Done: `pnpm run audit:mock` runs all labs in isolated deterministic mock mode.

### F2: Evalite Export Can Be Misleading Without DB Isolation

Fast repeated runs using the shared Evalite DB produced a mismatch: console output showed the correct lab, but the exported JSON could contain the previous suite.

Impact:

- Automated audit based on JSON export can read the wrong lab.
- Participants can be sent to a result file that does not match the visible console output.

Fix status:

- Done: audit scripts use unique `EVALITE_DB_PATH` per run/lab.
- Done: single-lab runner checks that exported suite filepath matches the requested lab file.
- Still true: avoid parallel rapid multi-lab export flows unless DB isolation is enabled.

### F3: Live No-Judge Does Not Mean Deterministic

Lab 02 and Lab 04 do not use LLM-as-a-Judge, but they still call the live model to produce the output being scored.

Impact:

- The phrase "no judge = deterministic" is false for live task labs.
- Participants can see score drift even when scorers are deterministic.

Fix status:

- Done: runner prints a lab contract with runtime type before every lab.
- Done: handouts link to the shared lab contract.
- Done: shared contract labels every lab as one of:
  - `local deterministic`
  - `live generation + deterministic scorer`
  - `live generation + judge`
  - `judge calibration`
- Pending: align presentation slides with the new contracts.

### F4: Lab 05 Currently Fails Normal Threshold In This Working Tree

In mock isolated audit, Lab 05 was stable but averaged `0.655359147`, below the normal `70%` threshold.

Impact:

- This is not a determinism failure.
- It is caused by the current uncommitted local dataset experiment.

Fix status:

- Decide whether the local Lab 05 edit becomes a deliberate exercise variant or gets reverted manually by the instructor.
- Do not ship the polished version with a dirty Lab 05 dataset unless the lab instructions explicitly explain the failing state.

### F5: Some Labs Are Operationally Clearer Than Pedagogically Clear

The current lab docs and command output are much better than the live-workshop version, but the teaching path is still not guaranteed.

Impact:

- A participant can run the lab and still not know which exact case to inspect first.
- The instructor still needs tacit knowledge for the best demo path.

Fix status:

- Done: `docs/facilitator/lab-contracts.md` defines the explicit contract for every lab:
  - anchor case,
  - result JSON path,
  - dataset path,
  - fields to inspect,
  - one controlled edit,
  - expected before/after signal,
  - reset step,
  - QA decision.

## Minimal Improvement Plan

### Phase 1: Stabilize Runtime Control

Status: implemented.

1. Make `.env` loading non-overwriting.
2. Add explicit scripts:
   - `audit:mock`
   - `audit:live-nojudge`
   - general `pnpm run lab:NN -- --mock` support.
3. Add `.audit/` to `.gitignore`.
4. Add a result sanity check that fails if exported suite filepath does not match requested lab file.

Acceptance:

- `WORKSHOP_MODE=mock pnpm run lab:02` really uses mock mode.
- 10 isolated mock runs show stable suite name, row order, average, and scorer values.

### Phase 2: Add Lab Runtime Classification

Status: implemented in lab contracts and handouts; pending slide alignment.

Add a small visible classification to each lab handout and command output.

Recommended labels:

- Lab 01: local deterministic
- Lab 02: live generation + deterministic scorers
- Lab 03: live generation + judge
- Lab 04: live generation + deterministic scorers
- Lab 05: live generation + judge
- Lab 06: live generation + judge
- Lab 07: live generation + judge
- Lab 08: judge calibration
- Lab 09: live generation + judge in live mode, local handler in mock mode
- Lab 10: local deterministic recorded regression
- Lab 11: live generation + judge

Acceptance:

- No lab implies deterministic scoring if its task output comes from a live model.
- Every slide and lab doc tells the instructor whether drift is expected.

### Phase 3: Normalize Lab Contracts

Status: implemented in `docs/facilitator/lab-contracts.md` and printed by `pnpm run lab:NN`; detailed per-lab handout prose can still be polished.

For each lab, add the same section structure:

```text
Runtime
Anchor case
Run
Open
Read
Edit
Re-run
Expected signal
Reset
QA decision
```

Acceptance:

- A participant can complete the lab without guessing which file to open.
- The command output after `pnpm run lab:NN` matches the handout and slide.

### Phase 4: Add Golden Path For Instructor

Status: implemented as `docs/facilitator/golden-path.md`.

Create `docs/facilitator/golden-path.md`.

Each lab gets one compact card:

- 30-second explanation,
- anchor case,
- live demo edit,
- expected signal,
- known drift behavior,
- fallback if live model behaves differently.

Acceptance:

- The instructor can teach each lab without opening implementation files.
- If live output differs, the instructor knows whether to continue, switch case, or use a checkpoint.

### Phase 5: Polish Active Learning Without Rewriting Labs

Status: pending.

Keep the existing 11 labs. Change only the activity framing.

Each lab should follow:

```text
Observe -> Explain -> Modify -> Re-run -> Decide
```

Acceptance:

- Every lab has at least one active participant action.
- Passive reading is allowed only as the first step, never as the whole lab.

### Phase 6: Final Workshop QA Gate

Status: implemented as `pnpm run workshop:audit`.

Add a single command:

```sh
pnpm run workshop:audit
```

It should check:

- TypeScript compiles.
- Dataset validation passes.
- All lab docs exist.
- Every lab command prints `Jak číst` and `Jak postupovat`.
- Every lab has anchor case, result path, dataset path, and reset step.
- Mock isolated determinism passes for all labs.
- Live no-judge subset is measured and reported, not treated as deterministic.

Acceptance:

- The polished version can be tagged only after `pnpm run workshop:audit` passes.

## Recommended Next Work Order

1. Fix env precedence and audit scripts.
2. Clean or formalize the current Lab 05 local dataset edit.
3. Add runtime classification to all lab docs and command output.
4. Add lab contract sections to Lab 01-11.
5. Create `docs/facilitator/golden-path.md`.
6. Align slides with the new lab contracts.
7. Re-run isolated mock determinism 10x.
8. Re-run live no-judge subset 10x and document expected drift.
9. Tag the repo as `workshop-v1.1-polished`.
