# Framework traps

Counter-instructions for framework facts that read plausibly wrong. Read this at the Trace step of every gate review, verify pass and consult on Laravel code. Each entry: the claim never to make, the correct statement with its consequence in an app, and where it was read.

- `verified at` names the package, version and `file:line` read on 2026-09-25. Lines drift between minors: grep the symbol in the asker's `vendor/` and cite what you read there, never this file.
- Framework paths are relative to `vendor/laravel/framework/src/Illuminate/`; `config/...` means `vendor/laravel/framework/config/...`. v13.33 was read in `~/Sites/bron`, v13.23 in `~/Github/onoma/platform`.
- 'Ran' means the behaviour was executed against that vendor, not only read.

## Transactions, queues, locks

**T1. Do NOT assert: queued jobs, mail or notifications dispatched inside a transaction wait for the commit.** (checklist 8)
- Correct: every shipped connection sets `'after_commit' => false`; `shouldDispatchAfterCommit()` falls back to that flag unless the job is `ShouldQueueAfterCommit` or carries `$afterCommit`. Laravel Cloud managed queues read `CLOUD_QUEUE_AFTER_COMMIT`, false when unset. A worker can run before the row exists, or after a rollback.
- Verified at framework v13.33 `config/queue.php:44,53,64,80`, `Queue/Queue.php:398-409`, `Foundation/CloudBootstrapper.php:225`; v13.23 `Queue/Queue.php:396`; laravel/laravel 13.x skeleton `config/queue.php:44,53,64,73`.

**T2. Do NOT assert: `lockForUpdate()` protects a read-then-write on its own.** (checklist 7)
- Correct: it appends `for update` and forces the write PDO, nothing more. Outside `DB::transaction()` the row lock ends with the statement (engine autocommit). SQLite compiles no lock at all, so a race test on a SQLite suite proves nothing.
- Verified at framework v13.33 `Database/Query/Builder.php:3397-3416`, `Database/Query/Grammars/SQLiteGrammar.php:31-34`. Ran on SQLite: `select * from "invites" where "id" = ?`.

**T3. Do NOT assert: `createOrFirst()`, `firstOrCreate()` or `updateOrCreate()` is race-safe by itself.** (checklists 6, 23)
- Correct: `createOrFirst()` inserts and selects only after a `UniqueConstraintViolationException`; `firstOrCreate()` and `updateOrCreate()` both end in it. No unique index on the `$attributes` columns: concurrent calls insert duplicates. A unique index on other columns: the select finds nothing and it rethrows.
- Verified at framework v13.33 `Database/Eloquent/Builder.php:733-758,767-774`; v13.23 `:710-735`. Ran without an index: two rows.

**T4. Do NOT assert: `Cache::lock()` serializes work across processes on the `array` store, or expires on its own.** (checklist 7)
- Correct: `ArrayLock` writes to the `$locks` property of this process's store. The TTL you pass is the only expiry; a Redis lock with `$seconds = 0` is a bare `SETNX`. The base `Lock::refresh()` throws; concrete stores override it.
- Verified at framework v13.33 `Cache/ArrayStore.php:28,286-289`, `Cache/ArrayLock.php:36-50`, `Cache/RedisLock.php:34-41`, `Cache/Lock.php:147-150`.

**T5. Do NOT assert: a `ShouldBeUnique` lock expires by default, or that every 13.x release checks the owner on release.** (checklists 7, 10)
- Correct: `uniqueFor` defaults to 0, a lock with no TTL, so a killed worker leaves it held. v13.33 stores `uniqueLockOwner` and releases through `restoreLock()`; v13.23 has no owner token and force-releases.
- Verified at framework v13.33 `Bus/UniqueLock.php:39-58,67-86`; v13.23 `Bus/UniqueLock.php:55-62` (`forceRelease()`, no `uniqueLockOwner`).

**T6. Do NOT assert: `defer()` always runs after the response, or that its exceptions surface.** (checklists 18, 19)
- Correct: HTTP runs deferred callbacks in `terminate` only when the status is below 400, unless `->always()`; commands only on exit code 0; queued jobs only when the attempt succeeded. Each callback runs inside `rescue()`: reported, never rethrown. No retry, no durability.
- Verified at framework v13.33 `Foundation/Http/Middleware/InvokeDeferredCallbacks.php:32-37`, `Foundation/Providers/FoundationServiceProvider.php:215-225`, `Support/Defer/DeferredCallbackCollection.php:45-56`, `Foundation/helpers.php:799-810`.

**T7. Do NOT assert: `Context::addHidden()` keeps a secret out of the queue.** (checklist 5)
- Correct: visible context lands in every log record's `extra`. Hidden context stays out of logs but is serialized into every queued job payload under `illuminate:log:context`, so it sits in the jobs table or Redis.
- Verified at framework v13.33 `Log/Context/ContextLogProcessor.php:18-29`, `Log/Context/ContextServiceProvider.php:43-55`, `Log/Context/Repository.php:639-655`.

## Request, middleware, validation

**T8. Do NOT assert: the `url` rule (or any non-implicit rule) rejects an empty string.** (checklists 18, 22)
- Correct: a string that trims to `''` skips every rule outside `$implicitRules`. Over HTTP, global `TrimStrings` and `ConvertEmptyStringsToNull` turn it into `null` first, so `url` fails unless `nullable`. MCP tool arguments are decoded from the raw body and validated with `Validator::validate($this->all())`, Livewire requests skip both middleware, and hand-built `Validator::make()` arrays never pass through them: in all three `''` passes.
- Verified at framework v13.33 `Validation/Validator.php:207-232,844-852`, `Foundation/Configuration/Middleware.php:461-462`; laravel/mcp v1.0.0 `src/Server/Transport/HttpTransport.php:45`, `src/Request.php:86-89`; livewire v4.4.5 `src/Mechanisms/HandleRequests/HandleRequests.php:81-90`. Ran: `''` and `'  '` pass `url`, `null` fails, `nullable|url` passes.

**T9. Do NOT assert: `$request->has('x')` is false once `ConvertEmptyStringsToNull` nulls `x`.** (checklist 18)
- Correct: `has()` is `Arr::has()` on the input, true for a present key holding `null`. `filled()` is the check that treats `''`, whitespace and `null` as empty.
- Verified at framework v13.33 `Support/Traits/InteractsWithData.php:52-59,106-111,236-241`; used by `Http/Concerns/InteractsWithInput.php:16`.

**T10. Do NOT assert: cookies, `Cookie::queue()` or the session work on `api` routes.** (checklist 18)
- Correct: the `api` group is `EnsureFrontendRequestsAreStateful` (only with `statefulApi()`), `throttle:` (only with a limiter), `SubstituteBindings`. Queued cookies reach the response only through `AddQueuedCookiesToResponse`, which is in `web`. With `statefulApi()`, Sanctum adds the cookie and session stack only when `Referer` or `Origin` matches `sanctum.stateful`; server-to-server and mobile calls get none.
- Verified at framework v13.33 `Foundation/Configuration/Middleware.php:485-499`, `Cookie/Middleware/AddQueuedCookiesToResponse.php:38`; sanctum v4.3.1 `src/Http/Middleware/EnsureFrontendRequestsAreStateful.php:48-56,73-91`.

**T11. Do NOT assert: Laravel trusts all proxies by default, or that proxy trust lives in `CloudBootstrapper`.** (checklists 5, 18)
- Correct: with no configured proxies, `TrustProxies` trusts `*` only when `LARAVEL_CLOUD=1` or the host ends in `.on-forge.com` / `.on-vapor.com` (those two also drop `X-Forwarded-Host`). Elsewhere behind a load balancer or Cloudflare, `$request->ip()` is the proxy: guest throttles share one `domain|ip` bucket and audit logs record the proxy. `CloudBootstrapper` has no proxy code. Where `*` applies, every hop is trusted and `$request->ip()` is the leftmost `X-Forwarded-For` entry (`security-auth.md`, Proxies).
- Verified at framework v13.33 `Http/Middleware/TrustProxies.php:66-80`, `Support/helpers.php:233-237`, `Routing/Middleware/ThrottleRequests.php:224-230`; grep of `Foundation/CloudBootstrapper.php` for proxy: none. v13.23 `TrustProxies.php:72` same.

**T12. Do NOT assert: `ThrottleRequests` is hoisted above auth, or that route order decides it.** (checklist 18)
- Correct: `SortedMiddleware` reorders only middleware in `$middlewarePriority`, and `AuthenticatesRequests` sits above `ThrottleRequests`, so `throttle:api` from the group runs after a route's `auth:sanctum` and keys by user. A guard middleware outside the map (a custom class not implementing `AuthenticatesRequests`) is not moved: throttle runs first and keys by IP.
- Verified at framework v13.33 `Foundation/Http/Kernel.php:103-115`, `Routing/SortedMiddleware.php:33-60`, `Auth/Middleware/Authenticate.php:11`. Ran: `[throttle:api, SubstituteBindings, auth:sanctum]` sorts to `[auth, throttle, SubstituteBindings]`; with a custom guard, order unchanged.

**T13. Do NOT assert: CSRF protection covers GET, or that a feature test proves it.** (checklists 2, 14)
- Correct: `PreventRequestForgery` passes `HEAD`, `GET`, `OPTIONS`, any request with `Sec-Fetch-Site: same-origin`, and every request while running unit tests. A state-changing GET route has no CSRF check. `VerifyCsrfToken` is a deprecated subclass of `PreventRequestForgery`.
- Verified at framework v13.33 `Foundation/Http/Middleware/PreventRequestForgery.php:95-111,120-133,143-160`, `Foundation/Http/Middleware/VerifyCsrfToken.php:6-8`.

## Authorization

**T14. Do NOT assert: `make:request` stopped generating `authorize()`.** (checklist 2)
- Correct: the stub generates `authorize(): bool { return false; }`. A Form Request with no `authorize()` method passes authorization. A leftover `return true;` is permission granted to everyone.
- Verified at framework v13.33 `Foundation/Console/stubs/request.stub:13-16`, `Foundation/Http/FormRequest.php:344-353`.

**T15. Do NOT assert: `$this->authorize()` works in an L11+ app controller.** (checklist 2)
- Correct: the skeleton base `Controller` is an empty abstract class with no `AuthorizesRequests`. Use `Gate::authorize()`, `can:` middleware or `#[Authorize]`. Livewire's `Component` does use the trait.
- Verified at laravel/laravel 13.x `app/Http/Controllers/Controller.php`; framework v13.33 `Foundation/Auth/Access/AuthorizesRequests.php:21`, `Routing/Attributes/Controllers/Authorize.php`; livewire v4.4.5 `src/Component.php:30`.

**T16. Do NOT assert: a `Gate::before` returning `false` falls through to the policy.** (checklists 1, 2)
- Correct: any non-null result from a before callback is final: `false` denies every ability. Return `null` to fall through. Before callbacks and policy methods run for a guest only when the user parameter is nullable; otherwise a guest is denied.
- Verified at framework v13.33 `Auth/Access/Gate.php:437-443,463-480,558-569`.

**T17. Do NOT assert: a nested route like `/teams/{team}/projects/{project}` scopes `{project}` to `{team}`.** (checklist 1)
- Correct: implicit binding resolves the child through the parent only with `->scopeBindings()` or a custom key (`{project:slug}`). Otherwise any project id resolves, whoever owns it.
- Verified at framework v13.33 `Routing/ImplicitRouteBinding.php:42-56`, `Routing/Route.php:1316,1340-1343`.

**T18. Do NOT assert: `exists` or `unique` respects the model's global scopes or soft deletes.** (checklists 1, 3)
- Correct: `Rule::exists(Project::class)` resolves the model to a table name and queries `DB::table()`: no tenant scope, soft-deleted rows count. Add `->where('team_id', ...)` and `->withoutTrashed()`.
- Verified at framework v13.33 `Validation/Rules/DatabaseRule.php:61-80,184`, `Validation/DatabasePresenceVerifier.php:121-124`.

**T19. Do NOT assert: `tokenCan()` is false for a scope the session user was never granted.** (checklist 2)
- Correct: a session-authenticated user under Sanctum, or Passport's `CreateFreshApiToken`, carries a `TransientToken` whose `can()` returns true for every ability. `tokenCan()` alone never gates a first-party SPA.
- Verified at sanctum v4.3.1 `src/Guard.php:32-37`, `src/TransientToken.php:15-18`; passport v13.8.0 `src/TransientToken.php:12-15`.

**T20. Do NOT assert: Passport ignores an unregistered scope, or that `Mcp::oauthRoutes()` keeps `mcp:use` registered whatever runs later.** (checklist 18)
- Correct: `getScopeEntityByIdentifier()` returns null for an unknown scope and league throws `invalid_scope`. `Passport::tokensCan()` replaces the whole scope map, so a later call without `mcp:use` drops the scope `oauthRoutes()` added.
- Verified at passport v13.8.0 `src/Bridge/ScopeRepository.php:26-29`, `src/Passport.php:250-253,285-288`; league/oauth2-server 9.4.1 `src/Grant/AbstractGrant.php:259-278`; laravel/mcp v1.0.0 `src/Server/Registrar.php:124-127,198-212`.

**T21. Do NOT assert: a client-credentials token has a null `oauth_user_id`.** (checklists 2, 4)
- Correct: league sets the JWT `sub` to the user id, or the client id when there is no user, and Passport reads `oauth_user_id` from `sub`. A predicate `oauth_user_id === null` never matches a client-credentials request; Passport's own checks compare it with `oauth_client_id`.
- Verified at league/oauth2-server 9.4.1 `src/Entities/Traits/AccessTokenTrait.php:108-111` (same at 9.3.0); passport v13.8.0 `src/Guards/TokenGuard.php:144-148`, `src/Http/Middleware/EnsureClientIsResourceOwner.php:19-24`.

## Eloquent and schema

**T22. Do NOT assert: `wasChanged()` is true after an insert.** (checklist 19)
- Correct: `performInsert()` never calls `syncChanges()`; `performUpdate()` does. Use `$model->wasRecentlyCreated || $model->wasChanged()`.
- Verified at framework v13.33 `Database/Eloquent/Model.php:1542,1602-1644`; v13.23 `:1518,1578`. Ran: false after `create()`, true after an update.

**T23. Do NOT assert: `Model::query()->update()`, `delete()` or `upsert()` fire model events, touch parents or honour `$fillable`.** (checklists 7, 19)
- Correct: all three go through `toBase()`. Global scopes apply; events, `$touches`, casts and mass-assignment guards don't. Parent touches come only from `Model::finishSave()`.
- Verified at framework v13.33 `Database/Eloquent/Builder.php:1303-1306,1316-1334,1541-1548,2071-2074`, `Database/Eloquent/Model.php:1499-1508`.

**T24. Do NOT assert: new pivot columns load without `withPivot()`, or that `attach()` fires pivot events.** (checklist 22)
- Correct: the relation selects the two keys plus `$pivotColumns` only. `attach()` without `->using(CustomPivot::class)` inserts through the query builder: no pivot model, no events.
- Verified at framework v13.33 `Database/Eloquent/Relations/Concerns/InteractsWithPivotTable.php:336-345,694-701`, `Database/Eloquent/Relations/BelongsToMany.php:1004-1012`.

**T25. Do NOT assert: `->online()` works in a default Postgres migration.** (checklist 17)
- Correct: `->online()` compiles `create index concurrently`, and Postgres migrations run inside a transaction unless the migration sets `public $withinTransaction = false;`. Postgres refuses `CONCURRENTLY` in a transaction (engine rule). MySQL and SQLite migrations aren't wrapped: a failed MySQL migration keeps the DDL that ran.
- Verified at framework v13.33 `Database/Schema/Grammars/PostgresGrammar.php:18,341-343,386`, `Database/Migrations/Migration.php:19`, `Database/Migrations/Migrator.php:448-451`, `Database/Schema/Grammars/Grammar.php:31`.

## Cache, HTTP client, tooling

**T26. Do NOT assert: cached objects unserialize after an L13 upgrade without config.** (checklists 15, 16)
- Correct: the 13.x skeleton ships `'serializable_classes' => false`, so every store unserializes objects as `__PHP_Incomplete_Class` unless the class is listed. An app whose `config/cache.php` lacks the key falls back to `null`: no restriction. The `array` store serializes only with `'serialize' => true`, so a test on the default array cache never sees it.
- Verified at laravel/laravel 13.x `config/cache.php:134`; framework v13.33 `Cache/CacheManager.php:184-190,471-474`, `Cache/RedisStore.php:534`, `config/cache.php:37-40`.

**T27. Do NOT assert: `Http::fake()` intercepts every outbound HTTP call in a test.** (checklists 12, 25)
- Correct: it stubs the handler stack of Laravel's `PendingRequest`. SDKs with their own client bypass it: stripe-php sends through `CurlClient` unless you call `ApiRequestor::setHttpClient()`. Swap the SDK behind a contract, or fake at its client.
- Verified at framework v13.33 `Http/Client/PendingRequest.php:1768`, `Http/Client/Factory.php:331,428`; stripe/stripe-php 17.6.0 `lib/ApiRequestor.php:661,689-693`.

**T28. Do NOT assert: Pint's `laravel` preset leaves union-type spacing alone.** (checklist 24)
- Correct: it enables `types_spaces` with php-cs-fixer's default `space: none`: `int|string`, never `int | string`.
- Verified at laravel/pint v1.32.1, inside the phar: `resources/presets/laravel.php:255`, `vendor/friendsofphp/php-cs-fixer/src/Fixer/Whitespace/TypesSpacesFixer.php` (`setDefault('none')`).

**T29. Do NOT assert a Passport 13 composer constraint from memory.** (checklist 23)
- Correct: `php ^8.2`, `illuminate/* ^11.35|^12.0|^13.0`, `league/oauth2-server ^9.2`, `firebase/php-jwt ^6.4|^7.0`.
- Verified at passport v13.8.0 `composer.json:17-30`.

**T30. Do NOT assert that `ShouldHandleEventsAfterCommit` defers a queued listener.** (checklist 8)
- Correct: it defers synchronous listeners only. A queued listener opts in with `implements ShouldQueueAfterCommit` or `public $afterCommit = true`; see queues-concurrency.md.
- Verified at framework v13.33 `Events/Dispatcher.php:536-537` (queued listeners return here), `:604-609` (the after-commit check, reached only by synchronous listeners), `:742-745` (queued job options).
