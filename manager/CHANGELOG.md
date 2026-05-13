# Changelog

## [0.2.0] - 2026-05-13

The personas plugin becomes a pure host. The four personas (steve-jobs, taylor-otwell, raymond-hettinger, david-tolnay) ship as their own plugin entries through the by-mischa marketplace, each declaring `persona.json` at their plugin root. Enabling a persona auto-registers it as a parley peer when parley is installed.

**Added**

- `listPersonas()` scans `~/.claude/plugins/installed_plugins.json` for plugins declaring `persona.json` at their install root, and merges them into the registry alongside external personas.
- `PersonaMeta.source: 'plugin'` and `PersonaMeta.pluginRoot?: string`.
- `PERSONA_ENTRY_FILE` returned from `begin_turn` and `get_thread_context`: defaults to `persona.md` for external personas, `CLAUDE.md` for plugin personas. The dispatcher reads `<PERSONA_PATH>/<PERSONA_ENTRY_FILE>` instead of hard-coded `persona.md`.
- Parley sync: enabling a persona writes a peer entry to `~/.claude/parley/peers.json` with `type: "persona"`. Disabling removes the entry. Silently no-ops when parley isn't installed. User-managed entries (no `type` field, or a different value) are left alone with a stderr advisory; personas-plugin won't clobber them.

**Changed**

- The four personas move from bundled-in-plugin to standalone plugin entries under the by-mischa marketplace. Install separately: `steve-jobs@by-mischa`, `taylor-otwell@by-mischa`, `raymond-hettinger@by-mischa`, `david-tolnay@by-mischa`.
- `PersonaMeta.source` union: `'bundled' | 'external'` → `'external' | 'plugin'`.
- `personas_remove` refuses plugin-installed personas (uninstall via `/plugin uninstall` instead).
- Conflict resolution in `listPersonas()`: a plugin-installed persona shadows external personas with the same `name` or any matching `alias`. Precedence: plugin > external.
- `peers.json` writes go through a cross-plugin lock at `${peersFile}.lock` to serialise with parley's own writers.

**Requires**

- parley v0.3.0 for `PeerConfig.type` support.

## [0.1.1] - 2026-05-09

- Ship the compiled `dist/server.js` so the MCP server runs immediately after install without a manual `bun install && bun run build` step.

## [0.1.0] - 2026-05-09

- Initial release.
- Bundled personas: steve-jobs, taylor-otwell, raymond-hettinger, david-tolnay (all ship disabled by default).
