# Boost, MCP and the AI SDK

What to check when a diff builds an MCP server with laravel/mcp, changes Boost guidelines or skills, or uses the Laravel AI SDK. Checklist items 2, 5, 18 and 21 decide most findings here. Trap entries (T-numbers) are in `framework-traps.md`.

Versions differ across the user's apps, and these packages moved fast in September 2026. Read `<repo>/composer.lock` first:
- laravel/mcp: v1.0.0 in bron, v0.8.2 in onoma/platform. Paths below are v1.0.0, relative to `vendor/laravel/mcp/`.
- laravel/boost: 2.9.1 in bron, 2.4.13 in onoma/platform. Paths are 2.9.1, relative to `vendor/laravel/boost/`.
- laravel/ai: v0.10.3 in bron. v1.0.0 was tagged 2026-09-23 (GitHub releases, per the domain map). Any AI SDK API claim needs the asker's locked version read first.

## MCP servers: the endpoint (checklists 2, 18)

- `Mcp::web('/mcp', Server::class)` registers a POST route with only `ReorderJsonAccept`, `ValidateMcpHeaders`, `AddWwwAuthenticateHeader`, plus GET and DELETE answering 405 (`src/Server/Registrar.php:42-66`). Authentication is whatever middleware the app chains on: `->middleware('auth:api')` for Passport, `auth:sanctum` for Sanctum. No middleware: a public server.
- `Mcp::local()` registers a stdio server for Artisan (`Registrar.php:68-71`); it runs with the shell user's access, no guard.
- `$request->user()` inside a tool resolves through the app's auth user resolver (`src/Request.php:91-96`). On a server without auth middleware it is `null`, and a tool that doesn't check for `null` serves guests.
- Smell: `Mcp::web('/mcp/admin', AdminServer::class);` with no middleware because 'the client is ours'. Right way: `->middleware(['auth:api', 'can:admin'])`, and a test that calls a tool as a stranger.

## Tools (checklists 1, 2, 18)

- `shouldRegister()` returning false hides a tool from `tools/list` and makes `tools/call` answer 'not found' (`src/Server/Primitive.php:91-95`, `src/Server/ServerContext.php:125-135`, `src/Server/Methods/CallTool.php:33-41`). It gates the tool, not a record: `handle()` still scopes and authorizes each resource.
- Arguments are the raw JSON body, validated with `$request->validate()` over `Validator::validate($this->all())`: no `TrimStrings`, no `ConvertEmptyStringsToNull` (T8). `''` passes `url`, `email`, `exists`.
- Annotations (`IsReadOnly`, `IsDestructive`, `IsIdempotent`, `IsOpenWorld`, `src/Server/Tools/Annotations/`) are hints to the client. A tool marked `IsReadOnly` that writes is a contract finding (checklist 20), and the annotation enforces nothing.
- A tool that calls the app's own HTTP routes, or a service shared with a controller, needs the controller's authorization too (checklist 22).
- Smell: `handle()` loads `Project::find($request->get('project_id'))`. Right way: resolve through the user's team, authorize, then act; test with another team's id.

## Output as a published contract (checklist 21)

- Tool names, argument names, output shape and error text are consumed by agents and MCP clients you don't control. Renaming an argument or dropping a field is a breaking change for them, whatever semver says about the app.
- Right way: add, don't rename; accept the old argument for a window; version the server route when a break is unavoidable.

## OAuth for MCP (checklists 2, 4)

- `Mcp::oauthRoutes()` registers the `.well-known` discovery routes and dynamic client registration, and adds the `mcp:use` scope to Passport (`Registrar.php:124-127,198-212`). A later `Passport::tokensCan([...])` without `mcp:use` removes it: tokens then fail with `invalid_scope` (T20).
- Dynamic registration accepts any `http`/`https` redirect URI while `mcp.redirect_domains` holds `'*'`, and the published config ships `['*']` (`config/mcp.php:18-19`, `src/Server/Http/Controllers/OAuthRegisterController.php:31-50`). Anyone can register a client. Consent is what stands between that client and a token, and Passport skips consent for clients the user already approved (`security-auth.md`, Passport 13). Restrict `redirect_domains` when the client list is known.
- Client-credentials tokens carry the client id in `oauth_user_id` (T21): a machine client reaching a user tool resolves no user through `TokenGuard`.

## Boost (the asker's coding agent, not yours)

- Boost's MCP tools run inside the asker's app and aren't available to you: Application Info, Browser Logs, Database Connections, Database Query, Database Schema, Get Absolute URL, Last Error, Read Log Entries, Record Rule, Search Docs, Tinker (`src/Mcp/Tools/`). Ask the asker to paste their output; it's evidence at their version (`context/cwd-is-not-the-repo.md`).
- Database Query refuses anything but `SELECT`, `SHOW`, `EXPLAIN`, `DESCRIBE`, `DESC` and `WITH ... SELECT` (`src/Mcp/Tools/DatabaseQuery.php:48-75`).
- Guidelines load up front; skills load on demand. The app's own `.ai/guidelines` override and extend Boost's (`src/Install/GuidelineComposer.php:23`). Direct-dependency packages ship theirs under `resources/boost/guidelines` and `resources/boost/skills` (`src/Support/PackageRegistry.php:82-91`, `src/Install/ThirdPartyPackage.php:68-79`).
- Boost's `laravel-best-practices` rules (`.ai/laravel/skill/laravel-best-practices/rules/`) are Laravel's written guidance. Cite them as Boost's guideline, never as my sentence (`context/quotes.md`, 'Never attribute to me').

## Prompt, guideline and skill changes (checklist 20)

- A change to a prompt, guideline or skill is a behaviour change with no compiler. Ask for the agent's behaviour before and after on a real task; my question on fortify#640 is in `context/quotes.md`.
- A skill description is its trigger. A broad one fires in unrelated sessions; check what else it matches.
- Guideline text that restates what the code enforces drifts from it. Point at the code or the test.

## AI SDK (checklists 5, 9, 19)

Read at laravel/ai v0.10.3; re-read at the asker's version before any API claim.
- Tool approval: tools implementing `Approvable` expose `requireApproval()`, `withoutApproval()` and `shouldRequestApproval()` (`src/Contracts/Approvable.php`). A tool that writes, pays or sends without approval in a user-facing agent is a product decision to surface, not to make (`CLAUDE.md`, 'Apply your findings').
- Fakes: an agent class's `::fake()` from the `Promptable` trait (`src/Promptable.php:380`), `Embeddings::fake()`, `Files::fake()`, `Stores::fake()` (`src/Embeddings.php:31`, `src/Files.php:77`, `src/Stores.php:46`). A test that hits a live provider is slow, flaky and costs money.
- An agent call inside a request, a transaction or a Livewire render is synchronous external I/O (checklist 19): queue it, or show the latency budget.
- Model output written to the database or rendered unescaped is untrusted input. Validate structured output against a schema before acting on it.
- Prompt text built from user input and fed to a tool-using agent is an injection surface: whatever the agent's tools can do, the injected text can ask for. Keep write tools behind approval or authorization in the tool itself.
- `whereVectorSimilarTo()` with a string embeds it on the request path (`eloquent.md`, Vector search).
