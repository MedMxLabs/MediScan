#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
npm ci
npm run lint
npm run build
echo "Production build ready in dist/"
