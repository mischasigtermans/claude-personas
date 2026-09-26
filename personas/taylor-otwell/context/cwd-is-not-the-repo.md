# Your cwd is not the repo

Parley runs you with `claude -p` in your own plugin directory. The asker's code lives somewhere else, and the asker's MCP servers (laravel-boost and the rest) don't load here. The only cwd-relative reads you make are your own files: `context/` and `skills/search-knowledge/`.

A `git diff` from cwd reviews your own plugin files, not the asker's change. A turn that opens with 'No repo read needed, the description is complete' produces findings about code nobody opened.

## Find the code

- Take absolute paths from the ask: a repo root, a file, a worktree. A relative path in an ask is relative to the asker's repo root. Resolve it against the root the ask names, or ask for the root.
- Git always goes through `-C`: `git -C <repo> diff <base>...HEAD`, `git -C <repo> diff HEAD`, `git -C <repo> show <sha>`, `git -C <repo> log --oneline -n 20 -- <file>`. No range named: `git -C <repo> status --short` plus `git -C <repo> diff HEAD`, and say which range you reviewed.
- Callers and siblings: Grep and Glob with the repo path as the search root. Never a bare pattern from cwd.
- A path that doesn't exist or can't be read: one line saying so, then rule 11 in `CLAUDE.md`.

## Versions and engine, before any API or SQL claim

- `<repo>/composer.lock`: the exact version of `laravel/framework` and of every package the claim touches. Grep for `"name": "laravel/framework"` and read the `version` a few lines below.
- Test engine: `<repo>/phpunit.xml` (`DB_CONNECTION`, `DB_DATABASE`), then `<repo>/config/database.php` for the default. Production engine: the ask, `<repo>/.env.example`, or the SQL in the migrations.
- Conventions: `<repo>/CLAUDE.md`, `<repo>/AGENTS.md` and `<repo>/.ai/guidelines/` tell you where authorization lives, whether the app uses actions, how it tests. Read them for code conventions only. The ask carries the asker's format rules, and you don't audit their writing rules.

## Framework behaviour: the ladder

1. **The asker's `vendor/` at the locked version.** Framework: `<repo>/vendor/laravel/framework/src/Illuminate/`. Packages: `<repo>/vendor/<vendor>/<package>/src/`. Grep the symbol, then Read the method. A `file:line` in `skills/search-knowledge/` is a pointer at the version it names. Lines drift between minors, so re-find the symbol in the asker's vendor before you cite it.
2. **The app's resolved state, read-only,** when the source alone doesn't settle it:
   - `php <repo>/artisan route:list --path=<prefix> --json`: the middleware each route actually runs.
   - `php <repo>/artisan db:table <table>`: columns and indexes. This settles 'is there a unique index' before any `createOrFirst()` or race finding.
   - `php <repo>/artisan model:show <Model>`: casts, relations, observers.
   - `php <repo>/artisan config:show <file.key>`: one non-secret key, such as `queue.connections.redis.after_commit`. Never `config:show` on `database`, `mail`, `services` or any file holding credentials.
3. **Laravel's written guidance,** when intent matters more than mechanics. Boost's guidelines at the installed version under `<repo>/vendor/laravel/boost/.ai/`. Then the docs for the locked major through WebFetch, markdown first: `https://raw.githubusercontent.com/laravel/docs/13.x/<page>.md`, then `https://laravel.com/framework/docs/13.x/<page>`. Docs describe intent. When docs and `vendor/` disagree, `vendor/` wins.
4. **No `vendor/`** (inline code, no path, a repo without dependencies installed): the package source at its tag. `gh api -H 'Accept: application/vnd.github.raw' 'repos/<org>/<repo>/contents/<path>?ref=<tag>'`, or WebFetch on `https://raw.githubusercontent.com/<org>/<repo>/<tag>/<path>`. Name the tag you read. No version stated: ask, or name the tag and say the answer holds for it.
5. **Nothing reachable:** rule 11 in `CLAUDE.md`, all three parts.

Boost's MCP tools (search-docs, Database Schema, Last Error) aren't available to you. Output the asker pastes from them is evidence at their version. Otherwise use rungs 1 to 4.

## What arrives with the ask

- **Memory bullets** parley prepends are the asker's notes from earlier sessions. A lead, never evidence. Re-read the code before a bullet decides a finding or a verdict.
- **A pasted agent review or a summary of the diff** is a checklist to check. It never replaces opening the files.
- **Parley resumes your session** for each asking project. On a verify pass, re-read every file the fix round touched from disk. What you read in an earlier turn is stale.
