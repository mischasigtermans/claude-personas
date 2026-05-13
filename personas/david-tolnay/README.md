# David Tolnay

[![Version](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/mischasigtermans/claude-personas/main/personas/david-tolnay/.claude-plugin/plugin.json&query=$.version&label=version&prefix=v)](https://github.com/mischasigtermans/claude-personas/tree/main/personas/david-tolnay)
[![License](https://img.shields.io/github/license/mischasigtermans/claude-personas)](../../LICENSE)

Channels David Tolnay, stopping you from fighting the borrow checker.

David reviews Rust code for idiomatic patterns, type safety, and unnecessary fights with the borrow checker. Precise, quiet, authoritative. Fights the temptation to reach for `.clone()` and `Arc<Mutex<T>>` when a better design would avoid the need.

## What David is good at

- Spotting `Arc<Mutex<T>>` where a redesign would remove shared mutable state.
- Recognizing missed opportunities to encode invariants in the type system.
- Calling out unnecessary `.clone()` calls and where lifetimes would carry their weight.
- Distinguishing genuine `unsafe` blocks from `unsafe` used as escape hatch.
- Pointing at the serde, error-handling, or macro pattern that fits this case.

## Example

**Input:** A struct using `Arc<Mutex<HashMap<String, Vec<u8>>>>` shared between threads, with `.clone()` on every read.

**David:**

> Before you reach for `Arc<Mutex<T>>`, ask: does this actually need shared mutable state?
>
> Three options that aren't this:
>
> 1. **Channel-based.** Owner of the map sits in one task. Other tasks send requests via `mpsc`. No locking, no cloning.
> 2. **`Arc<HashMap<...>>` without the Mutex.** If reads dominate, freeze the map at construction. Cheap clones, no contention.
> 3. **`DashMap` or `RwLock<HashMap<...>>`.** If you really need concurrent mutation, at least pick the right primitive.
>
> The `Arc<Mutex<T>>` everywhere with `.clone()` on every read is a design that compiles, runs, and turns into a deadlock under load.
>
> Pick option 1 unless you have evidence you need shared mutation.

## Installation

```
/plugin marketplace add mischasigtermans/by-mischa
/plugin install david-tolnay@by-mischa
```

### Requires

- Claude Code
- [Personas plugin](https://github.com/mischasigtermans/claude-personas/tree/main/manager) for threads and memory
- [Parley plugin](https://github.com/mischasigtermans/claude-parley), used by Personas as transport

## With the Personas plugin

Per-project memory: David remembers your crate's lifetime conventions, error type choices, and which `unsafe` invariants you've already justified. Threads continue across CC sessions until you move on, then David writes takeaways to `memory.md` so the next review starts from your conventions.

Without the Personas plugin, David still loads his voice and reviews code on demand, but every review is fresh.

## What's inside

- Rust idiom checklist covering ownership, error handling, type design, concurrency, macros, and dependencies.
- Eight knowledge modules: ownership, error handling, type design, concurrency, serde, macros, testing, dependencies. Loaded on demand.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Credits

- [Mischa Sigtermans](https://mischa.sigtermans.me)
- Philosophy: [David Tolnay](https://github.com/dtolnay)

## License

MIT. See [../../LICENSE](../../LICENSE).
