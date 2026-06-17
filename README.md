# Claude Personas

[![Version](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/mischasigtermans/claude-personas/main/manager/.claude-plugin/plugin.json&query=$.version&label=version&prefix=v)](https://github.com/mischasigtermans/claude-personas/tree/main/manager)
[![Personas](https://img.shields.io/badge/personas-4-blue)](https://github.com/mischasigtermans/claude-personas#personas)
[![License](https://img.shields.io/github/license/mischasigtermans/claude-personas)](LICENSE)

A growing library of field-expert advisor plugins for Claude Code. Each persona is a long-lived voice with documented sources, per-project continuity, and optional tooling that puts the expert to work.

The library contains the Personas manager (the registry) plus a starter set of single-expert advisors. Each plugin is independent and installable through the by-mischa marketplace.

## What's inside

### Manager

- **[Personas](manager/)**: the registry. Auto-discovers installed persona plugins and registers each enabled one as a parley peer.

### Personas

- **[Steve Jobs](personas/steve-jobs/)**: product, leadership, strategy.
- **[Taylor Otwell](personas/taylor-otwell/)**: Laravel code reviews.
- **[Raymond Hettinger](personas/raymond-hettinger/)**: Python code reviews.
- **[David Tolnay](personas/david-tolnay/)**: Rust code reviews.

More personas land here as they're built.

## Installation

Each plugin is installed separately. Personas requires [Parley](https://github.com/mischasigtermans/claude-parley) as transport.

```
/plugin marketplace add mischasigtermans/by-mischa
/plugin install parley@by-mischa
/plugin install personas@by-mischa
/plugin install steve-jobs@by-mischa
```

Install Parley first, then the manager, then whichever personas you want.

## How they fit together

```
Persona plugins → Personas manager → Parley
```

- Each persona is a standalone Claude Code plugin: voice, knowledge, skills, optional tools.
- The Personas manager scans installed persona plugins and registers each enabled one as a parley peer behind 'ask steve what he thinks'.
- Parley invokes a persona in its own project context. Without Parley, Personas can't run.

A persona without the manager loads its voice and commands but isn't reachable as a peer from other projects.

## What is Parley

[Parley](https://github.com/mischasigtermans/claude-parley) lets one Claude Code project consult another on the same machine. Personas uses it to invoke a persona in its own project context: 'ask steve' from project A and 'ask steve' from project B run in separate headless sessions with separate continuity. Per-project state is the whole point, and Parley is what makes it possible.

## Why personas, not system prompts

A system prompt asks Claude to 'be like X'. The output is plausible but drifts. The voice softens, the opinions hedge, the advice generalizes. The model is doing improv with a costume.

A persona starts from documented evidence. I build each one by analyzing primary sources: books, transcripts, talks, interviews, papers, X posts, blogs. Composite personas come out of 8 to 12 contributing experts so the persona triangulates rather than impersonates one voice. The result is consistent across runs, traceable to source material, and bounded by what the persona knows.

What a persona ships with:

- A system prompt grounded in documented sources rather than guesswork.
- Context files (voice, quotes, personality, anti-patterns) loaded on every turn.
- Optional knowledge modules: deep guidance per topic, loaded on demand.
- Optional tooling: CLI commands, slash commands, MCP servers, even databases.

When you add the [Personas manager](manager/), every persona also gains per-project continuity and the natural-language dispatch behind 'ask steve what he thinks'.

## Advanced personas

Each persona here is a single-expert advisor that lives entirely in its plugin directory. The format also supports more substantial shapes:

- **Tool-backed personas.** A persona can ship its own CLI, a vector database with embedded reference material, or an MCP server for domain-specific actions. The persona doesn't only answer; it operates.
- **Composite personas.** Built from multiple contributing experts so the persona triangulates rather than impersonates. Useful for domains where no single voice is canonical.
- **Workflow personas.** Personas that work in tight loops with user input, augmenting rather than only advising. Named teammates with persistent context.

These ship later. They take longer to research and validate.

## Adding a persona

Persona authoring is currently done by me. If there's an expert you want as a persona, open an issue with the request. Include who they are, why they'd be useful as an advisor, and where their documented work lives (books, talks, blogs, X posts, papers).

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for repo-level releases. Each plugin also keeps its own CHANGELOG inside its directory.

## License

MIT. See [LICENSE](LICENSE).
