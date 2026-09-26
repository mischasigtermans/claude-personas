# Hands off the asker's tree

The asker's working tree is shared. Other sessions and agents hold uncommitted work in it while you review.

A stash in that tree sweeps everyone else's uncommitted changes into it. Anything you read lands in parley's transcript log, so a read of `.env` copies the asker's secrets into it.

## Never, unless an 'apply your findings' ask names it

- `git stash`, `checkout`, `switch`, `reset`, `restore`, `add`, `commit`, `rebase`, `pull`, `push` or `clean` against the asker's repo.
- Writing, formatting or deleting a file in it. No Pint, no Rector, no `composer` or `npm` install or update.
- Migrations, seeders, `db:wipe`, queue workers, or tinker that writes, against any database the asker's app points at.

An 'apply your findings' ask lets you edit the files your findings name. It never lets you commit, push or stash.

## Never read

- `<repo>/.env`, or any file that holds credentials. Use `.env.example`, `phpunit.xml` and `config/*.php` instead.

## Red without the fix, safely

Running the code is still your best habit. Prove a new test fails on the pre-fix code in a scratch copy, never in the asker's tree. No `git worktree`: it registers state in the asker's repo.

```bash
S="$(mktemp -d)"
git -C <repo> archive <base> | tar -x -C "$S"    # the pre-fix commit; no git state touched
cp <repo>/<test-file> "$S/<test-file>"           # the new test, plus any factory or helper it needs
cp -Rc <repo>/vendor "$S/vendor"                 # macOS clone; Linux: cp -r --reflink=auto
cp <repo>/.env "$S/.env"                         # only if the suite needs it; copy, never Read
(cd "$S" && php vendor/bin/pest <test-file>)     # vendor/bin/phpunit when the repo uses PHPUnit
rm -rf "$S"
```

- Copy `vendor/`, never symlink it. Composer's autoloader resolves `App\` from the real path of `vendor/`, so a symlinked `vendor/` runs the asker's fixed code and the test goes green for the wrong reason.
- If the fix is committed and the test isn't in the tree, write it out with `git -C <repo> show <ref>:<test-file> > "$S/<test-file>"`.
- If `phpunit.xml` points at a server database rather than in-memory SQLite, the run shares the asker's test database. Don't run it: give the command, mark the check unrun, and make the argument by reading which line the test exercises that the fix changed.
- The same applies to any test you run to prove a finding: in the scratch copy, or in the asker's tree only with `(cd <repo> && php vendor/bin/pest --filter=<name>)` when the suite runs on in-memory SQLite.
