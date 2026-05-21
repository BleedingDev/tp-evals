# Troubleshooting

## Install Issues

Check tool versions first:

```sh
node --version
pnpm --version
```

This repo expects Node `26.0.0` or newer and pnpm `10.33.4` or newer. If install fails after changing tool versions, reinstall from the lockfile:

```sh
pnpm install --frozen-lockfile
```

If Mise refuses to run because the config is not trusted, approve the local repository config and retry:

```sh
mise trust
mise run start
```

If native dependencies fail to build, make sure your local machine has normal build tooling installed. Docker is the fastest fallback:

```sh
docker compose build lab
docker compose run --rm lab pnpm run start
```

## Docker Issues

If Docker cannot find the `lab` service, run commands from the repository root where `compose.yaml` lives.

If dependencies inside Docker look stale, rebuild the image and recreate the dependency volume:

```sh
docker compose down --volumes
docker compose build lab
docker compose run --rm lab pnpm run start
```

## Evalite UI Does Not Open

Start the UI:

```sh
pnpm run eval:dev
```

Then open `http://localhost:3006`.

If the terminal exits, read the first error in the output. Common causes are missing dependencies, a port conflict, or a TypeScript error in a file you just edited.

## Port Conflicts

The Evalite UI defaults to port `3006`. Use another port for the current UI command:

```sh
EVALITE_PORT=3016 pnpm run eval:dev
```

Then open `http://localhost:3016`.

Lab commands pick their own ports so several labs can run without colliding. If a lab still needs a manual override, set `EVALITE_LAB_PORT`:

```sh
EVALITE_LAB_PORT=3116 pnpm run lab:04
```

## Live API Key

The workshop expects live AI proxy calls by default. Check `.env` first:

```sh
WORKSHOP_MODE=live
LIVE_LLM_ENABLED=true
AI_PROXY_BASE_URL=https://ai-proxy-zane.web-revolution.cz
AI_PROXY_MODEL=gpt-5.2-codex
AI_PROXY_JUDGE_MODEL=gpt-5.2-codex
AI_PROXY_FALLBACK_MODELS=gpt-5.4-mini,gemini-3-flash-preview,claude-haiku-4.5,gpt-5.3-codex
AI_PROXY_API_KEY=...
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free
OPENROUTER_JUDGE_MODEL=nvidia/nemotron-3-super-120b-a12b:free
OPENROUTER_FALLBACK_MODELS=poolside/laguna-m.1:free,openai/gpt-oss-120b:free,openrouter/owl-alpha
OPENROUTER_API_KEY=...
```

Then run:

```sh
pnpm run smoke
pnpm run live:check
```

If the live provider returns `401`, the key loaded by the process is invalid or not the same key you expected. The repo `.env` is loaded by the workshop commands and the key is not printed. Do not paste the key into issue comments, chat transcripts, slides, or lab handouts.

If the AI proxy times out or reports an incomplete response, the API key is usually loaded correctly but the selected upstream model did not finish within the token/time budget. Keep `AI_PROXY_FALLBACK_MODELS` present so the live check can retry through concrete Copilot-backed models.

For stale Docker dependencies after pulling repository updates, run:

```sh
docker compose down -v
docker compose run --rm lab pnpm run live:check
```

## Missing Files

If a command reports `Integration dependency missing`, verify that you are in the repository root:

```sh
pwd
ls package.json evalite.config.ts data/evals evals
```

If a JSONL dataset error names a line, open that file and inspect the exact line. Dataset rows are one JSON object per line, so blank lines or multi-line JSON objects will fail validation.

Run the dataset check after edits:

```sh
pnpm run data:check
```

## Lab Result Looks Unexpected

Open the matching handout in `docs/labs`, then inspect only the lab file and dataset it names. Keep the investigation inside the current lab scope and focus on:

- The `task` function that produces output.
- The `scorers` array that decides pass or fail.
- The dataset row's `expected` object.
- Any `caseType` value marked `passing`, `borderline`, or `failing`.

Re-run only the lab you changed:

```sh
pnpm run lab:01
```

If you changed dataset rows, also run:

```sh
pnpm run data:check
```
