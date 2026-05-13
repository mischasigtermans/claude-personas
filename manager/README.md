# Personas

[![Version](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/mischasigtermans/claude-personas/main/manager/.claude-plugin/plugin.json&query=$.version&label=version&prefix=v)](https://github.com/mischasigtermans/claude-personas/tree/main/manager)
[![Personas](https://img.shields.io/badge/personas-4-blue)](https://github.com/mischasigtermans/claude-personas#personas)
[![License](https://img.shields.io/github/license/mischasigtermans/claude-personas)](../LICENSE)

Channel personas, expert advisors, from any Claude Code session.

The Personas plugin is the dispatcher and state machine for persona-flagged plugins. It detects installed persona plugins, routes natural-language asks ('ask steve what he thinks'), runs the per-project thread and memory state machine, and registers each enabled persona as a parley peer so cross-project advice works too.

## Installation

```
/plugin marketplace add mischasigtermans/by-mischa
/plugin install personas@by-mischa
```

### Requires

- Claude Code
- [Parley](https://github.com/mischasigtermans/claude-parley) for transport
- At least one persona plugin to do anything useful, e.g. [steve-jobs](https://github.com/mischasigtermans/claude-personas/tree/main/personas/steve-jobs)

## Quick start

Install a persona, enable it, and ask it something in plain language:

```
/plugin install steve-jobs@by-mischa
/personas enable steve-jobs
'ask steve what he thinks about removing this feature'
```

The Personas skill picks up the natural-language ask, dispatches to Steve, and threads the conversation. Continued asks stay in the same thread. The thread closes silently when you move on, and Steve writes 3-8 takeaways to a per-project memory file so the next conversation starts from where this one ended.

You can also be explicit:

```
/personas ask steve-jobs 'Evaluate this product brief...'
/personas threads               # open threads in this project
/personas close steve-jobs      # close thread, write takeaways
/personas reopen steve-jobs     # restore the last closed thread
```

## Features

- Auto-discovery of installed persona plugins via the `persona.json` marker at the plugin root.
- Natural-language dispatch: 'ask steve what he thinks' routes through the right persona without explicit slash commands.
- Project-scoped threads: the same persona runs different memory and threads per project, keyed off the git remote.
- Durable memory: when a thread closes, the persona distills 3-8 takeaways into `memory.md` for next time.
- Silent auto-close on idle, topic shift, or resolution. `/personas reopen` is the safety valve.
- Parley sync: enabling a persona registers it as a parley peer so it's reachable across project sessions.

## Documentation

- [Commands](docs/commands.md): slash commands and MCP tools reference
- [State](docs/state.md): how threads, memory, and project_id work
- [Authoring](docs/authoring.md): writing your own persona plugin
- [Architecture](docs/architecture.md): how the dispatcher, manager, and personas fit together

## Related

- **[Claude Personas](https://github.com/mischasigtermans/claude-personas)** hosts this manager alongside a growing set of persona plugins.
- **[Parley](https://github.com/mischasigtermans/claude-parley)** is the cross-session transport. Personas can't run without it.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Credits

- [Mischa Sigtermans](https://mischa.sigtermans.me)

## License

MIT. See [../LICENSE](../LICENSE).
