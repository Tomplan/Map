#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   GITHUB_REPO=owner/repo ./scripts/setup-branch-protection.sh
# The script requires GitHub CLI (gh) authenticated and will apply branch protection
# rules for 'main' (production) and 'development' (working branch) by default.

REPO=${GITHUB_REPO:-}
if [[ -z "$REPO" ]]; then
  # try using gh to discover the current repository
  if command -v gh >/dev/null 2>&1; then
    REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner) || true
  fi
fi

if [[ -z "$REPO" ]]; then
  echo "ERROR: Could not determine repository. Set GITHUB_REPO=owner/repo or run in a cloned repo with 'gh' configured."
  exit 1
fi

echo "Configuring branch protection for $REPO"

MAIN_CHECKS=("CI" "CI — Node tests" "CI — Scripts unit tests")
DEV_CHECKS=("CI" "CI — Node tests")

set_protection() {
  local branch=$1
  shift
  local checks=($@)

  # build JSON array for contexts
  local contexts_json
  contexts_json=$(printf '%s\n' "${checks[@]}" | jq -R . | jq -s .)

  payload=$(jq -n --argjson contexts "$contexts_json" '{required_status_checks: {strict: true, contexts: $contexts}, enforce_admins: true, required_pull_request_reviews: {required_approving_review_count: 1}}')

  echo "Applying protection to branch: $branch"
  gh api -X PUT "/repos/$REPO/branches/$branch/protection" -f protection=@- <<<"$payload" >/dev/null
  echo "OK: protection applied to $branch"
}

# ensure jq and gh available
if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: this script requires 'jq' to build JSON payloads. Install it (brew install jq) and try again."
  exit 1
fi
if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: this script requires GitHub CLI (gh) to be installed and authenticated. See https://cli.github.com/."
  exit 1
fi

# main protection
set_protection main "${MAIN_CHECKS[@]}"

# development protection (slightly more permissive — still require PR reviews & CI checks)
set_protection development "${DEV_CHECKS[@]}"

echo "Done — branch protection configured.
Notes:
 - You can adjust the list of checks inside the script if your workflow uses different job names.
 - To allow additional reviewers / rules, modify the 'required_pull_request_reviews' payload.
 - This script requires your gh CLI account to have admin permissions on the repository."
