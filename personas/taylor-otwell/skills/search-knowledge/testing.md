# Testing

What to check in the tests that come with a diff: does the test fail without the fix, does it go through the route and the database, does it prove the denied case, and what each fake hides. Checklist items 11-14. Trap entries (T-numbers) are in `framework-traps.md`.

Paths: framework relative to `vendor/laravel/framework/src/Illuminate/`, read at v13.33 (bron); pestphp/pest v5.0.3 (bron). Re-find each symbol in the asker's vendor.

## The four questions, in order

1. **Red without the fix?** (checklist 11) Run the new test against the pre-fix code in a scratch copy: the procedure, with the copied `vendor/`, is in `context/hands-off-the-askers-tree.md`. A test that passes on the old code is a blocking defect for the verdict tier. Can't run it: name the line of the fix the test exercises, or say it proves nothing.
2. **Through the route?** (checklist 12) Post to the route, assert database state, dispatched jobs, sent notifications, the response. A mock is for an external boundary (payment provider, AWS, a third-party API), swapped through the container.
3. **The other direction?** (checklist 13) An authorization fix needs the stranger: another team's user gets 403 or 404. Seed ids that can't coincide (user 7 on team 3, not user 1 on team 1), or a wrong join passes.
4. **Real time, real engine?** (checklist 14) No `sleep()`. Read `<repo>/phpunit.xml` for `DB_CONNECTION` before judging SQL.

## What each fake and test default hides (checklists 11, 18)

| Mechanism | What it hides | Read |
|---|---|---|
| `Queue::fake()`, `Bus::fake()` | records the push the moment `dispatch()` runs, before and regardless of commit; no serialization unless `serializeAndRestore()` | `Support/Testing/Fakes/QueueFake.php:653-680,876-889` |
| `Notification::fake()`, `Mail::fake()` | same: no after-commit handling in the fakes | grep `afterCommit` in `Support/Testing/Fakes/`: none |
| `Event::fake()` | honours `ShouldDispatchAfterCommit`, unlike the queue fakes | `Support/Testing/Fakes/EventFake.php:367-369` |
| `QUEUE_CONNECTION=sync` | the job runs inline inside the open transaction and sees uncommitted rows | `Queue/SyncQueue.php:195-207` |
| `RefreshDatabase` / `DatabaseTransactions` | the wrapping transaction doesn't count: after-commit callbacks run when the app's own transaction commits, as in production | `Foundation/Testing/DatabaseTransactionsManager.php:32-40,49-63` |
| CSRF | skipped whenever unit tests run (T13) | `Foundation/Http/Middleware/PreventRequestForgery.php:95-111,130-133` |
| `Http::fake()` | only Laravel's HTTP client; SDKs with their own client go out for real (T27). `Http::preventStrayRequests()` turns a real call into a failure | `Http/Client/Factory.php:331,428` |
| `array` cache | no serialization by default, so `serializable_classes` problems never show (T26) | `Cache/CacheManager.php:184-190` |
| SQLite suite | no row locks (T2), no transactional DDL (T25), no `ALTER TABLE ... ADD CONSTRAINT` (engine) | see `migrations-deploy.md` |
| `Livewire::test()` | middleware disabled on updates | `livewire.md`, Tests |
| `defer()` in feature tests | runs after the response, because the test kernel calls `terminate`; `withoutDefer()` runs callbacks immediately | `Foundation/Testing/Concerns/MakesHttpRequests.php:642`, `Concerns/InteractsWithContainer.php:258-275` |

Consequence for review: after-commit handling lives in `Queue::enqueueUsing()` (`Queue/Queue.php:368-380`), which the fakes replace, so under `Queue::fake()` an after-commit job and a plain one are both recorded at `dispatch()`, even when the transaction rolls back. The fake can prove the flag, `Queue::assertPushed(SendInvoice::class, fn ($job) => $job instanceof ShouldQueueAfterCommit || $job->afterCommit === true)`, not the behaviour. For the behaviour, argue from the job, the connection config and T1.

## Mocks versus fakes (checklist 12)

- Smell: `$this->mock(PaymentGateway::class)->shouldReceive('charge')->once()` and nothing else asserted. Right way: bind a fake gateway through the container, post to the route, assert the order row and the charge recorded on the fake.
- A contract at a system boundary that a test swaps is a reason to keep the contract (checklist 25). Before suggesting `Http::fake()` instead, read whether the SDK sends through Laravel's client (T27).
- Testing framework behaviour ('it validates the email field is an email') is noise unless the rule is the change.
- A unit test for a pure calculation is fine (`context/decisions.md`, Open Questions).

## Time (checklist 14)

- `$this->travel(5)->minutes()`, `$this->travelTo($date)`, `$this->freezeTime()` (`Foundation/Testing/Concerns/InteractsWithTime.php:18,46,61`).
- Expiry tests travel past the boundary and one second before it.
- A test depending on `now()` near midnight or month end flakes; freeze time.

## Open holes: pin, don't hide (checklist 13)

- A known over-grant keeps its denied expectation and is pinned with Pest `->todo()` (`src/PendingCalls/TestCall.php:432`) until the fix lands. Never an assertion that the hole is open, green.
- A crash characterization pins current behaviour and says so in its name.

## Pest 5 facts

- Requires PHP `^8.4` and PHPUnit `^13.2.6` (`composer.json:20,28`). An app on PHP 8.3 can't take it: check `composer.lock` and the platform before recommending an upgrade. PHPUnit suites remain valid; follow the repo.
- Tia (test impact analysis) runs with `--tia` and selects tests from recorded dependencies (`src/Plugins/Tia.php:43-57`). A green `--tia` run is not a full-suite run; ask for the full run before a MERGE on a change to shared code.
- `->fails()`, `->throws()`, `->skip()` exist on `TestCall` (`src/PendingCalls/TestCall.php:114,122,239`). A `->skip()` added in the same diff as the fix is a finding until explained.

## Test names and claims (checklist 20)

- `it_rejects_expired_tokens` that never expires a token proves nothing about expiry.
- A test named for the fix that asserts on a mock proves the mock.
- A commit claiming '1081 tests pass' is a claim; the new test's red run is the evidence.

## When the suite shares a database

- If `phpunit.xml` points at a server database, running tests from a scratch copy shares the asker's test database. Give the command, mark the check unrun, argue from the line the test exercises (`context/hands-off-the-askers-tree.md`).
