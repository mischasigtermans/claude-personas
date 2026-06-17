# Changelog

## [0.4.0] - 2026-06-17

Personas inherit parley's new durable memory. After a consultation, `/parley remember <persona>` distils it into bullets that prime every future ask. Memory lives entirely in parley (v0.4.0+); personas just declares the per-persona preference.

**Added**

- **`memory` field in `persona.json`.** Optional boolean. Set `false` to opt a persona out of parley's durable memory; omit to keep it on (parley's default). Read into `PersonaMeta.memory` and carried onto the persona's entries in the extensions manifest, so parley resolves it like any peer's declared flag. Bundled personas leave it unset (memory on).

**Changed**

- Manifest version bumped to `0.4.0`; `memory` is emitted on manifest entries only when explicitly declared.

## [0.3.0] - 2026-05-19

Personas migrates onto parley's extensions seam. The plugin no longer imports parley TypeScript source and no longer writes `~/.claude/parley/peers.json`. Enabled personas live in a manifest under `~/.claude/parley/extensions/personas.json`; parley merges them into its peer registry.

**Breaking**

- Removed direct imports from `claude-parley/src/`. Personas now talks to parley through a filesystem-level contract only.
- `~/.claude/parley/peers.json` is no longer mutated by personas. Stale `type: "persona"` entries from v0.2.0 stay where they are; `parley_remove` them manually.

**Added**

- `manager/src/state/manifest.ts` writes `~/.claude/parley/extensions/personas.json` atomically (write tmp + rename). Each enabled persona becomes one entry per declared alias (canonical name + aliases), all pointing at the persona's plugin path. `parley_ask peer=<any-alias>` resolves.
- Manifest entries carry the persona's `model`, `mcpServers`, and `skipPermissions: true` from `persona.json`, so the headless spawn matches the persona's intended runtime (e.g. Steve runs on opus). Requires parley ≥ 0.3.0, which now reads these fields off extension peers.

**Changed**

- `enable`/`disable`/`list`/`resolve` now read and mutate the extensions manifest.
- `parley-sync.ts` removed. The cross-plugin lock is gone; personas owns its manifest file exclusively.

**Removed**

- The in-session thread/memory state machine: `begin_turn`, `commit_turn`, `close_thread`, `reopen_thread`, `get_thread_context`, `threads`, plus `threads.ts`, `memory.ts`, `project.ts`, `config.ts`, the SessionEnd notify hook, and `notify-open-threads.sh`. Continuity is now parley's session pointer; the conversation runs entirely through `parley_ask`.
- The `persona` dispatcher subagent (`agents/persona.md`) and the dead `PersonaMeta.entryFile` field. The persona's voice loads from its own `CLAUDE.md` when parley spawns it; no manager-controlled prompt builds it anymore.

**Fixed**

- Stale-alias purge on persona path change (e.g. plugin version bump from `cache/by-mischa/steve-jobs/0.1.0` to `0.2.0`). `upsertPersona` now drops entries by path OR alias match, so old-path rows don't linger.
- Latent path bug: previous code read `~/.parley/peers.json` (legacy path); the new manifest lives at `~/.claude/parley/extensions/personas.json`, matching parley's actual default.
- Per-persona `model` and `mcpServers` no longer silently dropped. The earlier extension-manifest cut wrote only alias/path/description/type, so personas lost their opus model and MCP servers on the headless path; both now carry through.

**Requires**

- parley v0.3.0 for the extensions manifest contract.

**Known assumptions**

- Single-user. The enable/disable read-modify-write on the manifest is not lock-guarded. Two concurrent enables can lose one write. Acceptable for v0.3.0.

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
