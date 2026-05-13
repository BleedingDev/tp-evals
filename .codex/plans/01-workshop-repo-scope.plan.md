---
name: Workshop Repo Scope
overview: Define the repository boundaries, domain anonymization rules, TypeScript-only constraint, and the exact AI testing capabilities the workshop repository will cover.
todos:
  - id: scope-001
    content: Define the repository mission as a practical Evalite workshop for QA testers focused only on AI output evaluation.
    status: completed
  - id: scope-002
    content: Lock the implementation stack to strict TypeScript and reject non-TypeScript lab implementations.
    status: completed
  - id: scope-003
    content: Define the three anonymized capability areas: translations, mobile search intent extraction, and travel information summary.
    status: completed
  - id: scope-004
    content: Define the no-sensitive-data policy for examples, fixtures, prompts, generated outputs, and documentation.
    status: completed
  - id: scope-005
    content: Define the participant skill level assumptions so labs require running commands and editing small datasets, not application programming.
    status: completed
isProject: false
---

# Workshop Repo Scope

## Execution Notes

This plan establishes what the repository is and what it is not. The repository is a practical eval lab for testers. It must not become a general AI demo app, a vendor comparison project, or a broad training repo.

The repo should contain only anonymized scenarios that map to the customer's stated AI usage categories without naming the customer, internal systems, private endpoints, real people, real production identifiers, or confidential business data.

The three capability areas are:

- AI-assisted translation of text entries.
- Mobile AI search that turns a user text query into structured search intent.
- Travel information summary shown in a booking-like detail context.

The repository mission is to teach testers how to build, run, inspect, and evolve LLM evals. It is not a product prototype. Each lab must make one practical testing idea visible through Evalite results: dataset quality, deterministic guardrails, structured output, prompt or model comparison, summary quality, judge calibration, prompt injection, or consistency regression.

The participant interaction model is intentionally constrained. Participants should run prepared commands, inspect Evalite UI output, and make small changes to JSONL records, expected values, prompt variants, thresholds, or scorer parameters. They should not need to design application architecture or write large TypeScript features during the workshop.

## Constraints

- Use strict TypeScript for all source code, scripts, Evalite files, and typed fixtures.
- Do not introduce Python, notebooks, non-TypeScript app code, or shell-heavy lab logic.
- Do not include customer names, domains, emails, endpoints, screenshots, production data, or proprietary workflow names.
- Do not add unrelated workshop topics such as meeting transcription, general QA automation agents, browser automation, or second-brain process automation.
- Keep all lab examples suitable for sharing with external participants.

## Operator Guidance

Use this plan as the top-level guardrail when reviewing later implementation plans. If a proposed file, dataset, or exercise cannot be explained as one of the three anonymized capability areas above, it is likely out of scope.

Treat the following as explicit non-goals for this repository: meeting transcription, browser automation, second-brain workflows, internal product training, production integration, or any broad AI adoption content outside evals.
