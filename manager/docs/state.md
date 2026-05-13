# State: threads, memory, project scoping

Every persona has two layers of state per project: an active thread and a durable memory file. Both are scoped by project, keyed off the git remote URL.

## Project ID

The dispatcher derives a stable `project_id` for every project:

- SHA1 of the git remote URL when available. First 12 hex chars.
- Falls back to a SHA1 of the absolute CWD when no remote is set.

Worktrees and clones of the same repo share the same `project_id`. Steve in your laptop clone and Steve in your CI clone see the same memory and threads.

## State layout

Under `~/.claude/personas/`:

```
config.json                            enabled set across all projects
parley-sync.lock                       cross-plugin lock for peers.json writes
state/<project_id>/<persona>/
├── memory.md                          durable, distilled, per-project
├── open-thread.json                   pointer to active thread file, if any
└── threads/
    ├── <thread_id>.md                 full transcript
    └── <thread_id>-takeaways.md       distilled bullets when closed
```

State lives outside the plugin install and survives reinstalls.

## Threads vs memory

- **Thread (active)**: full transcript, replayed in the persona's context on every continuing turn.
- **Memory (durable)**: short bullet list of facts, preferences, and decisions the persona 'knows' about this project. Loaded as preamble on every new thread.

When a thread closes (manually or via auto-close), the persona writes 3-8 takeaway bullets to `memory.md`, then archives the transcript. Reopening a closed thread restores it as the active thread without removing the takeaways.

## Silent auto-close

The skill closes threads on its own when one of these conditions hits:

- **Idle**: 3 consecutive user turns without involving the persona.
- **Topic shift**: user signals 'thanks', 'got it', 'anyway', or moves to an unrelated topic.
- **Resolution**: the persona's last reply gave a clear answer and the user moved on.

You'll see a one-line notification: *Closed steve-jobs thread (idle). `/personas reopen steve-jobs` to restore.* The transcript and takeaways are preserved either way.

## When state should not exist

A persona that's never been asked has no `state/<project_id>/<persona>/` directory. Files are created lazily on first turn. `/personas threads` returns empty until you start a conversation.

Disabling a persona keeps its state. Re-enabling resumes from the same memory. Uninstalling the persona plugin keeps its state too: state is keyed by canonical name, so reinstalling the same persona (even from a different source) picks up where it left off.
