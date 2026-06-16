---
name: personas
description: Consult and manage persona advisors installed as separate marketplace plugins (Steve Jobs, Taylor Otwell, Raymond Hettinger, David Tolnay, third-party personas, or external clones). Activates when the user asks for a named persona's perspective ("ask steve", "what would taylor say"), or invokes `/personas` to list, enable, disable, ask, or manage the registry. Routes through the `personas` MCP server for enable/disable state and through `parley_ask` for the actual conversation.
---

# Personas

Persona advisors you can consult from any project. Each persona is a peer with its own voice and knowledge module. The personas plugin manages enable/disable state via the parley extensions manifest. Asking a persona goes through `parley_ask`. Parley handles spawning, session continuity (via `--resume`), and the transcript log.

State split:

- **Personas plugin** owns: which personas exist (installed plugins + external clones), which are enabled (manifest at `~/.claude/parley/extensions/personas.json`).
- **Parley** owns: how to reach an enabled persona, session continuity across turns, transcripts. Enabled personas appear in `parley_peers` as ordinary peers.

**Use the MCP tools for every state operation. Never `Bash` mkdir, sha1, or write JSON state.** If a tool seems missing, flag it. Don't fall back to bash.

## How this skill activates

Two paths.

1. **Awareness path.** The user named a persona in natural language ("ask steve about X", "what would taylor say"). Take the *resolve → ask* sequence below.
2. **Explicit path.** The user typed `/personas`, `/personas <action>`, or asked operationally ("list personas", "enable steve-jobs"). Jump to *Actions*.

If the user typed `/personas` with no argument, run the *discovery menu* under Actions.

---

## Awareness path

### When to fire

Look for a *request for the persona's perspective*:

- "ask steve" / "ask taylor about X" / "what does raymond think"
- "what would <name> say about this?" / "let's hear from <name>"
- "get <name>'s take" / "channel <name>'s view"
- "<name>, would you...?" (direct address)

**Use LLM judgment, not regex.**

### MUST NOT fire on

- Referential mentions: "steve mentioned earlier", "as taylor said before".
- Quoted/cited content: "the steve quote about focus".
- Unrelated namesakes: "steve from accounting".
- The persona's own messages echoed back into the transcript.

If unsure, prefer NOT to fire. Let the user say it more explicitly.

### Resolve the alias

Call `resolve` with `ref` set to whatever the user said (e.g. `"steve"`, `"taylor otwell"`). Branch:

- `{found: true, enabled: true, ...}` → continue to *ask sequence*.
- `{found: true, enabled: false}` → tell the user: *"`<name>` is installed but disabled. Run `/personas enable <name>` to activate."* Don't silently enable.
- `{found: false}` → don't fire. The user is talking about something else.
- `{ambiguous: true, candidates: [...]}` → ask which one they mean.

Then run the *ask sequence*.

---

## Ask sequence

Once you have a resolved, enabled persona name and a user question:

1. **Craft the question.** The persona is a separate session and only sees this prompt. Treat it as self-contained:
   - State the goal in one sentence.
   - Include any relevant snippet, error, or context the persona needs to answer.
   - Be specific about what you want back ("push back on this plan", not "thoughts?").

2. **Call `parley_ask`** with `peer` = the persona's canonical name (or any alias) and `question` = the crafted prompt. Parley resolves the alias via the personas extension manifest, spawns claude in the persona's plugin directory (so `CLAUDE.md` loads with the persona's voice), and routes through whichever transport applies (live if you've summoned a Terminal, headless otherwise). Continuity across turns is automatic via parley's session pointer.

3. **Display.** Return the reply prefixed with the persona's display name in italics: *Steve Jobs:* …

4. **Act on the answer.** Don't just relay and stop. Use the reply to advance the user's task. If steve says "this feature is wrong, kill it", discuss with the user whether to act on that. If raymond proposes a refactor, show the actual code. The persona is an advisor, not an oracle.

### Follow-ups

Subsequent `parley_ask` calls to the same persona resume the cached session; the persona remembers the prior turn. No explicit thread management is needed.

To start fresh (the persona forgets prior context): `/parley reset <persona-name>` clears the cached session for this project. The next ask spawns a new claude session.

---

## Actions

Parse the argument the user supplied with `/personas` (or the operational request) and dispatch.

### `(no argument)`: discovery menu

1. Call `list` to get all known personas with their enabled state.
2. Print a table: name, status (enabled/disabled), aliases, description.
3. **Branch on what `list` returned:**
   - **No personas at all** (empty list): the manager is installed but no persona plugins are. Tell the user to install one or more via the marketplace, e.g. `/plugin install steve-jobs@by-mischa`, `/plugin install taylor-otwell@by-mischa`. Each persona is a separate plugin; the manager just manages enable/disable + routing.
   - **Personas installed but none enabled**: print the first-run hint:
     ```
     Personas installed but none enabled. To activate one:

       /personas enable <name>            e.g. /personas enable steve-jobs
       /personas list                     show all known personas

     Then just speak: "what would steve think about this?"
     ```
   - **At least one enabled**: skip ahead to the "Common moves" hint.
4. Otherwise append:
   ```
   Common moves:
     /personas ask <name> <question>     explicit ask (routes through parley_ask)
     /personas enable <name>             activate a persona
     /personas disable <name>            deactivate (preserves any cached state)
     /personas add <git-url-or-path>     install an external persona
   Or just speak: "ask steve about X", "what would taylor say".
   ```

### `list`

Same as no-argument, always print full table (no first-run hint).

### `enable <name>` / `disable <name>`

Call `enable` / `disable` with `name`. Print the result message.

The plugin writes/removes the persona's entry in `~/.claude/parley/extensions/personas.json`. From that moment on, parley sees the persona as a peer addressable by canonical name or any alias.

### `add <git-url-or-path>`

Call `add` with `source` set to the argument. Print result. After success, suggest `/personas enable <name>`.

### `remove <name>`

Call `remove` with `name`. Print result. Refuses plugin-installed personas (those come/go via Claude Code's plugin system).

### `ask <name> <question…>`

Run the *ask sequence* above with the supplied name and question. Bypasses awareness detection but uses the same machinery.

### `resolve <name-or-alias>`

Call `resolve`. Useful for verifying which canonical persona an alias maps to and whether it's enabled.

### Unknown action

Print the "Common moves" hint from the discovery menu.

---

## Don'ts

- Don't trigger awareness on referential mentions. Ask-vs-mention is the bright line.
- Don't bypass the disabled state. Don't auto-enable to fulfill a trigger.
- Don't `Bash` your way to mkdir, sha1, or JSON writes. Every state operation goes through an MCP tool.
- Don't fabricate aliases or invent personas not in the list.
- Don't call `parley_add` to register a persona manually. The personas plugin owns the extension manifest; manual peers.json entries are a different code path.
- Don't expect thread / memory / close machinery. It's not part of this plugin's surface in v0.3.0. Continuity is parley's session pointer, not personas-specific state.
