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

MAIN_CHECKS=("build" "Run tests" "Run scripts unit tests")
DEV_CHECKS=("build" "Run tests")

set_protection() {
  local branch=$1
  shift
  local checks=($@)

  # build JSON array for contexts
  local contexts_json
  contexts_json=$(printf '%s\n' "${checks[@]}" | jq -R . | jq -s .)

  # Build full protection payload. GitHub requires these top-level keys to be present
  payload=$(jq -n --argjson contexts "$contexts_json" '{required_status_checks: {strict: true, contexts: $contexts}, enforce_admins: true, required_pull_request_reviews: {dismiss_stale_reviews: false, require_code_owner_reviews: false, required_approving_review_count: 1}, restrictions: null}')

  echo "Applying protection to branch: $branch"

  # Use gh to fetch an auth token (if available) or rely on GITHUB_TOKEN env var.
  GH_TOKEN=${GITHUB_TOKEN:-$(gh auth token 2>/dev/null || true)}
  if [[ -z "$GH_TOKEN" ]]; then
    echo "ERROR: No GitHub token available. Export GITHUB_TOKEN or run 'gh auth login' first." >&2
    return 1
  fi

  # Use curl to PUT the protection payload with proper JSON content-type; gh api has trouble when nested JSON is provided via -f
  resp=$(curl -sS -w "\n%{http_code}" -X PUT "https://api.github.com/repos/$REPO/branches/$branch/protection" \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer $GH_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload")

  body=$(printf "%s" "$resp" | sed -n '1,$ p' | sed '$d')
  code=$(printf "%s" "$resp" | tail -n1)

  if [[ "$code" =~ ^2 ]]; then
    echo "OK: protection applied to $branch"
  else
    # If required status checks already exist we may get a 422 for attempted create — treat as success
    if [[ "$code" == "422" && "$body" == *"already_exists"* ]]; then
      echo "NOTE: some protection items already exist for $branch; skipping (HTTP 422 already_exists)"
      return 0
    fi

    echo "ERROR applying protection to $branch (HTTP $code):" >&2
    echo "$body" >&2
    return 1
  fi
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
