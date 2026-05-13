# Architecture

Three layers, three roles. The Personas manager sits between persona plugins and Parley, owning the state machine that makes 'ask steve what he thinks' feel like a real conversation.

## The three layers

```
Persona plugins → Personas manager → Parley
```

- **Persona plugins** (steve-jobs, taylor-otwell, etc.) ship the voice, knowledge, skills, and commands for one persona. Each is a standalone Claude Code plugin discovered via its `persona.json` marker.
- **The Personas manager** (this plugin) detects persona plugins, runs the per-project state machine (threads + memory), and provides the dispatcher behind natural-language asks.
- **Parley** is the cross-session transport. The manager uses parley to invoke a persona in its own project context, so 'ask steve' from project A and 'ask steve' from project B run in isolated headless sessions with separate memory.

## Discovery

On every `personas_list` call, the manager scans `~/.claude/plugins/installed_plugins.json` for plugins declaring `persona.json` at their root. Matches are merged with externally-installed personas under `~/.claude/personas/external/`. The combined set is what `/personas enable` operates on.

When two sources declare the same canonical name, plugin-installed wins. External installs are the legacy path for personas that don't ship as Claude Code plugins.

## Dispatch

When the skill detects an ask:

1. Resolve the alias ('steve' → 'steve-jobs') via `personas_resolve`.
2. Open or continue a thread via `personas_begin_turn`. Returns the persona's entry file, context paths, memory file, and active thread transcript.
3. The dispatcher subagent (defined in `agents/persona.md`) reads the entry file + every `context/*.md` + memory + transcript, then answers in the persona's voice.
4. The reply is appended to the thread via `personas_commit_turn`.

The dispatcher is just a Claude subagent with the right context loaded. It has no special permissions and no state of its own; all state operations route through the MCP server.

## State ownership

The MCP server is the single owner of state at `~/.claude/personas/`. Skills, hooks, and external callers never touch state files directly; they call MCP tools. This invariant lets the manager refactor state layout freely without breaking consumers.

## Parley sync

Enabling a persona writes a peer entry to `~/.claude/parley/peers.json`:

```json
"steve-jobs": {
  "path": "~/.claude/plugins/cache/<repo-hash>/personas/steve-jobs",
  "description": "Channels Steve Jobs's documented decision frameworks...",
  "type": "persona"
}
```

The `type: "persona"` marker tells parley this peer is plugin-managed. Parley shows it in `parley_peers` with the type column populated.

Disabling a persona removes the peer entry. Externally-added peers (no `type` field, or a different value) are left alone with a stderr advisory; the manager won't clobber user-managed entries.

Cross-plugin writes are serialised via a lock at `~/.claude/personas/parley-sync.lock` to coordinate with parley's own writers.

## Headless invocation

When the dispatcher needs to invoke a persona, it routes through parley:

- Manager calls `parley_ask <persona> <question>`.
- Parley picks live (peer in `/parley listen` mode) or headless (cached or fresh).
- The persona's project directory becomes the cwd, so its CLAUDE.md, skills, and context load automatically.
- Reply returns through parley to the manager, which threads it.

This is why parley is a hard requirement: the cross-session boundary is what makes per-project memory possible. Same persona, different project, isolated state.
