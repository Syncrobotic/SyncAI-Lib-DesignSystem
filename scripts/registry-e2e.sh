#!/usr/bin/env bash
# Installs every registry item into a fresh Next.js app with the shadcn CLI, then typechecks and builds it.
# Catches what unit tests cannot: wrong import rewrites, missing dependencies, server/client boundary mistakes.
# Expects public/r from `npm run registry:build`.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'kill $SERVER 2>/dev/null || true; rm -rf "$WORK"' EXIT

# Served by the repo's own http-server, waited on until it answers (not a fixed sleep), so the CLI never starts against
# a server that is not up yet.
"$ROOT/node_modules/.bin/http-server" "$ROOT/public" -p 4321 -a 127.0.0.1 -s &
SERVER=$!
for _ in $(seq 1 50); do curl -sf -o /dev/null http://127.0.0.1:4321/r/registry.json && break; sleep 0.2; done

cp -r "$ROOT/tests/registry-e2e/." "$WORK/"
cd "$WORK"
npm install --no-audit --no-fund --loglevel=error
ITEMS=$(node -e "console.log(require('$ROOT/registry.json').items.map(i => '@syncrobotic/' + i.name).join(' '))")
# shellcheck disable=SC2086
# The CLI the registry is built with (package.json), not whatever shadcn@3 is on npm today.
"$ROOT/node_modules/.bin/shadcn" add $ITEMS --yes --overwrite
npx tsc --noEmit -p .
NEXT_TELEMETRY_DISABLED=1 npx next build
echo "Registry e2e passed: $(echo $ITEMS | wc -w) items installed, typechecked and built"
