#!/usr/bin/env bash
set -euo pipefail

CI=true pnpm install --frozen-lockfile

exec "$@"
