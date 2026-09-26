# Eloquent

What to check on change tracking, events, touches, pivots, scopes, iteration and bulk writes. Checklist items 1, 6, 19, 22 and 23 decide most Eloquent findings. Trap entries (T-numbers) are in `framework-traps.md`.

Paths: framework relative to `vendor/laravel/framework/src/Illuminate/Database/`, read at v13.33 (bron) unless marked v13.23 (onoma/platform). Re-find each symbol in the asker's vendor.

## Before recommending removal (CLAUDE.md rule 4)

The costliest removal error deletes code that exists for a framework reason. Before calling Eloquent code dead or redundant, check whether it is there for:
- `$touches` or a manual `touch()` next to a query-builder write (T23 says the builder write won't touch).
- A lazy-loading guard or an explicit `load()` under `preventLazyLoading()`.
- A `wasRecentlyCreated` check beside `wasChanged()` (T22).
- A `->withPivot()` column list (T24).
- A `withoutGlobalScopes()` in an admin or job path that needs every tenant.
Ask what breaks if it goes, then grep for the reader.

## Change tracking (checklist 19)

- `wasChanged()` compares against the last `syncChanges()`: `performUpdate()` and `increment()`/`decrement()` call it, `performInsert()` doesn't (T22). `Eloquent/Model.php:1133-1156,1542,1602-1644`; `Eloquent/Concerns/HasAttributes.php:2214,2267,2335,2345`.
- In a `saved` observer, 'did email change' is `$model->wasRecentlyCreated || $model->wasChanged('email')`.
- `getChanges()` holds the last save's diff; `getPrevious()` the values before it.
- `saveOrIgnore()` inserts with `on conflict do nothing returning *`, returns false when ignored and sets `wasRecentlyCreated` only on insert (`Model.php:1452-1466,1660-1696`, v13.23 `:1430`). Postgres and SQLite only: the base grammar throws for MySQL (`Query/Grammars/Grammar.php:1326-1329`).
- Smell: an observer that queues a welcome email on `wasChanged('email')`. It never fires for new users.

## Events, touches, casts (checklists 7, 19)

- Query-builder writes (`Model::query()->update()`, `->delete()`, `upsert()`) skip model events, `$touches`, casts and `$fillable`; global scopes still apply (T23). `Eloquent/Builder.php:1303-1306,1316-1334,1541-1548,2071-2074`.
- Parent touches fire from `finishSave()` only when the model is dirty and `touch` isn't false (`Model.php:1499-1508`). A save with no changes touches nothing.
- `#[Touches]`, `#[ObservedBy]`, `#[ScopedBy]`, `#[UsePolicy]`, `#[Table]` and the rest live in `Eloquent/Attributes/` at v13.23 and v13.33. Attribute or property: consistency with the codebase decides, never a finding. Why we consolidated them: `framework-rationale.md`, #58578.
- Smell: `Order::whereIn('id', $ids)->update(['status' => 'shipped'])` where an observer sends the shipping mail. Right way: iterate and save, or dispatch the side effect explicitly next to the bulk write and say why.

## Pivots (checklists 22, 23)

- `belongsToMany` selects the two keys plus the columns in `withPivot()` (T24). A new pivot column reads as `null` everywhere until it is listed.
- `attach()`, `sync()` and `updateExistingPivot()` without `->using(CustomPivot::class)` write through the query builder: no pivot events, no casts (`Relations/Concerns/InteractsWithPivotTable.php:267-275,336-345`).
- `->withTimestamps()` is opt-in (`Relations/BelongsToMany.php:1600-1608`).
- Smell: an audit observer on a `Pivot` class with no `->using()` on the relation. It never runs.

## Scopes and tenancy (checklists 1, 3)

- Global scopes apply to Eloquent queries, including `toBase()` bulk writes. They don't apply to `DB::table()`, raw SQL, or `exists`/`unique` validation (T18).
- `withoutGlobalScopes()` in a request path is a tenancy finding unless the path is admin-only by an authorization check you can point at.
- Route model binding resolves globally unless `scopeBindings()` or a custom key (T17).
- Smell: a job that loads `Project::find($id)` with a tenant scope keyed on `auth()->user()`. There is no user in a worker: the scope throws or matches nothing. Right way: pass the tenant into the job and scope explicitly.

## Iteration (checklist 19)

- `chunk()` pages with `offset`/`limit` and forces an order by key (`Concerns/BuildsQueries.php:39-57`, `Eloquent/Builder.php:1095-1100`). If the callback changes a column in the `where`, rows shift pages and get skipped.
- `chunkById()` / `lazyById()` page by key and are safe under that mutation (`BuildsQueries.php:132,307`).
- `cursor()` hydrates one row at a time and never eager-loads relations (`Eloquent/Builder.php:1081-1088`): every relation access is a query.
- Smell: `User::where('migrated', false)->chunk(500, fn ($users) => $users->each->update(['migrated' => true]))`. Half the rows are skipped. Right way: `chunkById()`.

## Lazy loading and N+1 (checklist 19)

- `Model::preventLazyLoading()`, `shouldBeStrict()`, `automaticallyEagerLoadRelationships()` exist (`Model.php:576,589,600`). Which one the app uses is its call; strict mode is on my record as the feature I regret (`context/quotes.md`).
- A query inside an accessor or a `$appends` attribute runs per model in every serialization. Flag it when the model is listed.
- Evidence over adjectives: count queries for the realistic page, before and after.

## Bulk and upserts (checklists 6, 23)

- `upsert()` bypasses events and adds timestamps itself (`Eloquent/Builder.php:1316-1334`).
- MySQL compiles `on duplicate key update` and ignores `$uniqueBy`: any unique index can match (`Query/Grammars/MySqlGrammar.php:426-449`). A second unique index on the table changes which row is updated.
- `insert()` and `insertOrIgnore()` are passed straight to the query builder (`Eloquent/Builder.php:126-129`): no casts, no `HasUuids` ids, no timestamps. `fillAndInsert()` / `fillAndInsertOrIgnore()` fill each row through a model first (`:513-560`, v13.23 `:490`). Still no events.

## Ordering and pagination

- Offset pagination ordered by a non-unique column (`created_at`) can repeat or skip rows between pages (engine). Add a tiebreaker: `->orderBy('created_at')->orderBy('id')`.
- `cursorPaginate()` needs a unique, stable order for the same reason (`Eloquent/Builder.php:1208`).

## Vector search

- `whereVectorSimilarTo($column, $vector)` embeds a string argument through `toEmbeddings(cache: true)` before querying (`Query/Builder.php:1221-1233`): a string is an embedding provider call on the request path. Pass a vector you stored, or accept the call and cache.
- Grammars: Postgres and MariaDB only (`Query/Grammars/PostgresGrammar.php`, `MariaDbGrammar.php`). Present at v13.23 and v13.33.

## Mass assignment (checklist 2)

- `$fillable`, `$guarded`, or `#[Fillable]`, `#[Guarded]`, `#[Unguarded]` (`Eloquent/Attributes/`). None of them protects a query-builder `update()` (T23).
- Smell: `$user->update($request->all())` with `role` in `$fillable`. Right way: `$request->validated()` and a rule set that doesn't include `role`, or an explicit assignment behind a policy.
