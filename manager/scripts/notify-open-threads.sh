#!/usr/bin/env bash
# Print a one-liner to stderr if the current project has any open persona threads.
# Runs on SessionStart; output appears in the Claude Code session start banner.
set -euo pipefail

state_root="${HOME}/.claude/personas/state"
[ -d "$state_root" ] || exit 0

git_remote="$(git config --get remote.origin.url 2>/dev/null || true)"
if [ -n "${git_remote}" ]; then
  project_id="$(printf '%s' "$git_remote" | shasum -a 1 | cut -c1-12)"
else
  project_id="$(printf '%s' "$PWD" | shasum -a 1 | cut -c1-12)"
fi

project_dir="${state_root}/${project_id}"
[ -d "$project_dir" ] || exit 0

open=()
for d in "$project_dir"/*/; do
  [ -d "$d" ] || continue
  if [ -f "${d}open-thread.json" ]; then
    open+=("$(basename "$d")")
  fi
done

if [ "${#open[@]}" -gt 0 ]; then
  IFS=', '
  echo "[claude-personas] ${#open[@]} open thread(s): ${open[*]}. /persona threads to view." >&2
fi
