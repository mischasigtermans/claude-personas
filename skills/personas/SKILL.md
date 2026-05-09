---
name: personas
description: Consult and manage persona advisors (Steve Jobs, Taylor Otwell, Raymond Hettinger, David Tolnay, or installed third-party personas). Activates when the user asks for a named persona's perspective ("ask steve", "what would taylor say"), or invokes `/personas` to list, enable, ask, close threads, or manage the registry. Routes through the `personas` MCP server, which owns all state.
---

# Personas

Session-aware persona advisors with project-scoped threads and durable memory. Each persona is a long-lived voice you can consult; threads persist across CC sessions, and closed threads distill into a per-project memory file the persona reloads next time.

State lives in `~/.claude/personas/`, owned by the `personas` MCP server. **Use the MCP tools (`mcp__personas__*`) for every state operation. Never `Bash` mkdir, sha1, or write JSON state.** If a tool seems missing, flag it. Don't fall back to bash.

## How this skill activates

Two paths. Decide which one applies before reading further.

1. **Awareness path.** The user named a persona in natural language ("ask steve about X", "what would taylor say"). Take the *resolve → ask* sequence below. Most common case.
2. **Explicit path.** The user typed `/personas`, `/personas <action>`, or asked operationally ("list personas", "enable steve-jobs", "show open threads"). Jump to *Actions*.

If the user typed `/personas` with no argument, run the *discovery menu* under Actions.

Before either path, run *Silent auto-close* against open threads if applicable (see bottom).

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

## Actions

Parse the argument the user supplied with `/personas` (or the operational request) and dispatch.

### `(no argument)`: discovery menu

1. Call `list` to get all known personas.
2. Print a table: name, status (enabled/disabled), aliases, description.
3. If none are enabled, append the first-run hint:
   ```
   No personas enabled yet. To get started:

     /personas enable steve-jobs        bundled persona
     /personas enable taylor-otwell     (laravel reviews)
     /personas list                     show all known personas

   Then just speak: "what would steve think about this?"
   ```
4. Otherwise append:
   ```
   Common moves:
     /personas ask <name> <question>     explicit ask
     /personas threads                   show open threads in this project
     /personas close <name>              close a thread, persona writes takeaways
     /personas add <git-url-or-path>     install an external persona
   Or just speak: "ask steve about X", "what would taylor say".
   ```

### `list`

Same as no-argument, always print full table (no first-run hint).

### `enable <name>` / `disable <name>`

Call `enable` / `disable` with `name`. Print the result message.

### `add <git-url-or-path>`

Call `add` with `source` set to the argument. Print result. After success, suggest `/personas enable <name>`.

### `remove <name>`

Call `remove` with `name`. Print result.

### `ask <name> <question…>`

Run the *ask sequence* below with the supplied name and question. Bypasses awareness detection but uses the same machinery.

### `threads`

Call `threads`. If empty, print `No open threads in this project.` Otherwise list each: persona, started_at, subject, transcript path.

### `close <name>`

Run the *close sequence* below.

### `new <name>`

Park the current open thread by running the *close sequence* on it, then tell the user: `Started fresh thread for <name>. Just ask your question.` The next ask creates the new thread automatically.

### `reopen <name>`

Call `reopen_thread` with `name`. Print result.

### Unknown action

Print the "Common moves" hint from the discovery menu.

---

## Ask sequence (shared by awareness and `/personas ask`)

Once you have a resolved, enabled persona name and a user question:

1. **Begin the turn.** Call `begin_turn` with `name` (canonical name) and `question` (the user's actual question, full text). You get back: `persona_name`, `persona_path`, `memory_path`, `thread_path`, `is_continuation`, `subject`.

2. **In-session continuation check.** If you have already spawned a dispatcher named `<persona_name>` in this CC session, the agent is alive and addressable. Use `SendMessage({to: "<persona_name>", message: <built prompt>})`. The dispatcher's own context holds prior turns; transcript replay is unnecessary.

3. **Otherwise spawn the dispatcher** via `Agent({subagent_type: "personas:persona", name: "<persona_name>", prompt: <built prompt>})`. Record the returned `agentId` in your own working memory for this CC session. Name-based addressability is unreliable across user turns; use `agentId` for any subsequent `SendMessage` calls.

   When the dispatcher runs in the background after `SendMessage`, the harness automatically delivers a `<task-notification>` with `<result>...</result>` when it completes. **Wait for that notification.** Do NOT poll JSONL files in `/tmp/...` or run bash to check progress.

   Built prompt:
   ```
   PERSONA: <persona_name>
   PERSONA_PATH: <persona_path>
   MEMORY_PATH: <memory_path>
   THREAD_PATH: <thread_path>      # or "(new thread)" if is_continuation is false

   QUESTION:
   <user's question>
   ```

   Pass paths only. Do NOT inline the persona's system prompt or context files. The dispatcher reads them itself.

4. **Display.** Return the reply prefixed with the persona's display name in italics: *Steve Jobs:* …

   The dispatcher writes the Q/A block to the transcript file before returning. Do not call `commit_turn`. (It's an escape hatch for importing turns from outside, not the normal flow.)

### Crafting the question

Pass a useful `question` field. Full sentence, the goal not just keywords ("We're deciding whether to launch X. What would you push back on?", not "thoughts on launch?").

If the persona's first reply is incomplete, follow up with another `begin_turn` + spawn/send cycle. The thread persists.

### Acting on the answer

Don't just relay and stop. Use the reply to advance the user's task. If steve says "this feature is wrong, kill it", discuss with the user whether to act on that. If raymond proposes a refactor, show the actual code. The persona is an advisor, not an oracle.

---

## Close sequence (shared by `/personas close`, `new`, and silent auto-close)

1. Call `get_thread_context` with the persona's `name` to get `persona_path`, `memory_path`, `thread_path` (errors if no open thread).
2. Spawn (or `SendMessage`, if the dispatcher is alive in-session) with the close-task prompt:
   ```
   PERSONA: <persona_name>
   PERSONA_PATH: <persona_path>
   MEMORY_PATH: <memory_path>
   THREAD_PATH: <thread_path>

   TASK: close-thread

   This thread is closing. Output 3–8 bullet takeaways for the persona's memory file. Format `- <bullet>`. Output ONLY bullets, no preamble.
   ```
3. Call `close_thread` with `name` and `takeaways` set to the dispatcher's bullet output. The server writes to `memory.md` (deduped) and archives the thread.
4. Print the result. (For silent auto-close, use the one-line notification format below instead.)

---

## Silent auto-close

Before spawning a persona for a new turn, **and** at the start of every user turn that does not trigger a persona, evaluate every open thread for the current project against close heuristics:

- **Idle**: 3+ consecutive user turns without involving this persona (no triggers, no `/personas ask`, no follow-up to the persona's last reply).
- **Topic shift / closure cue**: user signaled closure ("thanks", "got it", "ok cool", "anyway", "let's move on") OR the current topic is unrelated to the thread's `subject`. LLM judgment.
- **Resolution**: persona's last reply provided a clear, complete answer and the user accepted it without follow-up.

Use `threads` to enumerate open threads.

When a heuristic fires:

1. Run the *close sequence* above.
2. Notify the user with one line: *Closed `<persona>` thread (<reason>). `/personas reopen <name>` to restore.*

**Do NOT silent-close on the same turn the persona was just active.** Resolution heuristics fire on the *next* turn, not the current one.

---

## Don'ts

- Don't trigger awareness on referential mentions. Ask-vs-mention is the bright line.
- Don't bypass the disabled state. Don't auto-enable to fulfill a trigger.
- Don't `Bash` your way to mkdir, sha1, or JSON writes. Every state operation goes through an MCP tool.
- Don't inline the persona's system prompt or context files in the spawn prompt. Pass paths only.
- Don't fabricate aliases or invent personas not in the enabled set.
- Don't respawn the persona via `Agent` if it's already addressable via `SendMessage` in this session.
- Don't silently close on the same turn the persona was active.
