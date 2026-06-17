# Personas

[![Version](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/mischasigtermans/claude-personas/main/manager/.claude-plugin/plugin.json&query=$.version&label=version&prefix=v)](https://github.com/mischasigtermans/claude-personas/tree/main/manager)
[![Personas](https://img.shields.io/badge/personas-4-blue)](https://github.com/mischasigtermans/claude-personas#personas)
[![License](https://img.shields.io/github/license/mischasigtermans/claude-personas)](../LICENSE)

Channel personas, expert advisors, from any Claude Code session.

The Personas plugin is the registry for persona-flagged plugins. It detects installed persona plugins, tracks which ones are enabled, and registers each enabled persona as a parley peer. Asking a persona ('ask steve what he thinks') routes through `parley_ask`. Parley owns the conversation: it spawns the persona's project as a headless Claude session, resumes it across turns, and logs the transcript.

## Installation

```
/plugin marketplace add mischasigtermans/by-mischa
/plugin install personas@by-mischa
```

### Requires

- Claude Code
- [Parley](https://github.com/mischasigtermans/claude-parley) ≥ 0.3.0 for transport
- At least one persona plugin to do anything useful, e.g. [steve-jobs](https://github.com/mischasigtermans/claude-personas/tree/main/personas/steve-jobs)

## Quick start

Install a persona, enable it, and ask it something in plain language:

```
/plugin install steve-jobs@by-mischa
/personas enable steve-jobs
'ask steve what he thinks about removing this feature'
```

The Personas skill picks up the natural-language ask and calls `parley_ask peer=steve`. Parley spawns Steve in his own plugin directory, so his `CLAUDE.md` loads as the voice, and returns the reply. The next ask resumes the same Claude session, so Steve remembers the prior turn.

You can also be explicit:

```
/personas ask steve-jobs 'Evaluate this product brief...'
/personas list                  # all known personas and their status
/personas disable steve-jobs    # remove from the parley registry
```

To start a persona fresh (forget the prior turns): `/parley reset <name>` clears the cached session for this project.

## Features

- Auto-discovery of installed persona plugins via the `persona.json` marker at the plugin root.
- Natural-language dispatch: 'ask steve what he thinks' routes through the right persona without explicit slash commands.
- Per-project continuity: parley keeps one continuous Claude session per (calling project, persona), keyed off the git remote. The same persona has separate context per project.
- Parley registry: enabling a persona writes it to parley's extensions manifest, so it's reachable from any project session as an ordinary peer.
- Per-persona runtime: `model`, `mcpServers`, and trusted-peer permissions from `persona.json` carry through to the headless spawn.
- Durable memory: parley remembers what you distil from a persona across sessions. Opt a persona out with `"memory": false` in its `persona.json`.

## State split

- **Personas plugin** owns: which personas exist (installed plugins + external clones), which are enabled (manifest at `~/.claude/parley/extensions/personas.json`).
- **Parley** owns: how to reach an enabled persona, session continuity across turns, transcripts.

There is no separate thread or memory state machine in this plugin. Continuity is parley's: the resumed session pointer plus its durable memory (parley ≥ 0.4.0). Personas only declares the per-persona memory preference.

## Documentation

- [Commands](docs/commands.md): slash commands and MCP tools reference
- [State](docs/state.md): the extensions manifest, project scoping, what parley owns
- [Authoring](docs/authoring.md): writing your own persona plugin
- [Architecture](docs/architecture.md): how the persona plugins, manager, and parley fit together

## Related

- **[Claude Personas](https://github.com/mischasigtermans/claude-personas)** hosts this manager alongside a growing set of persona plugins.
- **[Parley](https://github.com/mischasigtermans/claude-parley)** is the cross-session transport. Personas can't run without it.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Credits

- [Mischa Sigtermans](https://mischa.sigtermans.me)

## License

MIT. See [../LICENSE](../LICENSE).
