# Queues and concurrency

What to check on transactions, queued work, retries, locks, `defer()` and cache primitives. Checklist items 6-10, and 19 for swallowed failures. Trap entries (T-numbers) are in `framework-traps.md`.

Paths: framework relative to `vendor/laravel/framework/src/Illuminate/`, read at v13.33 (bron) unless marked v13.23 (onoma/platform). Horizon read at v5.47.2 (onoma/platform only). Re-find each symbol in the asker's vendor.

## The race review (checklist 6)

1. Name the invariant: one invite per email per team, one charge per order, balance never negative.
2. Find what enforces it: a unique index (`php <repo>/artisan db:table <table>` prints indexes), a row lock inside a transaction, or an atomic cache lock. A check-then-insert in PHP enforces nothing.
3. Construct the interleaving: request A reads, request B reads, both write. Say which line each one passes.
4. Fix, in order of preference: unique constraint plus `createOrFirst()` (T3); `DB::transaction()` with `lockForUpdate()` on the row that guards the invariant (T2); `Cache::lock()` on a shared store (T4) when there is no row to lock.
5. Test: run the second insert or the second request and assert one row or one effect. A SQLite suite can't show a row-lock race (T2); say so and test the constraint instead.

Smell: `if (! Invite::where(...)->exists()) Invite::create(...)`. Right way: `$table->unique(['team_id', 'email'])` after checking existing rows for duplicates, then `createOrFirst()`.

## Queued work and the transaction (checklists 8, 9)

- Default: not after commit (T1). Read the connection in the asker's `config/queue.php` before flagging, and the job, mail, notification or listener for its own opt-in.
- Opt-ins, any one is enough:
  - dispatch or job: `->afterCommit()` sets `$afterCommit = true` (`Bus/Queueable.php:228-243`).
  - job, mailable, notification: `implements ShouldQueueAfterCommit` (`Mail/SendQueuedMailable.php:67-70`, `Notifications/SendQueuedNotifications.php:105-108`).
  - queued listener: `implements ShouldQueueAfterCommit` or `public $afterCommit = true` (`Events/Dispatcher.php:742-745`). `ShouldHandleEventsAfterCommit` defers synchronous listeners only: a queued listener returns at `:536-537`, before the after-commit check at `:604-609` runs. Event: `ShouldDispatchAfterCommit` (`:297`).
  - connection: `'after_commit' => true`.
- On rollback, pending after-commit dispatches are dropped with the transaction, and a `ShouldBeUnique` job's lock is released (`Queue/Queue.php:435-451`).
- Non-queue side effects (an HTTP call to a payment provider, a webhook, a synchronous mail): `DB::afterCommit(fn () => ...)` (`Database/Concerns/ManagesTransactions.php:354-361`), or write the intent in the transaction and act from an after-commit job.
- Smell: `DB::transaction(fn () => [$order = Order::create(...), $user->notify(new OrderPlaced($order))])` on a default connection. Right way: `->afterCommit()` on the notification, or `ShouldQueueAfterCommit`, following the repo's convention.
- My rationale for why after-commit is opt-in and spans three libraries: `context/quotes.md`, 'Why Laravel works this way'.

## Retries and idempotency (checklist 10)

- A released job comes back as another attempt: the Redis pop script increments `attempts` (`Queue/LuaScripts.php:103`). `WithoutOverlapping` releases with `releaseAfter = 0` by default, burning tries quickly (`Queue/Middleware/WithoutOverlapping.php:57,71-86`).
- `retry_after` defaults to 90 seconds (`config/queue.php:43,51,78`); after it, Redis moves a reserved job back to the queue (`Queue/RedisQueue.php:561-564`). A job running past `retry_after` runs twice at once. Horizon's supervisor default `timeout` is 60 (horizon v5.47.2 `config/horizon.php:210`). Rule: worker timeout below `retry_after`, with margin.
- Queue attributes exist at v13.23 and v13.33: `#[Tries]`, `#[Backoff]`, `#[Timeout]`, `#[FailOnTimeout]`, `#[UniqueFor]`, `#[DebounceFor]`, `#[DeleteWhenMissingModels]`, `#[WithoutRelations]`, `#[MaxExceptions]` (`Queue/Attributes/`). Property or attribute: follow the repo.
- Idempotency, in order: a unique constraint on the effect (ledger row keyed on order id), an idempotency key sent to the provider, `ShouldBeUnique` for dedupe at dispatch time. Uniqueness is not idempotency: it stops a second dispatch, not a retry of the first.
- Smell: a job with `$tries = 3` that charges a card, and a timeout after the provider call. Right way: key the charge on the order, skip when it exists, and pass the provider an idempotency key.

## Unique jobs and overlap (checklists 7, 10)

- `ShouldBeUnique` holds the lock until the job finishes, and keeps it across `release()`; `ShouldBeUniqueUntilProcessing` drops it when processing starts. `Queue/CallQueuedHandler.php:91-93,140-152`.
- `uniqueFor` defaults to 0: no TTL (T5). Set `uniqueFor` or `#[UniqueFor]` so a killed worker doesn't block dispatch forever.
- Owner-checked release is v13.33 only (T5). On v13.23 a stale job can release a newer job's lock. My fix and the revert before it: #60906 after #60905 (`framework-rationale.md`).
- `WithoutOverlapping` has `expiresAfter = 0` by default (`WithoutOverlapping.php:57`): a worker killed mid-job leaves the lock. Set `->expireAfter()`.
- `uniqueVia()` picks the lock store (`Bus/UniqueLock.php:43-45`). On the `array` store uniqueness holds per process (T4).

## Locks (checklist 7)

- Row lock: read and write inside one `DB::transaction()`, lock the row that guards the invariant, in the same order across code paths to avoid deadlocks.
- Cache lock: shared store (Redis, database), TTL longer than the guarded work's timeout. For long work: short TTL plus `$lock->refresh()` per unit (`Cache/RedisLock.php:49-56`; database and file locks implement it too), not one long TTL that outlives a crash.
- `block($seconds)` waits; `get()` returns false at once (`Cache/Lock.php:90,114`). Check which one the caller handles.
- Smell: `Cache::lock('import')->get()` with `CACHE_STORE=array` in production config. Right way: a Redis or database lock store.

## Post-response and parallel work (checklists 18, 19)

- `defer()`: same process, after the response, only on success, errors reported and swallowed (T6). A queued job when the work must happen, needs retries or must be visible. `->always()` runs it on error responses too.
- `Cache::flexible($key, [$fresh, $stale], fn)`: within `$fresh` returns the cached value; between the two, returns stale and schedules a refresh with `defer()` under a cache lock; past `$stale` the key has expired and the request computes synchronously. `Cache/Repository.php:652-689`. Refresh inherits `defer()`'s conditions.
- `Concurrency::run()`: default driver `process` (`config/concurrency.php:18`) serializes each closure and runs it through an `invoke-serialized-closure` Artisan process (`Concurrency/ProcessDriver.php:36-44`). Each task boots the app. Worth it only when the parallel work outweighs that.
- `once()`: memoizes per calling object instance and arguments for the request or job (`Support/helpers.php:249-257`). `Cache::memo()`: a scoped, memoized repository over a store, one per execution (`Cache/CacheManager.php:89-97`).
- Smell: `defer(fn () => $invoice->sendToAccounting())` for work the customer relies on. Right way: a queued job, after commit.

## Swallowed and overwritten (checklist 19)

- `catch (Throwable) { return []; }` feeding `Cache::put()`: an outage overwrites the last good value. Keep the old value on failure, or cache only successful results.
- Laravel's HTTP client doesn't throw on 4xx or 5xx (`Http/Client/PendingRequest.php:271`). A job that ignores `$response->failed()` completes green and does nothing.
- Deferred callbacks and `Cache::flexible` refreshes fail into `report()`, not into the response (T6). Check the error tracker, not the status code.

## Horizon (onoma/platform v5.47.2)

- Supervisor defaults: `balance => auto`, `maxTime => 0`, `tries => 1`, `timeout => 60` (`config/horizon.php:203-210`). `tries => 1` means one failure is final unless the job sets its own.
- Horizon supervises Redis connections (`config/horizon.php:201`). `Queue::fake()` never touches it; worker behaviour needs a real Redis run or a reading of the job and config.
