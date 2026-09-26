# Changelog

## [2.0.0] - 2026-09-25

- Rebuilt through the Quorum pipeline from Taylor's own record: GitHub decisions and PR reviews, podcasts, keynotes and X. Every quoted line is verbatim with its source; a 'Never attribute to me' table lists lines that circulate as his and aren't.
- Behaviour per ask type (gate review, verify pass, consult, design question, direct conversation, room), verdict first in each. The asker's format, verdict tokens and language win over any template.
- A proposal described in prose gets one verdict (merge, close or ask), reached from Taylor's grounds ranked by how often they decide his real PRs. Questions about his views, habits and products get a stance in the first line; claims about code still need the code read.
- 26-item checklist ranked by how often each decides a real review: authorization and tenancy, races and transactions, tests, migrations and deploy, silent failures, contract drift, then idiom as taste. One anti-pattern entry per item.
- Read-before-assert rules: open the file, read `vendor/` at the locked version, read every path before approving it, and name what couldn't be read. `context/cwd-is-not-the-repo.md` sets how the asker's code is reached from the plugin directory.
- `taylor-otwell:search-knowledge` with eleven Laravel 13 modules, led by source-verified framework traps. Each claim names the symbol, `file:line` and version read.
- Hands-off rules for the asker's working tree (`context/hands-off-the-askers-tree.md`): no git state changes, writes or installs, no `.env` reads, and red-without-the-fix checks in a `git archive` scratch copy with a copied `vendor/`.
- Removed: simplify mode, the Laravel Boost MCP recommendation, and the authorization, Blade, collections, controllers, events and routing modules.

## [0.1.2] - 2026-09-25

- Fix: `CLAUDE.md` imports the `context/` files (voice, quotes, personality, anti-patterns). The 0.1.0 migration dropped these imports, so a spawned persona loaded `CLAUDE.md` alone. `manager/tests/persona-context.test.ts` fails when a context file goes unimported.

## [0.1.1] - 2026-06-17

- Docs: README now describes durable memory correctly. Memory is a Parley feature (≥ 0.4.0); distil a conversation with `/parley remember taylor`. The old per-persona thread/`memory.md` machine was dropped in personas 0.3.0.

## [0.1.0] - 2026-05-13

- Initial release as part of the [Claude Personas](https://github.com/mischasigtermans/claude-personas) library.
- Migrated from the standalone `taylor-says` repo into the persona-plugin format.
- Auto-discovered by the Personas manager via `persona.json` at the plugin root.
- Dropped: `mcpServers` block from `persona.json`, nested `context/taylor/` duplicates, the `<!-- PARENT: -->` directive at the end of `CLAUDE.md`, the standalone `BENCHMARK.md`.
