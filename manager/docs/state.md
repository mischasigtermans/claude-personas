# State: the registry and what parley owns

The Personas plugin holds almost no state of its own. It owns one file: the parley extensions manifest listing the enabled personas. Everything about a conversation (threads, transcripts, memory) lives in parley.

## What personas owns

```
~/.claude/parley/extensions/personas.json     the enabled set
```

One entry per persona alias (canonical name plus each declared alias), all pointing at the persona's plugin directory. Parley scans `~/.claude/parley/extensions/*.json` and merges these into its peer registry. Each entry carries the persona's `model`, `mcpServers`, and `skipPermissions: true` so the headless spawn matches the persona's intended runtime.

`enable` writes the entries. `disable` removes them. When the last persona is disabled the file is deleted, so parley shows no empty extension.

External personas (added via `/personas add`) live under `~/.claude/personas/external/<name>/`. That directory holds the persona definition only, not conversation state.

## What parley owns

Threads and transcripts are parley's, scoped per (calling project, persona):

```
~/.claude/parley/headless/<project_id>/<persona>/<thread>.json    one thread
~/.claude/parley/headless/<project_id>/<persona>.json             turn count
~/.claude/parley/logs/<project_id>/<persona>.md                   append-only transcript
```

## Project ID

Parley derives a stable `project_id` for every calling project:

- SHA1 of the git remote URL when available. First 12 hex chars.
- Falls back to a SHA1 of the absolute CWD when no remote is set.

Worktrees and clones of the same repo share the same `project_id`, so a persona's threads are the same across them. The personas plugin uses the identical algorithm, so both sides compute matching IDs from the same CWD.

## Continuity

Personas keeps no thread or memory file. Every ask without a `thread` spawns a fresh session. A headless answer's first line names its thread, `[<alias> · thread <id>]`, and an ask that passes that id as `thread` resumes it via `claude --resume`, so the persona remembers that thread's earlier turns. What carries across fresh conversations is parley's durable memory, distilled with `/parley remember <persona>`.

## Lifecycle

Disabling a persona removes it from the manifest, so parley's next sweep removes its threads. Its transcript and memory stay. Re-enabling makes it reachable again with the same memory. Uninstalling the persona plugin removes the definition; memory is keyed by alias, so reinstalling the same persona picks it up again.
