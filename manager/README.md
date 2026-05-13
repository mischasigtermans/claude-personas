# claude-personas

Session-aware persona advisors for Claude Code. Each persona (Steve Jobs, Taylor Otwell, Raymond Hettinger, David Tolnay, or any you author yourself) becomes a long-lived voice with project-scoped threads and durable memory. Speak naturally: *"ask steve what he thinks"*, *"what would taylor say about this controller?"* Threads persist across CC sessions; closed threads distill into a per-project memory file the persona reloads next time.

## What this is for

**Stop re-introducing yourself.** The standalone `*-says` plugins were stateless: one prompt, one answer, no continuity. The personas plugin turns each persona into an advisor that remembers what you discussed last week, what advice you took, and what's specific to *this* project versus the one in another folder.

**Project-scoped heads.** Same Steve, different head per project. Steve in your Laravel app remembers your launch plan; Steve in your Rust crate remembers the API decisions. Project identity is keyed off your git remote, so worktrees and clones share state.

**One plugin, many personas.** Install `claude-personas` once. Bundled personas ship disabled by default. Opt in with `/personas enable steve-jobs`. Add third-party personas with `/personas add <git-url>`; they're plain repos with a `persona.md`, no Claude plugin scaffolding required.

**Natural-language management.** A `personas` skill detects "ask steve about X" without slash commands, continues open threads automatically, and silently auto-closes resolved threads. Closing distills the persona's takeaways into the memory file before archiving the transcript. `/personas reopen <name>` is the safety valve.

## Installation

```
# Clone into your plugin directory (until published to a marketplace)
git clone https://github.com/mischasigtermans/claude-personas

# Or install via your plugin manager
/plugin install mischasigtermans/claude-personas
```

## Quick start

```
# See what's available
/personas list

# Enable a bundled persona
/personas enable steve-jobs

# Then just speak
"what would steve think about removing this feature?"
"ask taylor whether this controller is doing too much"
"raymond, is there a more pythonic way to write this?"
```

You can also be explicit:

```
/personas ask steve-jobs "Evaluate this product brief..."
/personas threads               # show open threads in this project
/personas close steve-jobs      # write takeaways, archive thread
/personas reopen steve-jobs     # restore the most recent closed thread
```

## Bundled personas

| Canonical name | Aliases | Domain |
|---|---|---|
| `steve-jobs` | steve, jobs | Product design, leadership, simplicity, craft |
| `taylor-otwell` | taylor, otwell | Laravel reviews, code elegance |
| `raymond-hettinger` | raymond, hettinger | Pythonic style, code reviews |
| `david-tolnay` | david, tolnay | Rust idioms, type safety |

All ship disabled by default. Each bundles its own knowledge files (deep guidance per topic) loaded on demand.

## How it works

```
┌─ skills/personas/           ◀── triggers, dispatch, lifecycle
│                                  awareness ("ask steve...") + /personas actions
├─ personas/<name>/           ◀── bundled persona definitions
│   ├─ persona.md             (YAML frontmatter + system prompt)
│   ├─ context/               (voice, quotes, personality. Inlined via @)
│   └─ knowledge/             (deep topical guidance. Read on demand)
├─ ~/.claude/personas/
│   ├─ config.json            (enabled set)
│   ├─ external/<name>/       (third-party personas you /personas add)
│   └─ state/<project_id>/<persona>/
│       ├─ memory.md          (durable, distilled)
│       ├─ open-thread.json   (pointer if a thread is active)
│       └─ threads/<id>.md    (full transcripts)
```

`project_id` is sha1 of the git remote URL (first 12 chars), with cwd hash as fallback. State lives outside the plugin and survives reinstalls.

### Threads vs memory

- **Thread (active)**. Full transcript, replayed in the persona's context on every continuing turn.
- **Memory (durable)**. Short bullet list of facts, preferences, and decisions the persona "knows" about this project. Loaded as preamble on every new thread.

When a thread closes (manually or via auto-close heuristic), the persona writes 3–8 bullet takeaways to `memory.md`, then archives the transcript. Reopening a closed thread restores it as the active thread without removing the takeaways.

### Silent auto-close

The skill closes threads on its own when:

- **Idle**: 3 consecutive user turns without involving the persona.
- **Topic shift / closure cue**: user signals "thanks", "got it", "anyway", or moves to an unrelated topic.
- **Resolution**: the persona's last reply gave a clear answer and the user moved on.

You'll see a one-line notification: *"Closed steve-jobs thread (idle). `/personas reopen steve-jobs` to restore."* The transcript and takeaways are preserved either way.

## Authoring a persona

A persona is a directory with one required file:

```
my-persona/
├── persona.md          (YAML frontmatter + system prompt)
├── context/            (optional. Inlined via @context/<file>.md)
└── knowledge/          (optional. Read on demand by the persona)
```

`persona.md` frontmatter:

```yaml
---
name: marie-curie
aliases: [marie, curie]
model: opus
description: Channels Marie Curie's empirical rigor and persistence in the face of skepticism.
tools: [Read, Write, Edit, Glob, Grep, WebSearch]
traits: [science, rigor, persistence]
---

You are an AI advisor channeling Marie Curie's documented...
```

Publish it as a git repo, then anyone can install with `/personas add https://github.com/you/marie-curie`.

## Slash commands

| Command | Effect |
|---|---|
| `/personas` | Discovery menu. Lists known personas and their status. |
| `/personas list` | Same as above, always full table. |
| `/personas enable <name>` | Activate a persona. |
| `/personas disable <name>` | Deactivate. Open threads are preserved. |
| `/personas add <git-url-or-path>` | Install an external persona repo. |
| `/personas remove <name>` | Uninstall an external persona. |
| `/personas ask <name> <question>` | Explicit ask, bypasses awareness detection. |
| `/personas threads` | List open threads in this project. |
| `/personas close <name>` | Close thread, persona writes takeaways. |
| `/personas new <name>` | Park current thread, start fresh. |
| `/personas reopen <name>` | Restore the most recently closed thread. |

## Relationship to other plugins

- **Replaces** the standalone `*-says` plugins (taylor-says, raymond-says, david-says, steve-says). Their content is bundled here. The original repos are retired.
- **Complements** [parley](https://github.com/mischasigtermans/parley): parley is for cross-process IPC between independent CC sessions on different projects. The personas plugin is in-session: same CC process, multiple addressable advisor subagents with their own state. Different problems, different scopes.

## License

MIT.
