#!/usr/bin/env bash
# Apply GitHub branch protection so only the repo owner can push directly to main.
# Others must open PRs; you approve via CODEOWNERS review.
#
# Prerequisites: gh auth login, admin on aswin-shakthic/boutForge
set -euo pipefail

REPO="${1:-aswin-shakthic/boutForge}"
OWNER="${REPO%%/*}"

echo "Configuring branch protection on ${REPO} (branch: main)..."

gh api \
  -X PUT \
  "repos/${REPO}/branches/main/protection" \
  -f required_status_checks=null \
  -F enforce_admins=true \
  -F required_pull_request_reviews[dismiss_stale_reviews]=true \
  -F required_pull_request_reviews[require_code_owner_reviews]=true \
  -F required_pull_request_reviews[required_approving_review_count]=1 \
  -F restrictions[users][]="${OWNER}" \
  -F allow_force_pushes=false \
  -F allow_deletions=false \
  -F block_creations=false

echo "Done. Direct pushes to main are limited; PRs require your CODEOWNERS approval."
