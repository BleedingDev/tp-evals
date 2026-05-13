---
name: Domain Fixtures And Datasets
overview: Design anonymized JSONL datasets and validation schemas for translation, mobile search, summary, prompt injection, and consistency labs.
todos:
  - id: data-001
    content: Define shared dataset metadata fields for source, capability, risk, labels, expected behavior, and anonymization status.
    status: completed
  - id: data-002
    content: Create JSONL schema and loader utilities for typed dataset records.
    status: completed
  - id: data-003
    content: Prepare translation datasets covering basic quality, placeholders, tags, product-like codes, and terminology consistency.
    status: completed
  - id: data-004
    content: Prepare mobile search datasets covering single-turn intent extraction, ambiguous inputs, missing fields, and conversation history.
    status: completed
  - id: data-005
    content: Prepare travel information summary datasets covering required facts, unsupported claims, warnings, and insufficient source text.
    status: completed
  - id: data-006
    content: Prepare prompt injection and consistency datasets using anonymized, shareable attack and paraphrase examples.
    status: completed
  - id: data-007
    content: Add dataset quality fixtures that intentionally contain fixable issues for the first lab.
    status: completed
isProject: false
---

# Domain Fixtures And Datasets

## Execution Notes

Datasets are the core workshop artifact. Participants should see that eval quality depends more on good cases and clear expectations than on clever code.

Use JSONL because it maps well to production logs, can grow incrementally, and is easy for testers to inspect in small chunks. Each record should be small enough to understand without application context.

Recommended dataset files:

- `data/evals/translations-basic.jsonl`
- `data/evals/translations-edge-cases.jsonl`
- `data/evals/mobile-search-intents.jsonl`
- `data/evals/mobile-search-conversation.jsonl`
- `data/evals/travel-info-summary.jsonl`
- `data/evals/prompt-injection.jsonl`
- `data/evals/consistency.jsonl`
- `data/evals/dataset-quality-broken.jsonl`

## Constraints

- Keep examples fictional and anonymized.
- Store expected behavior explicitly; do not require participants to infer hidden evaluation criteria.
- Keep broken fixtures intentionally educational, not confusing.
- Avoid large datasets. The goal is workshop clarity, not benchmark size.
- Do not include any customer-specific names, routes, private codes, real contact details, or production artifacts.

## Operator Guidance

Each dataset should contain a mix of passing, failing, and borderline cases. Borderline cases are important because they force discussion about whether a scorer, expectation, or product rule is underspecified.
