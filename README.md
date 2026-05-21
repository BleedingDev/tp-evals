# Evalite QA Workshop

This repository is a hands-on QA workshop for evaluating AI application behavior with live AI proxy calls, synthetic datasets, and visible scoring evidence.

You will inspect test data, run one lab at a time, compare passing, borderline, and failing cases, make small edits to expectations, thresholds, labels, or prompts, and use a coding agent to author a new synthetic eval case. Keep work inside the current lab scope and use only synthetic workshop data.

## Prerequisites

- Node.js `26.0.0`
- pnpm `10.33.4`
- One setup path from [docs/setup.md](docs/setup.md): Mise, Proto, direct pnpm, or Docker
- A terminal in the repository root
- `AI_PROXY_API_KEY` in a local `.env`

The default workshop mode is live AI proxy using `gpt-5.2-codex`.

## First Commands

With Mise:

```sh
mise trust
mise install
mise run setup
mise run start
```

With pnpm already available:

```sh
pnpm install --frozen-lockfile
pnpm run start
```

The start command runs a smoke check and prints a dataset summary. Before the first lab, verify the live model path:

```sh
pnpm run live:check
```

When that passes, run a lab:

```sh
pnpm run lab:01
```

To open Evalite in watch mode:

```sh
pnpm run eval:dev
```

Then open `http://localhost:3006`.

## Presentation

The workshop deck lives in the shared presentations repository:

```text
BleedingDev/presentations/apps/tp-evals
```

Keep this repository focused on labs, datasets, evals, and checkpoint branches.

## Labs

Each lab has a short participant handout under `docs/labs`.

| Lab | Focus | Handout |
| --- | --- | --- |
| 01 | Dataset quality audit signals | [Lab 01](docs/labs/lab-01-dataset-quality.md) |
| 02 | Translation guardrails | [Lab 02](docs/labs/lab-02-translation-guardrails.md) |
| 03 | Translation quality judge | [Lab 03](docs/labs/lab-03-translation-quality.md) |
| 04 | Mobile search intent extraction | [Lab 04](docs/labs/lab-04-mobile-search-intent.md) |
| 05 | Mobile search conversation state | [Lab 05](docs/labs/lab-05-mobile-search-conversation.md) |
| 06 | Live prompt variants | [Lab 06](docs/labs/lab-06-prompt-model-variants.md) |
| 07 | Travel information summaries | [Lab 07](docs/labs/lab-07-travel-info-summary.md) |
| 08 | Judge calibration | [Lab 08](docs/labs/lab-08-judge-calibration.md) |
| 09 | Prompt injection handling | [Lab 09](docs/labs/lab-09-prompt-injection.md) |
| 10 | Consistency regression checks | [Lab 10](docs/labs/lab-10-consistency-regression.md) |
| 11 | Agentic eval authoring | [Lab 11](docs/labs/lab-11-agentic-eval-authoring.md) |

Useful commands:

```sh
pnpm run lab:all
pnpm run eval:all
pnpm run data:check
pnpm run verify
```

Use `pnpm run verify` as the full workshop gate. For narrow edits, run the matching lab command and `pnpm run data:check` when datasets change.

If setup or Evalite does not behave as expected, use [docs/troubleshooting.md](docs/troubleshooting.md).
