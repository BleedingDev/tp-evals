# Lab Contracts

Use this as the stable instructor-facing map for every lab. The same contract is printed by `pnpm run lab:NN` before Evalite starts.

## Lab 01 - Dataset Quality Audit

- Runtime: local deterministic
- Anchor case: `translation-cancel-booking-incomplete`
- Open: `.evalite/results/lab-01.json`, `data/evals/dataset-quality-broken.jsonl`
- Read: `rowStatus`, `fixPlan`, `detectedIssueTypes`, `suggestedFixes`
- Edit: propose the smallest safe fix for one broken dataset row
- Expected signal: the audit identifies planned dataset defects; green means defect detection works
- Reset: keep fixture data broken unless the instructor intentionally creates a diff
- QA decision: blocking dataset, review-only dataset, or gate-ready dataset

## Lab 02 - Translation Guardrails

- Runtime: live generation + deterministic scorers
- Anchor case: `translation-edge-tags-fr`
- Experiment case: `translation-edge-placeholders-es`
- Open: `.evalite/results/lab-02.json`, `data/evals/translations-edge-cases.jsonl`
- Read: `output.text`, `scores`, `expected.mustPreserve`, `expected.forbiddenPatterns`
- Edit: add `{{missing_placeholder}}` to `input.placeholders` in `translation-edge-placeholders-es`
- Expected signal: the same case starts expecting a placeholder that the output does not contain, so guard score drops
- Reset: remove `{{missing_placeholder}}`
- QA decision: release blocker or review signal for protected-fragment damage

## Lab 03 - Translation Quality Judge

- Runtime: live generation + judge
- Anchor cases: `translation-basic-cancel-es`, `translation-edge-tags-fr`, `translation-edge-drawer-es`
- Open: `.evalite/results/lab-03.json`, `data/evals/translations-basic.jsonl`, `data/evals/translations-edge-cases.jsonl`
- Read: `guardrails`, `judge`, `next`, `expected.minQualityScore`
- Edit: refine one expectation note or threshold for a borderline case
- Expected signal: hard fail, quality fail, and policy review are separated
- Reset: revert the threshold or note if it was only a demo
- QA decision: release gate, review dashboard, or calibration suite

## Lab 04 - Mobile Search Intent

- Runtime: live generation + deterministic scorers
- Anchor case: `mobile-intent-open-third-no-context`
- Open: `.evalite/results/lab-04.json`, `data/evals/mobile-search-intents.jsonl`
- Read: `intent expected->actual`, `slots`, `missingSlots`, `confidence`
- Edit: add or refine one disallowed or missing slot on an ambiguous case
- Expected signal: `next` points to intent, invented, missing, slots, confidence, or pass
- Reset: revert the dataset edit if it was only a controlled experiment
- QA decision: continue with app action or ask clarification

## Lab 05 - Mobile Search Conversation

- Runtime: live generation + judge
- Anchor case: `mobile-convo-nonstop-ambiguous`
- Open: `.evalite/results/lab-05.json`, `data/evals/mobile-search-conversation.jsonl`
- Read: conversation history, current utterance, carried slots, missing slots
- Edit: change visible result history so the ambiguous reference becomes unique
- Expected signal: action-vs-clarification behavior changes
- Reset: restore the ambiguous history
- QA decision: trigger UI action or clarification flow

## Lab 06 - Live Prompt Variants

- Runtime: live generation + judge
- Anchor case: `translation-edge-tags-fr` across `plain` and `guard`
- Open: `.evalite/results/lab-06.json`, `evals/06-prompt-model-variants.eval.ts`, `data/evals/translations-edge-cases.jsonl`
- Read: same case across variants, `guard`, `judge`, `next`
- Edit: add one edge case to `records.filter(...)`
- Expected signal: the winner is decided by case-level blockers, not average score
- Reset: restore the original selected case set
- QA decision: safer prompt variant for the next test round

## Lab 07 - Travel Info Summary

- Runtime: live generation + judge
- Anchor case: `travel-summary-luggage-limit`
- Open: `.evalite/results/lab-07.json`, `data/evals/travel-info-summary.jsonl`
- Read: `requiredFacts`, `forbiddenClaims`, `includeWarning`, `insufficientSource`
- Edit: add one dangerous forbidden claim
- Expected signal: `source_grounded_summary` explains unsupported or missing facts
- Reset: remove the demo forbidden claim unless it becomes a regression case
- QA decision: release gate, review signal, or blocker

## Lab 08 - Judge Calibration

- Runtime: judge calibration
- Anchor case: `judge-borderline-summary`
- Open: `.evalite/results/lab-08.json`, `evals/08-judge-calibration.eval.ts`
- Read: `targetBand`, `minScore`, `maxScore`, `dimensionScores`, `weakest`
- Edit: adjust one borderline band boundary with a QA reason
- Expected signal: known good and known bad stay in their bands; borderline remains reviewable
- Reset: restore the band if the edit was only a calibration demo
- QA decision: gate-ready judge or review-only judge

## Lab 09 - Prompt Injection

- Runtime: live generation + judge in live mode; local handler in mock mode
- Anchor case: `pi-hidden`
- Open: `.evalite/results/lab-09.json`, `data/evals/prompt-injection.jsonl`
- Read: `trustedInstruction`, `userRequest`, `suppliedText`, `blockedInstructions`
- Edit: add one `prohibitedResponseTrait` or `requiredResponseTrait`
- Expected signal: safety scorer protects the injected instruction without rejecting the whole safe task
- Reset: revert the expectation edit if it was only a demo
- QA decision: release blocker or review signal

## Lab 10 - Consistency Regression

- Runtime: local deterministic recorded regression
- Anchor case: `consistency-policy-window`
- Open: `.evalite/results/lab-10.json`, `data/evals/consistency.jsonl`
- Read: `invariantAnswer`, `mustMatchFields`, `allowedDifferences`, `regressionCases`
- Edit: refine one `mustMatchFields` or `allowedDifferences` entry
- Expected signal: the gate separates meaning drift from allowed phrasing changes
- Reset: revert the invariant edit if it was only a demo
- QA decision: acceptable variance or regression blocker

## Lab 11 - Agentic Eval Authoring

- Runtime: live generation + judge
- Anchor case: `agent-summary-transfer`
- Open: `.evalite/results/lab-11.json`, `data/evals/agent-authored-summary.jsonl`, `evals/11-agentic-eval-authoring.eval.ts`
- Read: `source`, `judge`, `review`, `next`, agent diff
- Edit: ask an agent for exactly one synthetic missing-source case and one review check
- Expected signal: `data:check` and `lab:11` pass or fail with an explainable QA decision
- Reset: keep the agent diff only if QA review confirms risk and metadata
- QA decision: release blocker, review signal, or weak case
