---
name: Capability Mocks
overview: Build small TypeScript mock AI capabilities that simulate translations, mobile search intent extraction, and travel information summary so all labs run without external API access.
todos:
  - id: mock-001
    content: Define shared capability input and output types for all app simulators.
    status: completed
  - id: mock-002
    content: Implement translation capability variants with baseline, flawed, and improved behavior.
    status: completed
  - id: mock-003
    content: Implement mobile search capability variants that return structured intent objects and follow-up questions.
    status: completed
  - id: mock-004
    content: Implement travel information summary capability variants that summarize only supplied text and expose controlled failure modes.
    status: completed
  - id: mock-005
    content: Add prompt and model variant registry so labs can compare behavior without changing eval files.
    status: completed
  - id: mock-006
    content: Add optional live provider seam guarded by env variables while keeping mock mode the default.
    status: completed
isProject: false
---

# Capability Mocks

## Execution Notes

The repository needs deterministic-enough mock capabilities because the workshop must run for everyone. These mocks are not product implementations. They are controlled systems under test that make eval concepts visible.

Each capability should expose known weaknesses so participants can see evals catch real-looking failures:

- Translation mock drops placeholders, changes tags, or adds explanations in specific cases.
- Mobile search mock invents missing fields or fails to ask follow-up questions in specific cases.
- Summary mock omits required warnings or adds unsupported claims in specific cases.

## Constraints

- Keep mocks small and readable.
- Keep all behavior in TypeScript modules under `src/apps/`.
- Do not hide important behavior behind complex frameworks.
- Do not require real LLM calls for core labs.
- Do not build a frontend or full backend app.

## Operator Guidance

Failure modes should be intentional and documented in facilitator notes, not in participant-facing lab answers. Participants should discover them through Evalite results.
