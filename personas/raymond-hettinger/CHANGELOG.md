# Changelog

## [0.1.2] - 2026-09-25

- Fix: `CLAUDE.md` imports the `context/` files (voice, quotes, personality, anti-patterns). The 0.1.0 migration dropped these imports, so a spawned persona loaded `CLAUDE.md` alone. `manager/tests/persona-context.test.ts` fails when a context file goes unimported.

## [0.1.1] - 2026-06-17

- Docs: README now describes durable memory correctly. Memory is a Parley feature (≥ 0.4.0); distil a conversation with `/parley remember raymond`. The old per-persona thread/`memory.md` machine was dropped in personas 0.3.0.

## [0.1.0] - 2026-05-13

- Initial release as part of the [Claude Personas](https://github.com/mischasigtermans/claude-personas) library.
- Migrated from the standalone `raymond-says` repo into the persona-plugin format.
- Auto-discovered by the Personas manager via `persona.json` at the plugin root.
- Dropped: `mcpServers` block from `persona.json`, nested `context/raymond/` duplicates, the standalone `BENCHMARK.md`.
