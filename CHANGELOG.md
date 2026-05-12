# Changelog

## [0.2.0] - 2026-05-12

The personas plugin becomes a pure host: it no longer bundles personas. Each persona ships as its own Claude Code plugin (declaring `persona.json` at the plugin root). Enabling a persona auto-registers it as a parley peer when parley is installed.

### Breaking

- Bundled `steve-jobs`, `taylor-otwell`, `raymond-hettinger`, and `david-tolnay` are removed from this repo. To restore them, install the corresponding standalone plugins: `steve-says`, `taylor-says`, `raymond-says`, `david-says`. Each is a drop-in replacement using the persona-flagged plugin contract.
- Existing per-project state (`memory.md`, threads, `open-thread.json`) carries over by canonical persona name; no data loss as long as the replacement plugins keep the same `name` field in their `persona.json`.
- `PersonaMeta.source` union changed: `'bundled' | 'external'` → `'external' | 'plugin'`.
- `personas_remove` now refuses plugin-installed personas (uninstall via `/plugin uninstall` instead) rather than refusing bundled.

### Added

- `listPersonas()` scans `~/.claude/plugins/installed_plugins.json` for plugins declaring `persona.json` at their install root, and merges them into the registry alongside external personas.
- `PersonaMeta.source: 'plugin'` and `PersonaMeta.pluginRoot?: string`.
- `PERSONA_ENTRY_FILE` returned from `begin_turn` and `get_thread_context`: defaults to `persona.md` for external personas, `CLAUDE.md` for plugin personas. The dispatcher reads `<PERSONA_PATH>/<PERSONA_ENTRY_FILE>` instead of hard-coded `persona.md`.
- Parley sync: enabling a persona writes a peer entry to `~/.claude/parley/peers.json` with `type: "persona"`. Disabling removes the entry. Silently no-ops when parley isn't installed. User-managed entries (no `type` field, or a different value) are left alone with a stderr advisory; personas-plugin won't clobber them.

### Changed

- Conflict resolution in `listPersonas()`: a plugin-installed persona shadows external personas with the same `name` or any matching `alias`. Precedence: plugin > external.
- `peers.json` writes go through a cross-plugin lock at `${peersFile}.lock` to serialise with parley's own writers.

### Requires

- parley v0.3.0 for `PeerConfig.type` support. Older parley would strip the `type` field on the next `parley_add` to the same alias, breaking the sync invariant.

### Migration

State under `~/.claude/personas/state/` is untouched and reattaches to the matching plugin-installed persona by canonical `name`. A thread you had with bundled `steve-jobs` continues uninterrupted under `steve-jobs` discovered via `steve-says@local`.

## [0.1.1] - 2026-05-09

- Ship the compiled `dist/server.js` so the MCP server runs immediately after install without a manual `bun install && bun run build` step.

## [0.1.0] - 2026-05-09

- Initial release.
- Bundled personas: steve-jobs, taylor-otwell, raymond-hettinger, david-tolnay (all ship disabled by default).
