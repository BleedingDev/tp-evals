# Facilitator Runbook

This guide is instructor-only. Keep checkpoint names, rescue commands, and answer-key style guidance out of participant-facing materials.

## Workshop Shape

Run the workshop in mock mode unless you are deliberately showing an optional live demo. The hands-on path is designed around deterministic fixtures, predictable failures, and case-level scorer inspection.

Recommended flow:

1. Setup check: `pnpm run smoke`, then `pnpm run data:summary`.
2. Lab 01 establishes dataset repair and schema discipline.
3. Labs 02-03 move from deterministic translation guardrails into judge-assisted quality scoring.
4. Labs 04-05 cover structured mobile-search intent extraction and conversation state.
5. Lab 06 compares prompt/model-like variants without changing the dataset.
6. Lab 07 covers supplied-text summary quality, uncertainty, and unsupported claims.
7. Lab 08 calibrates the rubric judge against known good, borderline, and bad examples.
8. Lab 09 tests prompt-injection resistance against supplied text that contains hostile instructions.
9. Lab 10 turns case scores into a consistency and regression gate.

If time is tight, keep Labs 01, 02, 04, 07, 09, and 10. Use Lab 06 as a short instructor-led comparison and Lab 08 as a discussion exercise.

## Lab Guide

| Lab | Command | Learning Point | Expected Failure Mode | Facilitator Cue | Rescue Target |
| --- | --- | --- | --- | --- | --- |
| 01 - Dataset Quality Repair | `pnpm run lab:01` | Eval results are only as useful as the dataset metadata, expected behavior, and repair checklist. | Broken rows should expose missing labels, invalid risk/capability values, unsafe source flags, empty edit targets, and out-of-range thresholds. | Ask which fields affect scoring, filtering, and reviewer trust. Emphasize that dataset quality is part of the test, not pre-work. | `checkpoint/01-dataset-quality` |
| 02 - Translation Guardrails | `pnpm run lab:02` | Deterministic scorers catch protected text, placeholders, tags, glossary terms, and forbidden phrases before a subjective quality discussion. | Failing translation cases break placeholders or tags, drift on glossary terms, or include forbidden patterns. | Ask participants to separate exact invariants from language-quality judgments. | `checkpoint/02-translation-guardrails` |
| 03 - Translation Quality Judge | `pnpm run lab:03` | A rubric judge can supplement hard guardrails when semantic quality matters. | Output may preserve protected text but still miss meaning, terminology, or quality thresholds. | Ask what the deterministic scorer should own versus what the judge should own. | `checkpoint/03-translation-quality` |
| 04 - Mobile Search Intent | `pnpm run lab:04` | Structured-output evals should verify schema, intent, slots, missing fields, confidence, and invented data. | Baseline cases invent disallowed slots, miss ambiguity, return low confidence, or fail the expected shape. | Ask which fields would block release and which should only trigger review. | `checkpoint/04-mobile-search-intent` |
| 05 - Mobile Search Conversation | `pnpm run lab:05` | Conversation state changes the expected intent and slots; the scorer should make state carry-over visible. | The app ignores prior turns, loses ordinal references, drops required slots, or fails to ask for missing information. | Ask how much conversation history belongs in the fixture and how to keep it readable. | `checkpoint/05-mobile-search-conversation` |
| 06 - Prompt And Model-Like Variants | `pnpm run lab:06` | Variant comparison should use the same cases so prompt/model changes can be judged case by case. | The under-specified variant looks acceptable on averages while still failing specific protected-text cases. | Ask participants to inspect per-case diffs before trusting an aggregate score. | `checkpoint/06-prompt-model-variants` |
| 07 - Travel Info Summary | `pnpm run lab:07` | Summary evals need required facts, forbidden claims, warning/uncertainty handling, and length checks tied to supplied text. | The flawed summary adds unsupported details, misses warnings, invents missing policy details, or exceeds the sentence limit. | Say "supplied text" and "source text"; keep the discussion about summary behavior, not outside knowledge. | `checkpoint/07-summary` |
| 08 - Judge Calibration | `pnpm run lab:08` | Judges need calibration examples so teams can see whether scores land in expected bands. | A judge that accepts the known bad case, rejects the known good case, or treats borderline cases too confidently is not ready for gating. | Ask what examples belong in a permanent calibration suite. | `checkpoint/08-judge-calibration` |
| 09 - Prompt Injection | `pnpm run lab:09` | The system must distinguish trusted task instructions from hostile instructions inside supplied text. | The vulnerable handler follows embedded instructions, emits evaluator-like text, leaks system-style content, or adds success claims. | Ask what content is allowed to pass through and what must be treated as data. | `checkpoint/09-prompt-injection` |
| 10 - Consistency Regression | `pnpm run lab:10` | Release gates should catch inconsistent repeated outputs and regressions against a baseline. | One high-risk case can fall below the baseline or consistency threshold while easier cases still pass. | Ask whether a single high-risk regression should block release even when the average looks healthy. | `checkpoint/10-consistency-regression` |

Use `checkpoint/00-runtime` when a participant has not reached the first lab. Use `checkpoint/11-final` for the finished repository state after all labs.

## Discussion Prompts

Dataset design:

- Which fields are required for filtering, review, and triage, not just scoring?
- What makes a borderline case useful instead of confusing?
- Where should the expected behavior be concrete, and where should it allow acceptable variation?
- How many intentionally failing cases should be included before the lab starts to feel noisy?

Deterministic scorers:

- Which invariant should be a hard check: schema, placeholders, tags, forbidden phrases, missing slots, or unsupported claims?
- What false positive would make the team stop trusting this scorer?
- Should the threshold fail the whole run or only flag review for a high-risk case?

Judge calibration:

- What known good, borderline, and bad examples should every judge change be tested against?
- Which dimensions should be visible in the result details so reviewers can challenge a score?
- How should the team respond when the judge and deterministic scorer disagree?

Prompt/model changes:

- Did the new variant improve the exact cases it was meant to improve?
- Which regression is hidden by the average score?
- What metadata must be captured with each run: prompt name, model-like variant, threshold, dataset version, and run time?

Prompt injection:

- Which instructions are trusted, and which are merely data inside supplied text?
- What response traits prove the system completed the real task without obeying embedded instructions?
- Which leaks or status claims should be scored as immediate failures?

Consistency:

- Which fields must stay invariant across repeated outputs?
- How much wording variation is acceptable when the answer remains equivalent?
- When should trial count increase, and what runtime cost does that create?

Release gating:

- Which lab scores are release blockers, and which are review signals?
- Should a high-risk case override the suite average?
- What evidence should be exported before approving a prompt or model-like variant change?

## Rescue Procedures

Keep these commands instructor-only. Do not paste checkpoint names into shared chat, README, setup docs, troubleshooting docs, or lab instructions.

Before switching a participant:

1. Ask them to stop any running Evalite watcher.
2. Check their work: `git status --short`.
3. Preserve local edits if they want them: `git stash push -u -m "workshop rescue before checkpoint"`.
4. Fetch checkpoints: `git fetch --all --prune`.
5. Move them onto a working rescue branch, for example: `git switch -c rescue-lab-04 checkpoint/04-mobile-search-intent`.
6. Reinstall only if dependencies may have changed: `pnpm install --frozen-lockfile`.
7. Verify the resumed point with the matching command, for example: `pnpm run lab:04`.

Checkpoint map:

| Situation | Branch |
| --- | --- |
| Runtime/setup is broken before Lab 01 | `checkpoint/00-runtime` |
| Ready to continue after Lab 01 | `checkpoint/01-dataset-quality` |
| Ready to continue after Lab 02 | `checkpoint/02-translation-guardrails` |
| Ready to continue after Lab 03 | `checkpoint/03-translation-quality` |
| Ready to continue after Lab 04 | `checkpoint/04-mobile-search-intent` |
| Ready to continue after Lab 05 | `checkpoint/05-mobile-search-conversation` |
| Ready to continue after Lab 06 | `checkpoint/06-prompt-model-variants` |
| Ready to continue after Lab 07 | `checkpoint/07-summary` |
| Ready to continue after Lab 08 | `checkpoint/08-judge-calibration` |
| Ready to continue after Lab 09 | `checkpoint/09-prompt-injection` |
| Ready to continue after Lab 10 | `checkpoint/10-consistency-regression` |
| Finished state | `checkpoint/11-final` |

Common rescues:

- Port conflict in the Evalite UI: set a temporary port, for example `EVALITE_PORT=3210 pnpm run eval:dev`.
- Port conflict in a single lab command: set a temporary lab port, for example `EVALITE_LAB_PORT=3210 pnpm run lab:04`.
- Cached result confusion: rerun with `EVALITE_CACHE=false pnpm run lab:04`.
- Dataset parse failure outside Lab 01: run `pnpm run data:check` and inspect the first reported JSONL line.
- One participant is far behind: move them to the next checkpoint branch and have them observe the current discussion rather than trying to repair every earlier edit live.
- A checkpoint branch is missing locally: run `git branch -a --list '*checkpoint*'`; if it is absent remotely too, use the last known good branch and continue with instructor screen share.

## Mock And Optional Live Mode

Default mock mode:

- `.env.example` starts with `WORKSHOP_MODE=mock`.
- Mock mode requires no provider keys.
- The lab tasks use deterministic fixtures and mock variants so every participant sees the same failures.
- Use mock mode for hands-on exercises, scoring discussions, and release-gating examples.

Optional live judge demo:

- The judge scorer can call a live judge endpoint when `TP_EVALS_LIVE_JUDGE=1` or `TP_EVALS_LIVE_JUDGE=true`.
- Set `TP_EVALS_LIVE_JUDGE_ENDPOINT` to the HTTP endpoint that accepts `{ rubric, input, output, expected }` and returns score/dimension data.
- By default, live judge failures fall back to the mock judge. Tell participants when this fallback happened before interpreting scores.
- Use this as a short instructor demo, then unset the variables before hands-on work.

Optional live app-provider demo:

- The runtime has a provider seam for live translation, mobile-search, and summary calls.
- A live provider must be registered by code and `WORKSHOP_LIVE_PROVIDER=registered` must be set before `WORKSHOP_MODE=live` can work.
- The shipped lab eval files intentionally pin mock variants. Do not ask participants to switch them to live during the core workshop.
- If you run a live demo, record the provider, prompt/model name, run time, threshold, and any retries. Treat live variance as a discussion point, not as the answer key.

## Dry-Run Checklist

One week before:

- Start from a fresh clone or clean working copy.
- Confirm runtime versions: Node `>=26.0.0`, pnpm `>=10.33.4`.
- Run `pnpm install --frozen-lockfile`.
- Run `pnpm run smoke`.
- Run `pnpm run data:summary`.
- Run `pnpm run data:check`.
- Run `pnpm run typecheck`.
- Run `pnpm run lab:all`.
- Run `pnpm run verify`.
- If Docker is part of the room setup, run `pnpm run docker:build` and `pnpm run docker:verify`.
- Verify checkpoint branches exist with `git branch -r --list 'origin/checkpoint/*'`.

Day before:

- Open the Evalite UI from `pnpm run eval:dev` and confirm the lab files load.
- Confirm `.evalite/results/` is writable.
- Make sure no long-running local server owns the ports you plan to use.
- Keep provider keys out of participant machines unless you are explicitly running a live demo.
- Prepare one terminal for instructor commands and one clean terminal for participant-paced commands.

Thirty minutes before:

- Run `pnpm run smoke` again.
- Run the first lab command, `pnpm run lab:01`, and confirm the expected failure details are visible.
- Run one later lab, such as `pnpm run lab:09`, so prompt-injection scoring is known-good.
- Confirm screen sharing shows scorer details and columns clearly.
- Keep a copy of this runbook open privately.

Before publishing materials:

- Search participant-facing files for checkpoint branch names.
- Search facilitator files for disallowed wording and identifying examples.
- Do not move these rescue procedures into README, setup, troubleshooting, or lab docs.
