# Security and auth

What to check on guards, tokens, middleware groups, CSRF, proxies, policies and outbound requests. Checklist items 1-5 in `CLAUDE.md`, and 18 where a mechanism silently doesn't run. Trap entries (T-numbers) are in `framework-traps.md`; this module adds the review procedure around them.

Paths: framework relative to `vendor/laravel/framework/src/Illuminate/`, packages relative to `vendor/<vendor>/<package>/`. Versions read: framework v13.33, passport v13.8.0, league/oauth2-server 9.4.1 (bron); sanctum v4.3.1 (onoma/platform). Re-find each symbol in the asker's vendor before citing it.

## Who is authenticated

**Sanctum 4** (verified at sanctum v4.3.1)
- Order: each guard in `sanctum.guard` (default `['web']`) first, then the bearer token. A session user gets a `TransientToken`. `src/Guard.php:32-60`, `config/sanctum.php:37`.
- `TransientToken::can()` returns true for everything (T19). A route that relies on `tokenCan('admin')` is open to every logged-in SPA user.
- `config/sanctum.php:50` ships `'expiration' => null`: personal access tokens never expire unless the app sets it or passes `expiresAt`.
- Review: a token-ability check is a finding only with a policy behind it. Right way: policy or gate for permission, abilities only to narrow what a token may do.

**Passport 13** (verified at passport v13.8.0)
- Grants: password and implicit are off unless enabled, device code is on. `src/Passport.php:36,41,46,186-197`.
- Access and refresh tokens default to one year. `src/Passport.php:293-310`. A long-lived token plus a leaked client secret is a year of access; ask what the app set.
- Scopes: unregistered scope is `invalid_scope`; `tokensCan()` replaces the map (T20).
- Consent is skipped when the user already holds an unrevoked, unexpired token for that client covering the requested scopes, or for any token when no scope is requested. `src/Http/Controllers/AuthorizationController.php:84-87,124-137`. An approval gate built on 'the consent screen always shows' is wrong: pass `prompt=consent` or check in `Client::skipsAuthorization()`.
- Client credentials: `oauth_user_id` is the client id, not null (T21). For machine-only routes use `EnsureClientIsResourceOwner`, which requires `oauth_user_id` null or equal to the client id. `src/Http/Middleware/EnsureClientIsResourceOwner.php:19-24`.

**Sanctum or Passport.** Passport only when a third party needs OAuth (MCP clients with dynamic registration are the common case now, see `boost-mcp-ai.md`). First-party SPA and mobile: Sanctum. My rationale is in `framework-rationale.md`.

## Middleware groups and what runs where (checklist 18)

- `web`: `EncryptCookies`, `AddQueuedCookiesToResponse`, `StartSession`, `ShareErrorsFromSession`, `PreventRequestForgery`, `SubstituteBindings`, plus `auth.session` only with `authenticatedSessions()`. `Foundation/Configuration/Middleware.php:485-493`.
- `api`: no cookies, no session (T10). A cookie set on `web` is encrypted and unreadable on `api` without `EncryptCookies`.
- Global: `TrustProxies`, `HandleCors`, `TrimStrings`, `ConvertEmptyStringsToNull` and others. `Middleware.php:455-462`.
- Priority sorting (T12): read the resolved order with `php <repo>/artisan route:list --path=<prefix> --json` before claiming a throttle or auth bug.
- Smell: `Cookie::queue()`, `session()` or `auth('web')` inside an `api` route. Right way: move the route to `web`, or use a bearer token.

## CSRF (checklist 2)

- `PreventRequestForgery` skips reads and `Sec-Fetch-Site: same-origin`, and everything in tests (T13).
- Smell: `Route::get('/invites/{invite}/accept', ...)` that writes. Right way: POST, or a signed URL (`URL::signedRoute()`, checked by `hasValidSignature()`, `Routing/UrlGenerator.php:434`) when a GET link in an email must act.
- `preventRequestForgery(originOnly: true)` rejects token-only requests without a same-origin header. `Middleware.php:605-615`. Check the app's clients before recommending it.

## Proxies and client IP (checklists 5, 18)

- Auto-trust only on Cloud, `*.on-forge.com`, `*.on-vapor.com` (T11). Custom domains on Forge are not `on-forge.com`.
- Configure: `->withMiddleware(fn ($m) => $m->trustProxies(at: [...]))` or `trustedproxy.proxies`. `Middleware.php:698-709`, `Http/Middleware/TrustProxies.php:69`.
- What a wrong `$request->ip()` breaks: guest rate limits (`ThrottleRequests.php:224-230` keys by `domain|ip`), login throttling, audit logs, geo rules.
- `'*'` (and the Cloud and Forge auto-trust) trusts `0.0.0.0/0`, and with every hop trusted Symfony returns the leftmost `X-Forwarded-For` entry: the value the client sent, unless the proxy overwrites the header. `Http/Middleware/TrustProxies.php:120-123`; symfony/http-foundation v8.1.7 `Request.php:2207-2244`. Ran: `X-Forwarded-For: 6.6.6.6, 203.0.113.9` from `10.0.0.1` gives `6.6.6.6` under `*`, `203.0.113.9` when only `10.0.0.0/8` is trusted. Before approving `*` for rate limits or audit, ask what sits in front and whether it overwrites the header; otherwise list the proxy ranges.

## Authorization (checklists 1-3)

**The procedure**
1. Find the read path and the write path for the same resource. Both resolve through the same owner scope.
2. Find the permission check: policy via `Gate::authorize()`, `can:` middleware, `#[Authorize]` on a controller method (`Routing/Attributes/Controllers/Authorize.php`), or `#[UsePolicy]` on the model (`Database/Eloquent/Attributes/UsePolicy.php`). Follow the repo's convention for where it lives.
3. Check nested routes for `->scopeBindings()` (T17), `exists` rules for a tenant `where` (T18), `Gate::before` for `false` (T16), Form Requests for `return true;` (T14).
4. Write the cross-tenant test: user from team B, team A's id, expect 403 or 404 (`testing.md`).

**Smells and the right way**
- `Project::findOrFail($id)` in `update` while `show` uses `$team->projects()`: resolve through the relation, then authorize.
- `authorize()` returning `true` plus a comment 'checked in the controller': find the check or add it.
- `$this->authorize()` in an L11+ controller: fatal without the trait (T15).
- A hashid or UUID as the only guard: scope the query (checklist 3).
- `Model::query()->update($request->all())`: skips `$fillable` and events (T23). Use `$request->validated()` (`Foundation/Http/FormRequest.php:389-392`) and a model save.

## Identity and rollout (checklist 4)

- Social login linked on a matching email: the fix and the test are in `context/anti-patterns.md` entry 4. laravel/socialite isn't in either vendor read: read the provider's payload in the asker's vendor before naming a verified-email field.
- Key rotation: `APP_PREVIOUS_KEYS` feeds `previous_keys`; decryption tries the current key, then each previous one. `Encryption/EncryptionServiceProvider.php:33-35`, `Encryption/Encrypter.php:379`. Rotating `APP_KEY` without it breaks encrypted casts, cookies and sessions at once.
- Revoking tokens or changing session serialization logs everyone out. Right way: accept both for a window, or revoke on purpose and say so in the PR.
- Constant-time paths: `Timebox::call()` (`Support/Timebox.php:27`) for login and reset flows that leak user existence through timing.

## Outbound requests (checklist 5)

- Laravel's HTTP client follows redirects (Guzzle default) unless `withoutRedirecting()`, and doesn't throw on 4xx or 5xx: `'http_errors' => false`. `Http/Client/PendingRequest.php:269-272,592-606`.
- Smell: `Http::get($request->input('webhook_url'))` with a docblock 'internal hosts blocked'. Right way: host allow-list in code, `withoutRedirecting()` on the pinned client, `->throw()` or an explicit status check.
- Smell: `redirect($request->input('next'))`. Right way: `redirect()->intended()` or validate the target as relative or same-host.
- File paths from input: `Storage::disk()->path($input)` with `../`. Validate against a known set of names.

## Secrets

- `Context::add('token', ...)` logs it; `addHidden()` still queues it (T7).
- Never read the asker's `.env` (`context/hands-off-the-askers-tree.md`). `.env.example`, `config/*.php` and `config:show` on a non-secret key answer config questions.
