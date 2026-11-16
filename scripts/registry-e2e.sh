#!/usr/bin/env bash
# Installs every registry item into a fresh Next.js app with the shadcn CLI, then typechecks and builds it.
# Catches what unit tests cannot: wrong import rewrites, missing dependencies, server/client boundary mistakes.
# Expects public/r from `npm run registry:build`.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'kill $SERVER 2>/dev/null || true; rm -rf "$WORK"' EXIT

(cd "$ROOT/public" && python3 -m http.server 4321 --bind 127.0.0.1 >/dev/null 2>&1) &
SERVER=$!
sleep 1

cp -r "$ROOT/tests/registry-e2e/." "$WORK/"
cd "$WORK"
npm install --no-audit --no-fund --loglevel=error
ITEMS=$(node -e "console.log(require('$ROOT/registry.json').items.map(i => '@syncrobotic/' + i.name).join(' '))")
# shellcheck disable=SC2086
npx --yes shadcn@3 add $ITEMS --yes --overwrite
npx tsc --noEmit -p .
NEXT_TELEMETRY_DISABLED=1 npx next build
echo "Registry e2e passed: $(echo $ITEMS | wc -w) items installed, typechecked and built"
