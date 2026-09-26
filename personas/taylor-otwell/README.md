# Taylor Otwell

[![Version](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/mischasigtermans/claude-personas/main/personas/taylor-otwell/.claude-plugin/plugin.json&query=$.version&label=version&prefix=v)](https://github.com/mischasigtermans/claude-personas/tree/main/personas/taylor-otwell)
[![License](https://img.shields.io/github/license/mischasigtermans/claude-personas)](../../LICENSE)

Taylor Otwell as your Laravel reviewer: verdict first, grounded in your code and the framework source.

Taylor reviews Laravel diffs, plans and design questions the way he reviews framework PRs: the verdict on the first line, then findings with `file:line`, the input that breaks it and the fix as code. He opens your files, your `composer.lock` and your `vendor/` before he claims anything, and says so when he couldn't. Built from his own record: GitHub decisions and PR reviews, podcasts, keynotes and X, with sourced quotes only.

## What Taylor reviews

- **Authorization and tenancy.** Write paths that skip the scope the read path uses, login standing in for permission, hashids as the check, identity linked on an unverified email, outbound requests steered by input.
- **Races and transactions.** Check-then-act without a lock or unique index, locks that hold nothing, queued work and side effects inside a transaction, retries that do the thing twice.
- **Tests.** Does the new test fail without the fix? Through the route or through a mock? The denied case, fixtures that can't coincide, the engine the suite runs on.
- **Migrations and deploy.** Who can observe the change: existing rows, queued jobs, cached objects, sessions, API and MCP clients. Deploy order, transactional DDL, a `down()` that destroys data.
- **Silent failures and contract drift.** Mechanisms that don't run in this route group or driver, swallowed exceptions, comments and test names that aren't true, consumers left behind, the same bug in a sibling file.
- **Idiom and shape,** ranked last and labelled as taste unless they hide a bug: framework affordances at your locked version, scope creep, abstractions nothing swaps, options for behaviour that should be the default.

## How to ask

- **Gate review.** Give an absolute repo path and a range: `/parley ask taylor "Review /Users/you/Sites/shop main...HEAD before merge"`. Taylor reads the diff with `git -C`, then the callers, policies, migrations, tests and `vendor/` at your locked version.
- **Inline code.** Paste it. The verdict covers only what he could read, and he names the rest.
- **Verify pass.** Parley resumes one session per project, so run `/parley reset taylor` first for an independent second look. He reviews the fix round fresh and reports new problems only.
- **Consult, design question, direct question.** Diagnosis confirmed or not with the evidence, the pick and what to cut, or a one-line answer. Where the field is split, his view, the other view and what decides it.
- **Your format wins.** Verdict tokens (MERGE, BLOCKER), language, punctuation and structure rules from the ask are followed as given. Dutch asks get Dutch answers.

Taylor is hands-off in your working tree: no stash, checkout, formatting or installs, and no `.env` reads. When he proves a test is red without the fix, he runs it in a `git archive` scratch copy with a copied `vendor/`.

## Example

**Input:** 'Review /Users/you/Sites/shop main...HEAD before merge. Adds an order confirmation.'

**Taylor:**

> Mergeable after one fix.
>
> 1. `app/Http/Controllers/OrderController.php:48` queues `OrderConfirmation` inside `DB::transaction()`, and the `redis` connection in `config/queue.php` has `'after_commit' => false`. A worker can pick the job up before the order row commits and fail on the missing model, or mail a customer about an order that rolled back. Queue it after commit (unrun):
>
>    ```php
>    $user->notify((new OrderConfirmation($order))->afterCommit());
>    ```

## Installation

```
/plugin marketplace add mischasigtermans/by-mischa
/plugin install taylor-otwell@by-mischa
```

Then `/personas enable taylor-otwell`. Reach him as `taylor-otwell`, `taylor` or `otwell`.

### Requires

- Claude Code
- [Personas plugin](https://github.com/mischasigtermans/claude-personas/tree/main/manager) for the persona registry and natural-language dispatch
- [Parley plugin](https://github.com/mischasigtermans/claude-parley), used by Personas as transport and durable memory

No MCP server needed. Taylor reads versions, schema and routes from your repo path: `composer.lock`, `vendor/`, and read-only artisan (`route:list`, `db:table`, `model:show`). `git` and `php` on the machine that holds the repo cover it; `gh` is optional, for reading tagged package source when there's no `vendor/`.

## With the Personas plugin

Per-project memory: Taylor remembers the calls you made on earlier reviews, the conventions of your codebase and the findings you already ruled on. Parley keeps one continuous session per project, and `/parley remember taylor` distils the review into durable bullets the next one picks up. Taylor treats those bullets as leads and re-reads the code before one decides a finding.

Without the Personas plugin, Taylor still loads his voice and reviews code on demand, but every review is fresh.

## What's inside

- 26-item Taylor-ism checklist in seven groups, ranked by how often each decides a real review, with a matching anti-pattern entry per item.
- Answer rules per ask type (gate review, verify pass, consult, design question, direct conversation, room), verdict first in each.
- Thirteen read-before-assert rules, plus two context files for reading your code from outside your repo and for leaving your working tree untouched.
- Eleven knowledge modules for Laravel 13, verified against framework and package source with version and `file:line`: framework traps, security and auth, queues and concurrency, migrations and deploy, Eloquent, validation, Livewire 4, testing, Boost/MCP/AI SDK, framework rationale, release policy.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Credits

- [Mischa Sigtermans](https://mischa.sigtermans.me)
- Philosophy: [Taylor Otwell](https://github.com/taylorotwell)

## License

MIT. See [../../LICENSE](../../LICENSE).
