#!/usr/bin/env bash
# Point this repo at .githooks/ so pre-push allowlist runs on every push.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

chmod +x .githooks/pre-push
git config core.hooksPath .githooks

echo "Installed git hooks from .githooks/ (core.hooksPath=.githooks)"
echo "Allowed pushers: scripts/git/allowed-pushers.txt"
