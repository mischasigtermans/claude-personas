# Migrations and deploy

What to check on schema changes, backfills, deploy order and state that survives a deploy. Checklist items 15-17, and 14 for the test engine. Trap entries (T-numbers) are in `framework-traps.md`.

Paths: framework relative to `vendor/laravel/framework/src/Illuminate/`, read at v13.33 (bron) unless marked v13.23 (onoma/platform). Engine rules (what Postgres, MySQL or SQLite accept) are marked 'engine' and come from the engine, not from Laravel.

## First question: who can observe this? (checklist 15)

Before judging a migration, list what already exists on the other side of the deploy:
- Rows: how many, and how many violate the new constraint. `php <repo>/artisan db:table <table>` for columns and indexes; row counts only from the asker.
- Queued jobs: payloads carry the class name and the serialized job (`Queue/Queue.php:178-198`). Renaming a job class, or changing its constructor properties, breaks every job already queued (PHP unserialize). `#[DeleteWhenMissingModels]` deletes a job whose model was deleted instead of failing it.
- Cached objects: L13's `serializable_classes` (T26); a class renamed or removed from the allow-list comes back incomplete.
- Sessions and tokens: a serializer or guard change logs everyone out. My record on new behaviour for new apps only is #60346 in `context/quotes.md`.
- Consumers: API resources, MCP tool output, webhooks (`boost-mcp-ai.md`, checklist 21).
If nothing observes it, refactor freely. The asker's own rule ('pre-launch, no compatibility') wins over this list.

## Transactions per engine (checklist 17)

- Postgres and SQL Server migrations run in a transaction; MySQL and SQLite don't (T25). `Database/Schema/Grammars/Grammar.php:31`, `PostgresGrammar.php:18`, `Database/Migrations/Migrator.php:448-451`.
- Postgres consequence: a failed migration rolls back whole, but `CREATE INDEX CONCURRENTLY` can't run at all without `public $withinTransaction = false;` (engine).
- MySQL consequence: a failure halfway keeps the DDL that ran and writes no `migrations` row; the retry fails on the table or column that exists. Split multi-step DDL into separate migrations.
- Laravel Cloud: `CloudBootstrapper` runs only when `LARAVEL_CLOUD=1` (`Foundation/Application.php:319-333`). With `DB_POOLING` unset and a `pgsql-unpooled` connection present, the Migrator resolves `pgsql` to it (`Foundation/CloudBootstrapper.php:115-121,197-212`). Confirm the connection from the asker's config.

## Indexes and hot tables (checklists 16, 17)

- Postgres: `->online()` emits `concurrently` on unique, plain and operator-class indexes (`PostgresGrammar.php:341-343,383-400,455-462`), with `$withinTransaction = false`. `dropIndex` compiles a plain `drop index` (`:627-630`), never concurrent: raw `DB::statement('drop index concurrently ...')` if the table is hot.
- MySQL: `->online()` is ignored (no reference in `MySqlGrammar.php`). Use `->lock('none')`, and `->inplace()` on indexes (v13.33 `IndexDefinition.php:11,13`; `inplace()` is absent at v13.23). Column adds: `->instant()` (`ColumnDefinition.php:20`, `MySqlGrammar.php:317,411-412`).
- A failed `CONCURRENTLY` build leaves an invalid index behind (engine). The fix migration drops it before retrying.
- Smell: `$table->index('user_id')` on a 40M-row Postgres table in a default migration. Right way: a separate migration with `$withinTransaction = false` and `->online()`.

## Deploy order (checklist 16)

1. Additive schema first: nullable column, new table, index built online.
2. Backfill: a queued job or command with `chunkById()` (`eloquent.md`), idempotent, restartable.
3. Code that reads the new column or relies on it.
4. Constraints last: `NOT NULL`, unique, foreign key, once the data satisfies them.
5. Removal in a later deploy, after nothing reads the old column.

- Smell: one PR adds `status` with a unique index and ships code reading it. Right way: split as above, and count violating rows before the constraint (`SELECT team_id, email, count(*) ... HAVING count(*) > 1`).
- Default values: adding a column with a default is cheap on Postgres 11+ and MySQL 8 instant adds (engine). A volatile default (a function call) rewrites the table on Postgres (engine).
- Renames: code that reads the old name breaks between migrate and deploy on any multi-instance host. Add the new column, dual-write, backfill, switch reads, drop.

## `down()` (checklist 17)

- A `down()` that drops a table or column holding production data turns a rollback into data loss. Right way: a no-op `down()`, or move the data aside.
- A missing `down()` is the repo's convention, never a finding (`context/decisions.md`, Open Questions).
- `shouldRun()` returning false keeps the migration out of the `migrations` table (`Database/Migrations/Migration.php:36`, `Migrator.php:244-248`): it runs on a later `migrate` once the condition holds. My rationale: `context/quotes.md`, #57399.

## The test engine (checklist 14)

- Read `<repo>/phpunit.xml` before recommending SQL. A suite on in-memory SQLite can't run Postgres-only DDL.
- SQLite has no `ALTER TABLE ... ADD CONSTRAINT` (engine). A CHECK added through a raw statement fails the suite. Portable invariant: a model `saving` guard plus the constraint in a Postgres-only migration guarded by `DB::getDriverName()`.
- SQLite migrations aren't wrapped in a transaction (T25) and compile no row locks (T2): a green SQLite run proves neither the migration's transaction behaviour nor a lock.
- JSON operators, `whereVectorSimilarTo()` and partial indexes differ by engine: test on the production engine or mark the check unrun.

## Host-dependent behaviour

From source, confirm the host from the asker:
- Proxy trust on Cloud and `*.on-forge.com` / `*.on-vapor.com` only (T11).
- Cloud managed queues default `after_commit` from `CLOUD_QUEUE_AFTER_COMMIT`, false when unset (T1).

From public product docs, not source (`CLAUDE.md` rule 13): scale-to-zero cold starts, managed queue ordering and worker scaling. Label them as docs and read the current page before citing.

## Verify pass on a migration fix

- Re-read the migration and every model, job and resource that touches the changed columns; the fix round is where regressions land.
- Grep for the old column or class name across `app/`, `database/`, `resources/`, `routes/`, `config/` and tests (checklist 22).
