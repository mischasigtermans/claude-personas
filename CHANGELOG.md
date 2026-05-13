# Changelog

## [0.2.0] - 2026-05-13

Restructured into a library repo. The Personas manager moves to `manager/`. Four personas migrate from their standalone repos (steve-says, taylor-says, raymond-says, david-says) into `personas/<canonical-name>/`. Each persona becomes an independent plugin installable through the by-mischa marketplace.

**Breaking**

- The standalone *-says repos are archived. Install through `mischasigtermans/by-mischa` instead.
- Personas manager and each persona are now separate plugin installs. The manager no longer bundles personas inside itself.

**Added**

- `personas/<name>/.claude-plugin/plugin.json` for steve-jobs, taylor-otwell, raymond-hettinger, david-tolnay. Each at version 0.1.0.
- Repo-level CHANGELOG (this file) and README (the index).

**Changed**

- The Personas manager (formerly the whole repo) lives in `manager/`. Its CHANGELOG and README moved with it.
- Each `persona.json` drops its `mcpServers` block. The manager handles parley peer registration via hooks.
- Steve's CLAUDE.md drops dead `@context/steve/...` references. The manager dispatcher loads `context/*.md` via Glob.
- Taylor, Raymond, David lose their nested `context/<name>/` duplicates.
- Taylor's CLAUDE.md drops the `<!-- PARENT: -->` directive.

**Migration**

State under `~/.claude/personas/state/` carries over by canonical name. A thread you had with `steve-jobs` (when bundled in the old manager) continues uninterrupted under the new `steve-jobs` plugin discovered via the marketplace.
