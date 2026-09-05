#!/usr/bin/env bash
set -euo pipefail
node scripts/runtime/preflight.mjs
npm run check
