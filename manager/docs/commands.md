# Commands

Personas exposes two surfaces: slash commands for explicit operations, and natural-language triggers handled by the `personas` skill ('ask steve what he thinks'). Enable/disable and lookup route to the personas MCP server; the actual ask routes to `parley_ask`.

## Slash commands

| Command | Effect |
|---|---|
| `/personas` | Discovery menu. Lists known personas and their status. |
| `/personas list` | Always-full table of known personas. |
| `/personas enable <name>` | Activate a persona. Writes it into the parley extensions manifest. |
| `/personas disable <name>` | Deactivate. Removes its entries from the manifest. Any cached parley session is preserved. |
| `/personas add <git-url-or-path>` | Install an external persona repo (non-plugin format). |
| `/personas remove <name>` | Uninstall an external persona. Plugin-installed personas are removed via `/plugin uninstall` instead. |
| `/personas ask <name> <question>` | Explicit ask, bypasses awareness detection. Routes through `parley_ask`. |
| `/personas resolve <name-or-alias>` | Map an alias ('steve') to its canonical name and show enabled state. |

Continuity, transcripts, and starting a persona fresh are parley's surface: `/parley log <name>`, `/parley reset <name>`.

## MCP tools

The Personas MCP server owns the registry. Its tools:

`personas_list`, `personas_enable`, `personas_disable`, `personas_add`, `personas_remove`, `personas_resolve`.

`resolve` maps an alias ('steve') to a canonical name ('steve-jobs') and reports whether it's enabled. `enable` / `disable` mutate the parley extensions manifest. There are no turn or thread tools; the conversation runs entirely through `parley_ask`.

## How the skill routes

The `personas` skill detects two paths:

1. **Natural-language ask** ('ask steve about X', 'what would taylor say'). Skill calls `resolve` to map the alias and check it's enabled, then calls `parley_ask peer=<name>` with the crafted question.
2. **Slash command** (`/personas ...`). Skill maps the verb to the corresponding MCP tool and returns the result.

The enabled set lives at `~/.claude/parley/extensions/personas.json` and is owned exclusively by the personas MCP server. The skill never writes state directly.
