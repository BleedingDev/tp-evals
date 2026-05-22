# Facilitator Golden Path

Use this during delivery. Keep the participant focus on one loop:

```text
Observe -> Explain -> Modify -> Re-run -> Decide
```

The terminal table is a triage view. The decision evidence is always the result JSON plus the dataset row.

## Before The Workshop

Run:

```sh
pnpm run workshop:audit
pnpm run live:check
pnpm run audit:live-nojudge
```

Expected:

- `workshop:audit` passes.
- `audit:mock` reports stable order and scores for every lab.
- `audit:live-nojudge` reports stable order, but Lab 02 and Lab 04 may show live score drift.

If `workshop:audit` fails, do not share the repo as polished.

## Lab 01

Say:

> Green means the audit found the planned dataset defects. It does not mean the dataset is clean.

Show:

- `translation-cancel-booking-incomplete`
- `rowStatus`
- `fixPlan`

Ask:

- What field is broken?
- Why would this mislead QA?
- What is the smallest safe fix?

Decision:

- Dataset blocker, review-only, or gate-ready.

## Lab 02

Say:

> This is a hard guardrail lab. A fluent translation can still be a release blocker.

Show:

- Read-only fail: `translation-edge-tags-fr`
- Edit case: `translation-edge-placeholders-es`

Flow:

1. Open `.evalite/results/lab-02.json`.
2. Read `translation-edge-tags-fr`.
3. Open `data/evals/translations-edge-cases.jsonl`.
4. Add `{{missing_placeholder}}` to `input.placeholders` in `translation-edge-placeholders-es`.
5. Re-run `pnpm run lab:02`.
6. Remove the placeholder.

Live drift note:

- If a different case changes in live mode, keep the experiment anchored to `translation-edge-placeholders-es`.

Decision:

- Protected-fragment damage is a release blocker unless product explicitly accepts it.

## Lab 03

Say:

> Guardrails protect structure. Judge evaluates meaning and product usefulness.

Show:

- `translation-edge-tags-fr`: hard fail
- `translation-basic-cancel-es`: meaning problem
- `translation-edge-drawer-es`: policy or terminology review

Ask:

- Which failures are non-negotiable?
- Which failures need criteria or threshold refinement?

Decision:

- Release gate, review dashboard, or calibration suite.

## Lab 04

Say:

> The output is allowed to trigger an app action only if intent and slots are safe.

Show:

- `intent` as `expected->actual`
- `mobile-intent-open-third-no-context`

Ask:

- Did the model choose the correct app action?
- Did it invent a slot?
- Is missing information explicit?

Live drift note:

- `confidence` and `missingSlots` can vary in live mode. Read the case-level detail.

Decision:

- Continue with action or ask clarification.

## Lab 05

Say:

> This is the conversation version of Lab 04. We test whether the model can safely use history.

Show:

- `mobile-convo-nonstop-ambiguous`
- conversation history versus current utterance

Ask:

- Which slots came from history?
- Which slots came from the current utterance?
- Which slot is still missing?

Experiment:

- Make exactly one visible result nonstop.
- Re-run.
- Check whether clarification changes to action.

Decision:

- UI action or clarification flow.

## Lab 06

Say:

> Prompt comparison is not won by average score if a protected-fragment case fails.

Show:

- Same case under `plain` and `guard`
- `translation-edge-tags-fr`

Ask:

- Which variant is safer case-by-case?
- Does a blocker hide behind a good average?

Experiment:

- Add one more edge case to `records.filter(...)`.

Decision:

- Which variant deserves the next test round.

## Lab 07

Say:

> Summary must stay inside the supplied source text.

Show:

- `travel-summary-luggage-limit`
- `requiredFacts`
- `forbiddenClaims`

Experiment:

- Add one dangerous forbidden claim.
- Re-run.
- Check whether `source_grounded_summary` explains it.

Decision:

- Release gate, review signal, or blocker.

## Lab 08

Say:

> This lab tests the judge, not the application.

Show:

- `judge-borderline-summary`
- `targetBand`
- `weakest`
- `dimensionScores`

Ask:

- Did known good stay good?
- Did known bad stay bad?
- Is borderline still reviewable?

Decision:

- Gate-ready judge or review-only judge.

## Lab 09

Say:

> Instructions inside supplied text are data, not commands.

Show:

- `pi-hidden`
- `trustedInstruction`
- `userRequest`
- `suppliedText`
- `blockedInstructions`

Ask:

- What instruction must be ignored?
- Did the model still complete the safe task?

Decision:

- Prompt-injection release blocker or review signal.

## Lab 10

Say:

> We do not expect identical wording. We expect the same business invariant.

Show:

- `consistency-policy-window`
- `invariantAnswer`
- `mustMatchFields`
- `allowedDifferences`
- `regressionCases`

Ask:

- Is this style variance or behavior drift?
- Does baseline comparison reveal a real regression?

Decision:

- Acceptable variance or regression blocker.

## Lab 11

Say:

> Agent output is a draft. QA owns risk and approval.

Assignment:

```text
Add exactly one synthetic travel-summary eval case for missing source information.
Edit only:
- data/evals/agent-authored-summary.jsonl
- evals/11-agentic-eval-authoring.eval.ts

Add one small review check.
Run pnpm run data:check and pnpm run lab:11.
Report changed files, covered risk, added check, and QA decision.
```

Review:

- Synthetic data only.
- Clear `expectedBehavior`.
- Concrete `requiredFacts` and `forbiddenClaims`.
- Useful review metadata.
- One focused check, not broad refactoring.

Decision:

- Release blocker, review signal, or weak case.

## After The Workshop

Before sharing the polished version:

```sh
pnpm run workshop:audit
git status --short
```

Do not ship with accidental dirty dataset edits. Lab 05 experiments must either be reverted or documented as intentional exercise state.

Share `docs/follow-up.md` as the client-facing continuation path. It keeps the next steps focused on one internal pilot, anonymized production failures, and Git-based release evidence.
