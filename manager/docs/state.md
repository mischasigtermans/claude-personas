# State: the registry and what parley owns

The Personas plugin holds almost no state of its own. It owns one file: the parley extensions manifest listing the enabled personas. Everything about a conversation (sessions, continuity, transcripts) lives in parley.

## What personas owns

```
~/.claude/parley/extensions/personas.json     the enabled set
```

One entry per persona alias (canonical name plus each declared alias), all pointing at the persona's plugin directory. Parley scans `~/.claude/parley/extensions/*.json` and merges these into its peer registry. Each entry carries the persona's `model`, `mcpServers`, and `skipPermissions: true` so the headless spawn matches the persona's intended runtime.

`enable` writes the entries. `disable` removes them. When the last persona is disabled the file is deleted, so parley shows no empty extension.

External personas (added via `/personas add`) live under `~/.claude/personas/external/<name>/`. That directory holds the persona definition only, not conversation state.

## What parley owns

Continuity and transcripts are parley's, scoped per (calling project, persona):

```
~/.claude/parley/headless/<project_id>/<persona>.json    cached Claude session pointer
~/.claude/parley/logs/<project_id>/<persona>.md          append-only transcript
```

## Project ID

Parley derives a stable `project_id` for every calling project:

- SHA1 of the git remote URL when available. First 12 hex chars.
- Falls back to a SHA1 of the absolute CWD when no remote is set.

Worktrees and clones of the same repo share the same `project_id`, so a persona's session is the same across them. The personas plugin uses the identical algorithm, so both sides compute matching IDs from the same CWD.

## Continuity

There is no thread or memory file. Continuity is the cached Claude session: the first ask spawns a fresh session, each follow-up resumes it via `claude --resume`, so the persona remembers the prior turns within that project. To start over, `/parley reset <persona>` clears the pointer for the calling project; the next ask spawns a new session.

## Lifecycle

Disabling a persona removes it from the manifest but leaves any cached parley session in place. Re-enabling makes it reachable again, resuming the same session. Uninstalling the persona plugin removes the definition; the cached session is keyed by alias, so reinstalling the same persona picks up where it left off until parley's auto-clean prunes a stale pointer.
