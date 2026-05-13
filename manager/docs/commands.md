# Commands

Personas exposes two surfaces: slash commands for explicit operations, and natural-language triggers handled by the `personas` skill ('ask steve what he thinks'). Both route to the same MCP tools.

## Slash commands

| Command | Effect |
|---|---|
| `/personas` | Discovery menu. Lists known personas and their status. |
| `/personas list` | Always-full table of known personas. |
| `/personas enable <name>` | Activate a persona. Registers it as a parley peer. |
| `/personas disable <name>` | Deactivate. Open threads are preserved. Removes the parley peer entry. |
| `/personas add <git-url-or-path>` | Install an external persona repo (non-plugin format). |
| `/personas remove <name>` | Uninstall an external persona. Plugin-installed personas are removed via `/plugin uninstall` instead. |
| `/personas ask <name> <question>` | Explicit ask, bypasses awareness detection. |
| `/personas threads` | List open threads in this project. |
| `/personas close <name>` | Close thread, persona writes 3-8 takeaway bullets to memory. |
| `/personas new <name>` | Park the current thread, start a fresh one. |
| `/personas reopen <name>` | Restore the last closed thread. |

## MCP tools

The Personas MCP server owns all state. The tools cover the same surface as the slash commands plus the dispatcher entry points:

`personas_list`, `personas_enable`, `personas_disable`, `personas_add`, `personas_remove`, `personas_ask`, `personas_threads`, `personas_begin_turn`, `personas_commit_turn`, `personas_close_thread`, `personas_reopen_thread`, `personas_resolve`, `personas_get_thread_context`.

The `begin_turn` / `commit_turn` pair brackets every dispatched persona turn. `get_thread_context` returns the thread transcript plus memory file plus persona entry path for the dispatcher to load. `resolve` is the lookup that maps an alias ('steve') to a canonical name ('steve-jobs').

## How the skill routes

The `personas` skill detects two paths:

1. **Natural-language ask** ('ask steve about X', 'what would taylor say'). Skill resolves the alias, opens or continues a thread, dispatches to the persona, threads the reply.
2. **Slash command** (`/personas ...`). Skill maps the verb to the corresponding MCP tool and returns the result.

State (threads, memory, the enabled set, parley sync) lives at `~/.claude/personas/` and is owned exclusively by the MCP server. The skill never writes state directly.
