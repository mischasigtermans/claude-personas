# Taylor Otwell

Channels Taylor Otwell, fighting Laravel over-engineering.

Taylor reviews Laravel code for over-engineering, unnecessary abstractions, and fights against the framework. Direct, opinionated, occasionally brutal. Aimed at developer happiness, not enterprise Java cosplay.

## What Taylor is good at

- Spotting repository patterns wrapping Eloquent, service classes that proxy models, single-implementation interfaces.
- Calling out command buses with 15-line handlers and other ceremony.
- Recognizing where the framework already solved your problem.
- Distinguishing genuine business logic from busywork abstraction.
- Suggesting the simpler Laravel-native solution and applying it directly in simplify mode.

## Example

**Input:** A `BookmarkService` that wraps `Bookmark::create()` and `Bookmark::delete()` with a database transaction and try/catch error swallowing.

**Taylor:**

> **Service class that proxies models.** `BookmarkService` is the poster child for this anti-pattern. 150 lines of service code that exists primarily to call `Bookmark::create()`. The model is clean. The service is unnecessary ceremony.
>
> **Database transaction around a single query.** The transaction wraps a `first()` and a `create()`. If you're worried about race conditions on bookmark uniqueness, use a unique constraint and `firstOrCreate()`. The database handles this.
>
> **Error swallowing.** Catching `Throwable`, logging it, returning `null`. The caller has no idea what went wrong. Let it fail loudly. Laravel's exception handler will log it and you'll actually know something's broken.
>
> Delete `BookmarkService.php`. Ship it.

## Installation

```
/plugin marketplace add mischasigtermans/by-mischa
/plugin install taylor-otwell@by-mischa
```

### Requires

- Claude Code
- [Personas plugin](https://github.com/mischasigtermans/claude-personas/tree/main/manager) for threads and memory
- [Parley plugin](https://github.com/mischasigtermans/claude-parley), used by Personas as transport

Optional: [Laravel Boost MCP](https://github.com/laravelboost/mcp) gives Taylor access to your installed package versions, the application schema, and the official Laravel docs.

## With the Personas plugin

Per-project memory: Taylor remembers which abstractions you justified, which patterns you've already weighed, and what your team's house style is. Threads continue across CC sessions until you move on, then Taylor writes takeaways to `memory.md` so the next review picks up the convention.

Without the Personas plugin, Taylor still loads his voice and reviews code on demand, but every review is fresh.

## What's inside

- 22-item Taylor-ism checklist covering architecture, code organization, framework-fighting, and testing smells.
- Nine knowledge modules: Eloquent, controllers, validation, routing, authorization, Blade, events, testing, collections. Loaded on demand.
- Two modes: review (analyze and recommend) and simplify (analyze and apply fixes directly).

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Credits

- [Mischa Sigtermans](https://github.com/mischasigtermans)
- Philosophy: [Taylor Otwell](https://github.com/taylorotwell)

## License

MIT. See [../../LICENSE](../../LICENSE).
