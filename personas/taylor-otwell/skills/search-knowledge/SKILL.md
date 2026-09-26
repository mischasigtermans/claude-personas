---
name: search-knowledge
description: "Taylor Otwell persona's verified Laravel 13 reference: security and auth, queues and concurrency, migrations and deploy, Eloquent, validation, Livewire 4, testing, Boost/MCP/AI SDK, framework traps, framework rationale, release policy. Use only when answering as the Taylor Otwell persona, before a finding rests on framework behaviour."
---

## Knowledge files

Each module is verified against package source on disk and names the version and `file:line` it read. Those are pointers: re-find the symbol in the asker's `vendor/` at their locked version before citing it (`context/cwd-is-not-the-repo.md`). Framework read at v13.33 (`~/Sites/bron`) and v13.23 (`~/Github/onoma/platform`).

| Topic | File | When to use |
|---|---|---|
| Framework traps | `framework-traps.md` | Every gate review, verify pass and consult on Laravel code, at the Trace step. The counter-instruction list (T1-T29) the other modules point to |
| Security and auth | `security-auth.md` | Guards, Sanctum, Passport, middleware groups, cookies, CSRF, proxies and client IP, policies, tenancy on write paths, OAuth, SSRF, key rotation |
| Queues and concurrency | `queues-concurrency.md` | Transactions, after-commit, jobs, notifications, retries and idempotency, unique jobs, locks, `defer()`, `Cache::flexible()`, `Concurrency`, Horizon |
| Migrations and deploy | `migrations-deploy.md` | Schema changes, transactional DDL per engine, online indexes, backfills, deploy order, `down()`, queued and cached state across a deploy, host-dependent behaviour |
| Eloquent | `eloquent.md` | Change tracking, model events, touches, pivots, global scopes, chunking and cursors, lazy loading, upserts, vector search, mass assignment |
| Validation | `validation.md` | When a rule runs, empty strings, entry points (HTTP, Livewire, MCP, `Validator::make()`), Form Requests, tenancy-scoped `exists`/`unique`, custom rules |
| Livewire | `livewire.md` | Livewire 4 components: actions as endpoints, persistent middleware, locked and client-writable properties, empty input, keys, islands, uploads, Livewire tests |
| Testing | `testing.md` | Red without the fix, feature tests through the route, what each fake hides, time travel, engine parity, `->todo()` pinning, Pest 5 and Tia |
| Boost, MCP and AI SDK | `boost-mcp-ai.md` | laravel/mcp servers, tools and OAuth, Boost tools and guidelines, prompt and skill changes, AI SDK approvals, fakes and drift |
| Framework rationale | `framework-rationale.md` | 'Why does Laravel do X', and before any 'we made X because' sentence |
| Release policy | `release-policy.md` | Breaking changes, semver, support windows, package public API, reverts, the maintainer-to-app transfer |

## Usage

- On Laravel code, read `framework-traps.md` first, then the topic module before a finding rests on framework behaviour. Several modules can apply to one diff: a queued notification inside a Livewire action touches `livewire.md`, `queues-concurrency.md` and `testing.md`.
- Checklist numbers in the modules refer to the Taylor-ism Checklist in `CLAUDE.md`. T-numbers refer to `framework-traps.md`.
- Lines in single quotes are mine only in `framework-rationale.md` and `release-policy.md`. Every other module is reference text, never quoted as my words.
- A module claim marked 'engine', 'docs-only' or 'public product docs' is not framework source: say so when citing it.
