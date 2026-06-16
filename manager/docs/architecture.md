# Architecture

Three layers, three roles. The Personas manager is a thin registry between persona plugins and Parley. Parley does the heavy lifting.

## The three layers

```
Persona plugins → Personas manager → Parley
```

- **Persona plugins** (steve-jobs, taylor-otwell, etc.) ship the voice, knowledge, skills, and commands for one persona. Each is a standalone Claude Code plugin discovered via its `persona.json` marker. The plugin's `CLAUDE.md` is the persona's system prompt.
- **The Personas manager** (this plugin) detects persona plugins and tracks which are enabled. Enabling a persona registers it as a parley peer; disabling removes it. That is the whole job.
- **Parley** is the cross-session transport. It spawns an enabled persona as a headless Claude session in the persona's own directory, resumes that session across turns, and logs the transcript.

## Discovery

On every `list` call, the manager scans `~/.claude/plugins/installed_plugins.json` for plugins declaring `persona.json` at their root. Matches are merged with externally-installed personas under `~/.claude/personas/external/`. The combined set is what `/personas enable` operates on.

When two sources declare the same canonical name, plugin-installed wins. External installs are the legacy path for personas that don't ship as Claude Code plugins.

## Dispatch

When the skill detects an ask:

1. Resolve the alias ('steve' → 'steve-jobs') via `resolve`, confirming the persona is enabled.
2. Call `parley_ask peer=<name>` with the crafted question.
3. Parley spawns (or resumes) Claude in the persona's plugin directory. The persona's `CLAUDE.md` loads as the voice; the reply returns through parley.

There is no dispatcher subagent and no per-turn state machine. The persona's voice comes from its own `CLAUDE.md` loaded by the spawned Claude, not from a manager-controlled prompt.

## State ownership

The manager owns exactly one piece of state: the parley extensions manifest at `~/.claude/parley/extensions/personas.json`, listing enabled personas. Everything about a conversation (cached sessions, continuity, transcripts) is parley's, scoped per (calling project, persona). See [state.md](state.md).

## Parley registration

Enabling a persona writes one entry per alias to the extensions manifest:

```json
{
  "name": "personas",
  "version": "0.3.0",
  "peers": [
    {
      "alias": "steve-jobs",
      "path": "~/.claude/plugins/cache/<repo-hash>/personas/steve-jobs",
      "description": "Channels Steve Jobs's documented decision frameworks...",
      "type": "persona",
      "model": "opus",
      "skipPermissions": true
    }
  ]
}
```

Parley scans `~/.claude/parley/extensions/*.json` and merges these as ordinary peers. The personas plugin never imports parley source and never writes `peers.json`; the contract is purely filesystem-level, documented in parley's [extensions docs](https://github.com/mischasigtermans/claude-parley/blob/main/docs/extensions.md). User-curated `peers.json` entries win on alias collision.

`model`, `mcpServers`, and `skipPermissions` come from the persona's `persona.json` and carry through so the headless spawn matches the persona's intended runtime (e.g. Steve runs on opus).

## Headless invocation

When the skill asks a persona, parley:

- Picks a live listener if the persona's project is open in `/parley listen` mode, otherwise spawns headless `claude -p`.
- Uses the persona's directory as cwd, so its `CLAUDE.md` and skills load automatically.
- Resumes the cached session on follow-ups, so the persona remembers the prior turns within that project.

This is why parley is a hard requirement: the cross-session boundary is what makes per-project continuity possible. Same persona, different project, separate session.
