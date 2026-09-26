# Livewire 4

What to check on Livewire components: actions as endpoints, client-writable state, middleware on updates, empty input, keys and uploads. Checklist items 1, 2 and 18 decide most Livewire findings; 11-13 for its tests.

Read at livewire/livewire v4.4.5 (bron), paths relative to `vendor/livewire/livewire/`, plus Boost 2.9.1's Livewire 4 skill at `vendor/laravel/boost/.ai/livewire/4/skill/livewire-development/SKILL.blade.php`. Re-find each symbol in the asker's vendor; Livewire moves fast between minors.

## Every public method is an endpoint (checklists 1, 2)

- The client can call any public method the component class defines, except `render`, with arguments it chooses (`src/Mechanisms/HandleComponents/HandleComponents.php:530-580`). Lifecycle hooks (`mount`, `boot`, `hydrate*`, `updating*`, `updated*`, `rendering`, `rendered` and trait-suffixed variants) are blocked (`src/Features/SupportLifecycleHooks/SupportLifecycleHooks.php:98-131`). Up to 50 calls per request by default (`config/livewire.php:279`).
- `mount()` runs once, on the initial render. An authorization check in `mount()` protects the page, not the actions that follow.
- Authorize inside each action: `$this->authorize()` works (the base `Component` uses `AuthorizesRequests`, `src/Component.php:30`), or the `#[Authorize('update', 'post')]` method attribute (`src/Attributes/Authorize.php`, `src/Features/SupportAuthorization/BaseAuthorize.php`), or `Gate::authorize()`.
- Treat a helper that should not be callable as private or protected. A public `recalculate(int $userId)` is a public API.
- Smell: `public function delete(int $id) { Post::find($id)->delete(); }` with the check in `mount()`. Right way: resolve through the owner (`$this->team->posts()->findOrFail($id)`), authorize, then delete.

## Middleware on updates (checklist 18)

- Update requests re-run only the persistent middleware captured from the page's route: Sanctum stateful, `AuthenticateSession`, basic auth, `SubstituteBindings`, `RedirectIfAuthenticated`, `Authenticate`, `Authorize` (`can:`) and the app's `Authenticate` (`src/Mechanisms/PersistentMiddleware/PersistentMiddleware.php:16-24`).
- A custom route middleware (team membership, subscription, feature flag) is not re-applied on actions unless registered with `Livewire::addPersistentMiddleware()` (`src/LivewireManager.php:273-275`).
- Smell: `Route::livewire('/teams/{team}/billing', Billing::class)->middleware(EnsureTeamOwner::class)` with the owner check only in that middleware. Actions skip it. Right way: add it as persistent middleware, or authorize in the actions.

## Client-writable state (checklists 1, 3)

- Public scalar properties are set by the client on every update. `public int $postId` is user input.
- `#[Locked]` rejects client updates with `CannotUpdateLockedPropertyException` (`src/Features/SupportLockedProperties/BaseLocked.php:10-13`).
- Public Eloquent model properties can't be set, read or called into from the client (`src/Features/SupportModels/ModelSynth.php:103-111`), and the snapshot carrying the model key is HMAC-signed (`src/Mechanisms/HandleComponents/Checksum.php:81-89`). `public Post $post` is tamper-proof where `public int $postId` isn't.
- `#[Url]` properties come from the query string: input, never trusted.
- Smell: `public $userId;` used in `save()` as the owner. Right way: `#[Locked]`, or derive the owner from `auth()->user()` in the action.

## Empty input (checklist 18)

- Livewire requests skip `TrimStrings` and `ConvertEmptyStringsToNull` (`src/Mechanisms/HandleRequests/HandleRequests.php:81-90`). A cleared `wire:model` input arrives as `''`, and `url`, `email`, `exists` skip it (T8).
- The same rules in a Form Request for the HTTP twin of this form behave differently: there `''` becomes `null`.
- Right way: `required` where required, `nullable` plus explicit `''` handling where optional, and a `?string` property type that accepts both.

## Binding and rendering (checklist 18)

From Boost 2.9.1's Livewire 4 skill (Laravel's written guidance, verify in source before a finding rests on it):
- `wire:model` is deferred by default; `wire:model.live` for per-keystroke updates. `wire:model` ignores events bubbling from child elements; `.deep` restores the Livewire 3 behaviour.
- `wire:key` in every loop. `smart_wire_keys` defaults to true (`config/livewire.php:224`), which doesn't make a missing key in a list with reordering safe.
- Full-page components use `Route::livewire()` (`src/Mechanisms/HandleRouting/HandleRouting.php:16`).
- Single-file components are the default; the `⚡` filename prefix follows `make_command.emoji` (`config/livewire.php:73`). Follow what the app already uses.
- Islands (`@island`) and `#[Async]` / `wire:click.async` run updates in parallel. Parallel actions on the same state are a race (checklist 6): two async actions that read-modify-write one property can lose an update.
- Alpine is bundled; a separately loaded Alpine is a duplicate.

## Computed and performance

- `#[Computed]` caches per request by default; `persist: true` caches across requests for `seconds` (default 3600), `cache: true` in the app cache (`src/Features/SupportComputed/BaseComputed.php:16-18`). A persisted computed property holding per-user data needs a per-user key: check what it's keyed on before approving.
- A query in `render()` runs on every update, including every `wire:model.live` keystroke.
- Synchronous external calls in an action block the component (checklist 19). `wire:poll` multiplies them.

## Uploads (checklists 2, 5)

- The temporary upload endpoint accepts any file up to 12 MB with `required|file|max:12288` and `throttle:60,1` unless configured (`src/Features/SupportFileUploads/FileUploadConfiguration.php:104,114-116`; `config/livewire.php:131-143`).
- Type, size and ownership rules for the stored file go in the action that stores it.
- Temporary files land on the configured disk under `livewire-tmp`. A public default disk exposes them.

## Tests (checklists 11-13)

- `Livewire::test()` sends updates through the update route with middleware disabled (`src/Features/SupportTesting/RequestBroker.php:23-40`, `SubsequentRender.php:35-36`). A passing Livewire test proves nothing about persistent middleware.
- Authorization tests: `Livewire::actingAs($stranger)->test(Component::class, [...])->call('delete', $id)->assertForbidden()` (forwarded to the last `TestResponse`, `src/Features/SupportTesting/Testable.php:411-420`), against the method-level check. The denied case is the one that proves the hole is closed.
- A test that sets a `#[Locked]` property through `->set()` should expect the exception; one that sets an unlocked id and succeeds documents the hole.
