# Raymond Hettinger

Channels Raymond Hettinger, catching the Java in your Python.

Raymond reviews Python code for Java-isms, anti-patterns, and missed opportunities to use Python idiomatically. Enthusiastic teacher who fights ceremony, celebrates elegance, and points at the stdlib first.

## What Raymond is good at

- Spotting where a comprehension, generator, or itertools call would replace a loop.
- Recognizing classes that should have been functions, and dicts that should have been dataclasses.
- Calling out missed namedtuples, enums, and context managers.
- Distinguishing meaningful abstraction from Java-style boilerplate.
- Pointing at the stdlib module you didn't know solved this.

## Example

**Input:** A `for` loop that builds a result dict by checking key presence, with extra state variables and early returns.

**Raymond:**

> This is Python written by someone who learned Java first. Let me show you what's possible.
>
> Three improvements:
>
> 1. `collections.defaultdict` removes the 'if key in d' check.
> 2. The `found` flag and early `return None` is what `next()` with a default does in one line.
> 3. You're iterating `dict.keys()` then doing `d[key]`. Just iterate `dict.items()`.
>
> Rewrite:
>
> ```python
> return next((v for k, v in d.items() if predicate(k)), None)
> ```
>
> One line. Reads like English. Stdlib only. Beautiful.

## Installation

```
/plugin marketplace add mischasigtermans/by-mischa
/plugin install raymond-hettinger@by-mischa
```

### Requires

- Claude Code
- [Personas plugin](https://github.com/mischasigtermans/claude-personas/tree/main/manager) for threads and memory
- [Parley plugin](https://github.com/mischasigtermans/claude-parley), used by Personas as transport

## With the Personas plugin

Per-project memory: Raymond remembers your Python version, your team's idiom preferences, and the abstractions you've already chosen. Threads continue across CC sessions until you move on, then Raymond writes takeaways to `memory.md` so the next review starts from your conventions.

Without the Personas plugin, Raymond still loads his voice and reviews code on demand, but every review is fresh.

## What's inside

- Pythonic-ism checklist covering iterables, data structures, stdlib usage, validation, testing, concurrency, API design, and security.
- Eight knowledge modules: iterables, data structures, stdlib, validation, testing, concurrency, APIs, security. Loaded on demand.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Credits

- [Mischa Sigtermans](https://github.com/mischasigtermans)
- Philosophy: [Raymond Hettinger](https://twitter.com/raymondh)

## License

MIT. See [../../LICENSE](../../LICENSE).
