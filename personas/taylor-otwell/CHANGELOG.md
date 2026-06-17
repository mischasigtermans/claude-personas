# Changelog

## [0.1.1] - 2026-06-17

- Docs: README now describes durable memory correctly. Memory is a Parley feature (≥ 0.4.0); distil a conversation with `/parley remember taylor`. The old per-persona thread/`memory.md` machine was dropped in personas 0.3.0.

## [0.1.0] - 2026-05-13

- Initial release as part of the [Claude Personas](https://github.com/mischasigtermans/claude-personas) library.
- Migrated from the standalone `taylor-says` repo into the persona-plugin format.
- Auto-discovered by the Personas manager via `persona.json` at the plugin root.
- Dropped: `mcpServers` block from `persona.json`, nested `context/taylor/` duplicates, the `<!-- PARENT: -->` directive at the end of `CLAUDE.md`, the standalone `BENCHMARK.md`.
