#!/usr/bin/env bash
set -euo pipefail

if [ ! -x node_modules/.bin/tsx ]; then
  pnpm install --frozen-lockfile
fi

exec "$@"
