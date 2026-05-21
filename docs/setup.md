# Setup

Use one path. The workshop defaults to live OpenRouter calls, so each machine needs a local `.env` with `OPENROUTER_API_KEY`. Keep the file local and do not share, print, or commit the key.

## Option 1: Mise

Mise reads `mise.toml`, installs Node `26.0.0` and pnpm `10.33.4`, and exposes workshop tasks.

```sh
mise trust
mise install
mise run setup
mise run start
mise run live:check
```

`mise trust` is required the first time because Mise will not run tasks from a new repository until you approve its local config.

Run labs through Mise or pnpm:

```sh
mise run lab:01
pnpm run lab:01
```

## Option 2: Proto

Proto reads `.prototools` and installs the same tool versions.

```sh
proto install
pnpm install --frozen-lockfile
pnpm run start
pnpm run live:check
```

If your shell cannot find `pnpm` after `proto install`, restart the terminal or run the shell initialization command printed by Proto.

## Option 3: Direct Node And pnpm

Use this path if you already manage Node locally.

```sh
node --version
corepack enable
corepack prepare pnpm@10.33.4 --activate
pnpm --version
pnpm install --frozen-lockfile
pnpm run start
pnpm run live:check
```

Expected versions:

- `node --version` should be `v26.0.0` or newer.
- `pnpm --version` should be `10.33.4` or newer.

## Option 4: Docker

Docker is the fallback path when local tool installation is blocked.

```sh
docker compose build lab
docker compose run --rm lab pnpm run start
docker compose run --rm lab pnpm run live:check
```

Run one lab in Docker:

```sh
docker compose run --rm lab pnpm run lab:01
```

Open an interactive shell:

```sh
docker compose run --rm lab zsh
```

Docker mounts the repository into `/workspace` and keeps dependencies in a named volume.

## Environment Defaults

The default environment is equivalent to `.env.example`. It is tuned for live QA exercises with OpenRouter and Evalite result persistence under `.evalite/`.

```sh
WORKSHOP_MODE=live
EVALITE_DB_PATH=.evalite/evalite.db
EVALITE_RESULT_PATH=.evalite/results/latest.json
EVALITE_PORT=3006
EVALITE_SCORE_THRESHOLD=60
EVALITE_MAX_CONCURRENCY=4
EVALITE_TEST_TIMEOUT_MS=90000
EVALITE_TRIAL_COUNT=1
EVALITE_CACHE=true
EVALITE_HIDE_TABLE=false
LIVE_LLM_ENABLED=true
OPENROUTER_MODEL=openrouter/owl-alpha
OPENROUTER_JUDGE_MODEL=openrouter/owl-alpha
OPENROUTER_FALLBACK_MODELS=openai/gpt-oss-120b:free,openrouter/free,openai/gpt-oss-20b:free
OPENROUTER_TIMEOUT_MS=60000
OPENROUTER_API_KEY=...
```

Do not commit `.env`. The smoke command confirms mode and model without printing the key. Run the live check before lab work that depends on model calls:

```sh
pnpm run live:check
```

For narrow workshop edits, prefer the smallest useful gate: `pnpm run data:check` after dataset edits, the relevant `pnpm run lab:NN` after lab edits, and `pnpm run verify` before broad workshop changes are considered ready.
