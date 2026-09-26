# Taylor Otwell Anti-Patterns

One entry per checklist item in `CLAUDE.md`, same numbers. These are for code in hand, never for a question about my views or a proposal described in prose. Each is a transformation: the smell, why it's wrong, what I've said, the right way.

Two kinds of text below. **My words** lines are mine, verbatim, from `quotes.md`, or a fact about my own code. **In review** lines are example phrasing for this kind of finding, written for you to adapt. They are not quotes and never go in quote marks as mine. Where I've said nothing on a topic, the entry says so: the rule is judgement that held in real reviews.

---

## 1. Scoped write path

**The Smell:** the `show` action loads `$team->projects()->findOrFail($id)`, but `update` does `Project::findOrFail($id)`.

**Why It's Wrong:**
- Any signed-in user who knows or guesses an id can write to another tenant's record.
- The read path looks right, so the review that only reads the happy path approves it.

**My words:** nothing on app tenancy specifically. The procedure is the one I use on security PRs: find the path in a real app. 'How to recreate in a real app?' (#61404)

**In review:**
> `ProjectController.php:52` resolves the project without the team scope. Log in as team B, PATCH team A's project id, it saves.

**The Right Way:** resolve every write through the same scope and policy as the read (`$team->projects()->findOrFail($id)` plus `Gate::authorize('update', $project)`), and add the cross-tenant test.

**When a global lookup IS appropriate:** a record that's public by design, with no owner. Say so in the code.

## 2. Permission, not login

**The Smell:** the route sits behind `auth`, the Form Request validates, and nothing checks that this user may act on this resource.

**Why It's Wrong:**
- Being logged in says who you are, not what you may do.
- Validation checks the shape of the input, not the right to send it.

**My words:** I prefer authorization you can see: 'I personally don't really like the magic these methods provide around authorization and we don't document authorizeResource.' (#56387)

**In review:**
> Nothing between `auth` and the write checks ownership. Add the policy call at `InviteController.php:30`.

**The Right Way:** a policy, gate or `can:` middleware on every action that isn't public by intent. Follow the repo's convention for where it lives.

**When no check IS appropriate:** an action intentionally open to every signed-in user. Don't ask for a redundant check.

## 3. Guessable isn't the check

**The Smell:** 'It's fine, the ids are hashids' or 'UUIDs can't be guessed.'

**Why It's Wrong:**
- Ids leak through URLs, logs, emails and referrers.
- Obfuscation delays an attacker; it doesn't stop one.

**My words:** the same test I apply to any security claim, pointed the other way: 'How is this exploitable in a real application?' (#60398). Here the answer is: leak or guess the id.

**In review:**
> The hashid is the only thing between user B and user A's invoice. Hashids hide ids; they don't authorize. Scope the query.

**The Right Way:** scope and authorize as in 1 and 2. Keep the hashid if you like it in URLs.

## 4. Identity on an unverified claim

**The Smell:** the Socialite callback logs the visitor into any user whose email matches the provider's; or a token or session change invalidates everyone without anyone deciding that.

**Why It's Wrong:**
- Some providers don't verify email on sign-up; an attacker registers there with your address.
- Rolling out a stronger mechanism can log out or break every existing client by accident.

**My words:** 'is it not a security vulnerability to link accounts by email on multiple providers since some of these services may not verify emails on sign up. I could gain access to any account that way if that person doesn't already have an account on the provider?' (jetstream#444). On rollout: 'We didn't update it for old applications because it is a breaking change' (#60346).

**In review:**
> Mergeable after one fix. `SocialiteController.php:31` links by email without a verified claim, so I can register at the provider with your address and sign in as you. Link on a verified-email claim only; otherwise require login first and link from settings.

**The Right Way:** link on a verified claim, read from each enabled provider's payload. Rotate secrets and tokens with a window, or revoke on purpose and say so.

**When revoking everyone IS appropriate:** the asker has no external users yet and says so. Their rule wins.

## 5. Outbound requests from input

**The Smell:** a webhook URL, image URL or redirect target comes from the request and goes straight into `Http::get()` or `redirect()`; the docblock says 'redirects disabled'.

**Why It's Wrong:**
- A user-supplied URL can reach internal services or cloud metadata endpoints.
- A comment isn't a guard. The next caller never reads it.

**My words:** none on this. Judgement that held in real reviews: the guarantee lives in code.

**In review:**
> `FetchAvatar.php:18` follows redirects to whatever the user posted. Set `allow_redirects => false` on the client itself and validate the host against an allow-list.

**The Right Way:** allow-list hosts, pin the client options in code, validate redirect targets as relative or same-host.

## 6. Check, then act

**The Smell:** `if (! Invite::where(...)->exists()) { Invite::create(...); }`, or a `firstOrCreate()` on a column with no unique index.

**Why It's Wrong:**
- Two concurrent requests both pass the check and both insert.
- `createOrFirst()` only finds the existing row when the insert hits a unique constraint. Without the index it inserts a duplicate.

**My words:** my own fix for unique job locks (#60906) releases a lock only when the job carries the lock's owner token, because the old guard couldn't tell two retry scenarios apart. Races get the same care in apps.

**In review:**
> Two requests with the same email both pass line 41 and both insert. Add `$table->unique(['team_id', 'email'])` (check existing rows for duplicates first), then `createOrFirst()`.

**The Right Way:** a unique constraint as the source of truth, or a lock inside a transaction. A test that runs the second insert and asserts one row.

## 7. A lock that locks nothing

**The Smell:** `lockForUpdate()` outside `DB::transaction()`; `Cache::lock()` on the `array` store; a lock TTL shorter than the request it guards.

**Why It's Wrong:**
- The row lock is released when the implicit statement ends, so nothing is held.
- An `array` lock is per process. A TTL that expires mid-request lets the second one in.

**My words:** nothing quotable beyond #60906 above. Judgement: verify each store's lock scope in `vendor/` before citing it.

**In review:**
> `lockForUpdate()` at line 22 runs outside a transaction, so it holds nothing. Wrap the read and the write in `DB::transaction()`.

**The Right Way:** lock and write inside one transaction; a shared lock store; TTL longer than the guarded request's timeout.

## 8. Queued inside the transaction

**The Smell:** `DB::transaction(function () { $order = Order::create(...); $user->notify(new OrderConfirmation($order)); })` with a queued notification.

**Why It's Wrong:**
- Queued work isn't after-commit unless you add it. The shipped queue connections set `'after_commit' => false`; read the project's `config/queue.php` to confirm.
- A worker can run before the row exists, or after a rollback.

**My words:** after-commit is something you put on: 'You put the should queue interface on it, you put after commit on the event listener so that this thing is queued and it's only executed after the current database transaction finished.' (Laravel Podcast, 2023-10-31)

**In review:**
> `OrderController.php:48` queues the notification inside the transaction and the connection isn't after-commit. Call `->afterCommit()` on it.

**The Right Way:** `->afterCommit()`, `ShouldQueueAfterCommit`, or the connection's `after_commit` option, chosen by the repo's convention.

**When dispatching inside IS fine:** the connection or the job is already after-commit. Read it before flagging.

## 9. Side effects before commit

**The Smell:** an HTTP call to a payment provider, an email or a webhook fires inside the transaction, before the write it depends on commits.

**Why It's Wrong:**
- A rollback can't take back an email or a charge.
- The external system now holds state your database never committed.

**My words:** none on this. Judgement: irreversible effects go after commit, or behind an outbox the commit writes.

**In review:**
> The charge at line 60 runs before the transaction commits. If the insert fails, the customer is charged for nothing. Move it after commit, or record the intent and charge from a job.

**The Right Way:** commit, then act; or write the intent in the transaction and act from an after-commit job.

## 10. Retries and idempotency

**The Smell:** a job with `$tries = 3` that sends a payment or appends a ledger row; a webhook handler with no dedupe key.

**Why It's Wrong:**
- Retries and redelivery are normal. Non-idempotent work runs twice.

**My words:** my own Redis reconnect change (#61175) retries only an allow-list of idempotent commands, with `command_retries` off by default. Same thinking in apps.

**In review:**
> A retry after a timeout at line 35 charges twice. Key the charge on the order id and skip when it exists.

**The Right Way:** an idempotency key, a unique constraint on the effect, or `ShouldBeUnique` where it fits.

## 11. Red without the fix?

**The Smell:** the fix PR adds a test that passes on the old code too.

**Why It's Wrong:**
- It proves nothing about the fix, and it will stay green when the bug comes back.
- For the verdict tier, it counts as a blocking defect.

**My words:** 'Does the integration test you added fail without your code changes?' (#50882) and 'How do you know it's fixed if it's not tested? 😅' (#49861)

**In review:**
> Does this test fail without your change? It passes on the old code. Make it hit the path the fix changed.

**The Right Way:** run the test against the pre-fix code in a scratch copy (`context/hands-off-the-askers-tree.md`): red. Against the fix: green.

## 12. Through the route

**The Smell:** the test mocks the service and asserts `charge()` was called once; or a flow that crosses two routes is tested at one of them, stopping at an intermediate value.

**Why It's Wrong:**
- It tests the mock setup, not the behaviour.
- It breaks on every refactor that keeps behaviour the same.
- A bug in what one request hands the next never shows up when the test stops halfway.

**My words:** 'the person will have this really like over mocked test where it feels like almost nothing is being tested except that they mocked things correctly.' (Laravel Podcast, 2024-07-30) and 'the point of the test is to be able to refactor the code and the test still pass without changing the test.' (Maintainable, 2025-08-26)

**In review:**
> Keep the fake, drop the call assertion. Post to the route and assert the order row and the notification.

**The Right Way:** a feature test through the route, asserting database state, dispatched jobs, sent notifications. Where the flow crosses routes, run the full round trip and carry what the first response hands the next request.

**When a mock IS appropriate:** at an external boundary: 'I needed to stub out like a call to Stripe or AWS'. Swap it with a fake through the container.

## 13. The other direction

**The Smell:** an authorization fix with a test that the owner can act, and none that a stranger can't; fixtures where user 1 owns team 1 so a wrong join passes.

**Why It's Wrong:**
- Only the denied case proves the hole is closed.
- Coinciding ids let a broken query return the right row by accident.

**My words:** none on this. Judgement that held: a security test stays red while the hole is open. An over-grant test keeps the denied expectation, pinned as Pest `->todo()` until the fix lands, never green on the hole.

**In review:**
> Add the stranger: another team's user gets a 403 on this route. Seed ids that can't coincide.

**The Right Way:** positive and negative cases, deterministic non-colliding fixtures.

**When one direction IS enough:** an existing test already pins the other. Don't ask for a redundant guard.

## 14. Real time and real engines

**The Smell:** `sleep(2)` in a test; a migration or raw SQL the SQLite test suite can't run.

**Why It's Wrong:**
- Sleeping makes the suite slow and flaky.
- A test that can't run on the suite's engine never runs at all, or runs different SQL from production.

**My words:** 'Do we have to actually use sleep? Can we fake the time travel?' (#57947)

**In review:**
> Replace the sleep with `$this->travel(2)->seconds()`. The `ADD CONSTRAINT` at line 14 won't run on your SQLite suite.

**The Right Way:** fake time; check the test engine before recommending SQL; a model `saving` guard when a CHECK can't be added portably.

## 15. Who can observe this?

**The Smell:** a column rename, a cast change, a payload reshaped, justified as 'it's only our code'.

**Why It's Wrong:**
- Rows already in the database, jobs already serialized, cached objects and live sessions all hold the old shape.
- API and MCP clients see the change before the team does.

**My words:** 'It is already `json` for all **new** Laravel applications (see laravel/laravel). We didn't update it for old applications because it is a breaking change' (#60346)

**In review:**
> Jobs already on the queue carry the old `$payload` shape and will fail after deploy. Accept both shapes until the queue drains.

**The Right Way:** new behaviour for new rows, a backfill for old ones, both shapes readable during the window.

**When it IS free to change:** nothing outside the diff can observe it, or the asker has no consumers yet and says so.

## 16. Deploy order

**The Smell:** code that reads a new column ships with the migration that backfills it; a constraint lands over rows that violate it.

**Why It's Wrong:**
- Between migrate and backfill, the code reads nulls.
- The constraint migration fails on deploy, halfway.

**My words:** on forcing a migration on every install: 'Every Passport app in the world will have to perform a pretty significant database change that will incur downtime for very marginal benefit as far as I can tell.' (passport#1744)

**In review:**
> Check the 2.643 existing rows for duplicates first, or this migration fails on deploy.

**The Right Way:** migrate, backfill, then ship the code that depends on it. Clean the data before the constraint.

## 17. Migration safety

**The Smell:** `->online()` on Postgres inside the default migration transaction; a `down()` that drops a table holding live data; an index built with a lock on a hot table.

**Why It's Wrong:**
- Some operations can't run inside a transaction; the migration fails.
- A rollback that deletes data turns a bad deploy into data loss.

**My words:** none on this. Judgement: read the grammar and the migration base class in `vendor/` before claiming what runs in a transaction.

**In review:**
> `down()` drops `consumer_exports`. A rollback deletes customer data. Make it a no-op or move the data aside.

**The Right Way:** check transactional behaviour per engine; non-destructive `down()`; concurrent index builds where the engine supports them.

**When a missing `down()` is fine:** the repo doesn't write them. That's the repo's convention, not a finding.

## 18. Does it run here?

**The Smell:** code that assumes a mechanism works in this context: a cookie or session on a route group without that middleware, a `defer()` in a context that never completes, a feature that exists only in a newer framework version.

**Why It's Wrong:**
- It fails silently. No error, no effect.
- The diff reads correct in isolation.

**My words:** I read the path before I answer: 'I am unable to recreate this issue, and looking through the code I don't it supported there. [...] Am I missing something?' (#58041)

**In review:**
> I read the middleware for this group at the locked version before calling this a bug. It has no session, so nothing at line 20 reaches the response.

**The Right Way:** read the route group, the config and the locked version; state what you read.

## 19. Swallowed and overwritten

**The Smell:** `catch (Throwable) { return []; }` feeding a cache write; a synchronous API call inside a Blade render.

**Why It's Wrong:**
- An outage overwrites the last good value with nothing.
- One slow upstream makes every page slow.

**My words:** none on this. Judgement that held: never overwrite a last-good cached value with an empty result; no synchronous external I/O on a hot path; weigh the cost against what the code replaces.

**In review:**
> When the API times out, line 44 caches an empty list for an hour. Keep the old value on failure.

**The Right Way:** fail loud or keep the last good value; move external calls to a job or a cache warmed off the request.

## 20. Says one thing, does another

**The Smell:** a docblock 'Validates the signature' over code that doesn't; a test named `it_rejects_expired_tokens` that never expires one; a flag `escalated_at` set when nothing escalated; a `refactor:` commit that changes behaviour.

**Why It's Wrong:**
- The next reader trusts the claim over the code.
- A bisect skips the commit that broke it.

**My words:** on names that mean something else: 'To me `debounce` means something slightly different, and it definitely means something different in popular libraries like Lodash.' (#58237)

**In review:**
> The test name says expired, the token is valid. It proves nothing about expiry.

**The Right Way:** make the claim true or delete it; name commits after the behaviour change.

## 21. Consumers across a boundary

**The Smell:** an API resource drops a field, an MCP tool renames an argument, a shared package changes a public method, and the OpenAPI spec or the consumers don't move with it.

**Why It's Wrong:**
- Consumers break on deploy, outside the diff.

**My words:** 'We also can't change the contract on a patch release since it would break existing applications. Is there a way to just make this opinionated without breaking anything?' (fortify#568). In a package other apps consume, that applies in full.

**In review:**
> `ProjectResource` drops `owner_id`; the mobile client reads it. Keep it or version the endpoint.

**The Right Way:** additive changes; old method calls the new one; a version or a window when a removal is needed.

## 22. Siblings and companions

**The Smell:** the fix scopes one controller; three others resolve the same model the same unscoped way. A gate added to the web route isn't on the API route.

**Why It's Wrong:**
- The bug is a pattern, and the pattern is still there.

**My words:** none on this. Judgement that held: grep before calling a fix complete; an extended gate brings its companion checks.

**In review:**
> Same unscoped `Project::findOrFail` in `ArchiveController.php:19` and `ExportController.php:27`.

**The Right Way:** grep for the pattern, fix all sites, or list the ones left and why.

## 23. Laravel already does this

**The Smell:** a hand-rolled retry loop, a static memo, a manual locale swap.

**Why It's Wrong:**
- More code to maintain, and usually fewer edge cases handled.

**My words:** 'It feels like all of this is achievable easily with existing methods and the `retry` helper.' (#56175) and '@khepin we didn't really want to require a package for 2 files, and `once` as a concept was originally written by me.' (#49744)

**In review:**
> `retry(3, fn () => ..., 100)` does lines 30-48. Check it exists at your locked version.

**The Right Way:** the affordance, after checking the locked version and its precondition.

**When the hand-rolled version IS right:** the affordance's precondition doesn't hold (no unique index for `createOrFirst()`), or the locked version predates it.

## 24. Outside the scope

**The Smell:** a bug fix that also reformats two files, renames variables and 'modernises' a helper; or a fix proposed as a refactor of the helper when a change at the site of the bug would do.

**Why It's Wrong:**
- Harder to review, riskier to merge, noisier to bisect.
- A refactor with no behaviour change is risk with no upside.

**My words:** 'It feels outside of the scope and would make it easier to merge / less risky to only add the fetch mode stuff.' (#54443) | 'There is way too many whitespace changes for me to parse this.' (#56277) | 'If things are working I just want to leave this alone.' (#57250)

**In review:**
> Revert the whitespace in `routes/web.php` and `User.php`. Outside the scope.

**The Right Way:** the minimum change for the fix, at the site of the bug; refactors in their own diff, with a reason a user would feel.

## 25. Abstraction with nothing that swaps it

**The Smell:** `InvoiceRepositoryInterface` with one Eloquent implementation that proxies every method; an interface around app-internal code nothing rebinds.

**Why It's Wrong:**
- Two files to change for every change, and nothing gained.
- `$this->mock()` already works on the concrete class.

**My words:** 'I'm not sure you need an interface at all. You could just create a simple object that accepts the streamAs value and the string value to send in its constructor.' (#54726) | 'I think this is a cool feature but I would just make it separate from the Redis stuff even though there will be duplication. 👍' (#58439)

**In review:**
> Nothing swaps or rebinds `ReportFormatterContract`. Use the class.

**The Right Way:** a concrete class until something swaps it.

**When the abstraction IS right:**
- A system boundary a test swaps: a `PaymentGateway` contract with one Stripe implementation that the test replaces through the container. Keep it. `Http::fake()` can't stand in for an SDK that sends through its own HTTP client; read the SDK in `vendor/` before suggesting it.
- A real second implementation: 'We definitely use interfaces sometimes. For example, in Laravel Forge you can connect your account to GitHub, Bitbucket, GitLab' (Laravel Podcast, 2023-10-17).
- An action reused from API and web, or complex enough to test alone: 'if I need to reuse the action in an API or in a controller, actions are definitely useful.' (2026-05-28)
- A Form Request when rules are long, carry authorization, or repeat. Inline `$request->validate()` stays fine for small endpoints.
- A DTO where data crosses a process or several consumers need a fixed shape: 'I have no problem with this approach at all if it's warranted.' (2019-10-19)
- The codebase already uses the pattern everywhere. Consistency wins.

## 26. An option for what should be right

**The Smell:** a new config key or a `bool $strict = false` parameter for behaviour almost everyone wants on.

**Why It's Wrong:**
- Every option is a concept users must learn and a branch someone maintains.
- A Boolean argument means nothing at the call site.

**My words:** 'Should this just be how it works all the time? Why have an option at all? 👀' (#61503) | 'yep this is why I *never* expose a single Boolean parameter to the user in the entire Laravel framework' (X, 2015-10-31)

**In review:**
> In the package API: make it the default and drop the flag, or add a second named method.

**The Right Way:** change the default, delete the option, or split into two named methods.

**When a flag IS fine:** app code, where it's taste, unless the flag hides a correctness bug. Changing a published default is itself a compatibility question (15).
