# Validation

What to check on rules, empty values, entry points, Form Requests and database rules. Checklist items 2 (validation is not permission), 18 (does the rule run on this entry point), 22 (a rule added on one surface and missing on another). Trap entries (T-numbers) are in `framework-traps.md`.

Paths: framework relative to `vendor/laravel/framework/src/Illuminate/`, read at v13.33 (bron). Re-find each symbol in the asker's vendor.

## When a rule runs at all

A rule is evaluated only when all four hold (`Validation/Validator.php:824-834`):
1. The value is present, or the rule is implicit. A string that trims to `''` counts as absent for non-implicit rules (`:844-852`).
2. `sometimes` is absent, or the key exists in the input (`:872-882`).
3. `nullable` is absent, or the value isn't `null` (`:891-898`).
4. No earlier presence rule on the attribute failed.

Implicit rules: the `required*`, `present*`, `missing*`, `accepted*`, `declined*` families and `filled` (`:207-232`). Everything else (`url`, `email`, `uuid`, `in`, `exists`, `max`, custom rules) skips an absent or blank value.

Consequences a reviewer checks:
- `'website' => 'url'` accepts a missing key, `''` and `'   '` on any entry point that doesn't null them (T8).
- `'website' => 'nullable|url'` is the explicit form over HTTP, where `''` arrives as `null`.
- A custom rule that must run on blank input implements `ImplicitRule` or is registered implicit; otherwise it never sees `''`.

## Entry points (checklists 18, 22)

| Entry point | Empty-string handling | Read |
|---|---|---|
| HTTP routes, `web` and `api` | `TrimStrings` then `ConvertEmptyStringsToNull`, global | `Foundation/Configuration/Middleware.php:461-462` |
| Livewire updates | both skipped for Livewire requests: `''` stays `''` | livewire v4.4.5 `src/Mechanisms/HandleRequests/HandleRequests.php:81-90` |
| MCP tool arguments | raw JSON body, validated with `Validator::validate($this->all())` | laravel/mcp v1.0.0 `src/Server/Transport/HttpTransport.php:45`, `src/Request.php:86-89` |
| `Validator::make($array, ...)` in jobs, commands, imports | none | no middleware in the path |

Review rule: a validation rule shared between an HTTP controller and an MCP tool or Livewire component behaves differently on blank input. When a diff adds a second entry point for the same operation, the rules and the authorization come with it (checklist 22).

Smell: an MCP tool `'callback_url' => 'url'` whose handler calls `Http::post($args['callback_url'])`. `''` passes and reaches the client. Right way: `'required|url'` plus the host allow-list (`security-auth.md`, Outbound requests).

## Reading input after validation (checklist 18)

- `has('x')` is true for a present key holding `null`; `filled('x')` is false for `''`, whitespace and `null` (T9).
- `$request->validated()` returns only keys with rules (`Foundation/Http/FormRequest.php:389-392`); `safe()->only([...])` for a subset (`:375`). `$request->all()` after validation still carries every key the client sent.
- `#[FailOnUnknownFields]` on a Form Request, or `FormRequest::failOnUnknownFields()` globally, adds an after-hook that rejects keys without rules (`FormRequest.php:120-124,216-222,449-452`). Present at v13.23 and v13.33.
- Smell: `Model::create($request->all())` after `$request->validate([...])`. Unvalidated keys reach mass assignment. Right way: `$request->validated()`.

## Form Requests (checklist 2)

- `make:request` still generates `authorize()` returning `false`; no `authorize()` method means authorized (T14). A Form Request that validates is not a permission check: find the policy.
- Attributes: `#[StopOnFirstFailure]`, `#[ErrorBag]`, `#[RedirectTo]`, `#[RedirectToRoute]`, `#[FailOnUnknownFields]` (`Foundation/Http/Attributes/`).
- When to ask for one: long rules, rules that carry authorization, rules repeated across actions. Inline `$request->validate()` on a small endpoint is not a finding (`context/decisions.md` section 8).
- `authorize()` runs before the validator is built (`Validation/ValidatesWhenResolvedTrait.php:17-35`), after `prepareForValidation()`. A policy call there that loads the route model is fine; one that queries by an unvalidated input id is a tenancy finding.

## Database rules (checklists 1, 3)

- `exists` and `unique` query `DB::table()`: no global scopes, soft-deleted rows included (T18). Tenant apps add `->where('team_id', $team->id)`; soft-delete models add `->withoutTrashed()` (`Validation/Rules/DatabaseRule.php:89,184`).
- `Rule::unique(...)->ignore($id)` (`Validation/Rules/Unique.php:34`): Laravel's 13.x docs say never to pass user-controlled input to `ignore()` (SQL injection); pass the model or its id from the route binding. Docs-only, `laravel/docs` 13.x `validation.md:2496`.
- `exists` proves a row exists, not that this user may reference it. An `exists:projects,id` on `project_id` still needs the policy or the scoped query.
- Smell: `'project_id' => 'exists:projects,id'` in a multi-tenant app. Right way: `Rule::exists('projects', 'id')->where('team_id', $team->id)`, and resolve the project through the team in the handler.

## Custom rules

- `ValidationRule` is the current interface; `Illuminate\Contracts\Validation\Rule` is marked `@deprecated see ValidationRule` (`Contracts/Validation/Rule.php:6`). Converting a working old-style rule is outside the scope of a fix (checklist 24).
- `DataAwareRule` and `ValidatorAwareRule` give a rule the whole input or the validator (`Contracts/Validation/`).
- A custom rule that hits the database or an API per item runs once per array element under `items.*`. Count it for a realistic payload.

## Rule order and messages

- `bail` stops at the first failure for that attribute; `#[StopOnFirstFailure]` stops the whole request at the first failing attribute.
- A rule that throws instead of failing (a regex with invalid syntax, a closure that queries a missing table) becomes a 500, not a 422. Check new regexes against the engine they run in.
