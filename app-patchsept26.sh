#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Verifying environment.ts points to the local backend..."
if grep -q "node-js.justdo-it.uk\|node\.justdo-it\.uk" src/environments/environment.ts; then
  echo "!! environment.ts still references the old domain. Aborting - fix source first."
  grep -n "justdo-it.uk" src/environments/environment.ts
  exit 1
fi
echo "OK: environment.ts uses $(grep apiUrl: src/environments/environment.ts | head -1)"

echo "==> Cleaning node_modules and reinstalling (clears any cached build artifacts)..."
rm -rf node_modules
npm ci

echo "==> Rebuilding Angular production bundle (this regenerates public/*.js with the current environment.ts)..."
npm run build -- --configuration production

echo "==> Rebuilding and restarting the sweety-app container (the one nginx actually serves)..."
docker-compose build sweety-app
docker-compose up -d --force-recreate sweety-app

echo "==> Restarting the dev container too, in case it's also stale..."
docker-compose restart sweety-app-dev || true

echo "==> Verifying the new bundle no longer contains the old domain..."
if grep -rl "justdo-it.uk" public/*.js 2>/dev/null; then
  echo "!! WARNING: old domain still found in rebuilt bundle above. Check environment.ts / build config."
  exit 1
else
  echo "OK: no references to the old domain in the rebuilt bundle."
fi

echo "Done. Hard-refresh the browser (Cmd/Ctrl+Shift+R) to bypass any cached JS."
