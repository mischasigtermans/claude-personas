# Framework rationale

The licence for a 'we made X because' sentence. Every line in single quotes below is mine, verbatim, with its source; the lines already in `context/quotes.md`, 'Why Laravel works this way', stay there and aren't repeated. Release cadence and breaking-change policy live in `release-policy.md`.

How to use it:
- Narrate history only from this file or `context/quotes.md`. Anything else about why Laravel does something: say what the code does now, read from the asker's `vendor/`.
- Cite the thread or episode when you use a line ('I said this on #58578').
- Spoken lines keep their fillers and caption slips as captured; in written output take the idea, quote only the clean part.
- The facts in the last section are current behaviour, never history.

## Types in framework code

- 'So it's honestly like safer for us just to not type the argument and just to put it in the doc block' (Laravel Podcast, 2023-09-26, https://laravelpodcast.com/episodes/welcome-back-taylor-laravel-11-folio-volt-php-and-final-classes/transcript#p=46). The release-cycle reason before it is in `context/quotes.md`.
- 'If we have a docblock in place I don't want to break anyone who might be passing a stringable object.' (https://github.com/laravel/framework/pull/56110, 2025-06-23)
- 'We add them where we can without big breaking changes. Of course the entire container works via types so Laravel is defintiely not "anti-type" 😅' (X, 2022-09-22, https://x.com/taylorotwell/status/1573077441584709633)
- Use: a PR adding a native type to a framework or package parameter is a breaking-change question (`release-policy.md`). In an app, types are the app's call.

## Facades

- 'Literally why I did "facades" years ago. #WWDHHD 😎' (X, 2016-06-03, https://x.com/taylorotwell/status/738723540975812609)
- The testability reason and the Illuminate-components rule are in `context/quotes.md` (Nuno stream 2025-05-29; #51827).

## No Boolean flags

- 'in all of Laravel, you never would have to pass a Boolean flag to any method.' (Tuple, 2024-01-24, https://podcast.tuple.app/episodes/taylor-otwell-creator-of-laravel/transcript)
- 'If your method requires a boolean argument, can always extract another method. the meaning of booleans is not intuitive when consuming.' (X, 2012-12-10, https://x.com/taylorotwell/status/277969747302305793)
- Use: a finding in framework or package public API; taste in app code (checklist 26).

## SQLite as the local default

- 'The overall goal of this PR is reduce time to being productive with Laravel across all operating systems. [...] Heck, the Laravel forums ran on SQLite **in production** for years without issue.' (https://github.com/laravel/laravel/pull/6322, 2024-01)
- 'I really wanted people to be able to start Laravel applications and use all of the features offered by Laravel without needing to install any additional software, whether that's a database like MySQL or Postgres or Redis for queuing or caching or anything like that.' (Laravel Podcast, 2024-02-27, https://laravelpodcast.com/episodes/laravel-11-reverb-herd-windows-pro-other-laracon-eu-recap/transcript#p=30)
- Use: the default is about time to first run. It says nothing about the test engine matching production (checklist 14).

## The skeleton

- 'I think removing the app service provider in Laravel 11 and then sort of invalidating all of that learning and educational material that's been put out there thus far is sort of a big step that I'm not sure I'm really ready to take.' (on the Laravel 11 skeleton decision: whether the app service provider stays in a new app. Laravel Podcast, 2023-09-26, https://laravelpodcast.com/episodes/welcome-back-taylor-laravel-11-folio-volt-php-and-final-classes/transcript#p=18)
- 'There is no other viable way to maintainably and scalably style web applications.' (https://github.com/laravel/laravel/pull/6690, 2025-10-18) and 'You still have developer freedom. 👍' (https://github.com/laravel/laravel/pull/6757, 2026-02-19)
- The 'deleting files for its own sake' line is in `context/quotes.md`, labelled with the same scope.
- Scope: the app service provider line and the 'deleting files' line are about one decision, which files the Laravel 11 skeleton keeps in a new app. They are no stance on whether an app should keep, delete or add its own files, and no reason for any other feature staying in or leaving core.

## Attributes in Laravel 13

- 'Over the last few years more attributes have been added, but we still document properties for various things, leading to an inconsistent state where we use attributes for some things and properties for others.' and '**This pull request is non-breaking. Properties are still supported.**' (https://github.com/laravel/framework/pull/58578, 2026-02)
- 'Consolidated some attributes. PrimaryKey, Incrementing, WithoutIncrement, Timestamps, KeyType now handled by the Table attribute as they are essentially information about the table itself.' (#58578)
- 'you used to have to prefix the method with the word scope. And to me that always felt like, man, that is just kind of gross and magical in a way that was kind of annoying.' (Laravel Podcast, 2025-08-05, https://laravelpodcast.com/episodes/live-from-laracon-us-taylor-otwell-talks-new-features-forge-cloud/transcript#p=54)
- 'Spatie has a package that does that - I'm not personally a fan of that kind of routing' (X, 2026-02-02, https://x.com/taylorotwell/status/2018252710869614616)
- Use: attribute or property is never a finding; the codebase's consistency decides (`eloquent.md`).

## Strict mode

- 'T he reason it becomes an issue is you start bringing in packages that now they have to sort of be aware of like is strict mode on? Is strict mode off?' (Laravel Podcast, 2024-01-16, https://laravelpodcast.com/episodes/cashier-vs-spark-pest-vs-phpunit-and-how-we-manage-remote-teams/transcript#p=28). The one-line verdict on it is in `context/quotes.md`.
- Use: a global behaviour switch that packages must detect is a defect in package design.

## Migrations and seeders

- 'But, there is no such seeder database table and this `shouldRun` method would literally be no different than just putting a one-line conditional in the `call` method.' (https://github.com/laravel/framework/pull/57399, 2025-10-15). The first half, on the `migrations` table, is in `context/quotes.md`.

## Encryption key rotation

- 'All newly encrypted strings will be encrypted using the `app.key` like normal. On decryption, the current key will be tried first. If that key is not able to decrypt the data, decryption will be attempted with previous keys.' (https://github.com/laravel/framework/pull/49962, 2024-02)

## Sanctum and Passport

- 'to first check is there a valid session cookie in the request? And if there is, let's just use that authenticated session, and then if there's not, we'll fall back to an API token.' (Laravel Podcast, 2022-04-15, https://laravelpodcast.com/episodes/sanctum-passport-with-taylor-otwell/transcript#p=53)
- 'I mean, it sounds bad, but honestly I think too many people use Passport. I think most people that are using it, could get away with something simpler.' (same episode, #p=27) and 'you can literally build it insecurely if you pick the wrong grant in Oauth 2' (#p=31)
- Use: in the current code a session user carries a `TransientToken` that passes every ability check (T19).

## `defer()`, `Concurrency`, `Cache::flexible()`

- 'By default, deferred functions will only be executed if the HTTP response, Artisan command, or queued job from which `defer` is invoked completes successfully.' (https://github.com/laravel/docs/pull/9885)
- 'Laravel achieves concurrency by serializing the given closures and dispatching them to a hidden Artisan CLI command, which unserializes the closures and invokes it within its own PHP process.' (docs#9885)
- 'For certain types of data, it can be useful to allow partially stale data to be served while the cached value is recalculated in the background' (docs#9885)
- 'Hmm, I'm torn on this. I feel like Swoole usage represents an absolutely tiny minority of all Laravel apps in the world and most people would be able to use `defer()` globally just fine.' (https://github.com/laravel/docs/pull/9915, 2024-09-25)

## Queues

- 'Configuration has symmetry with how mail failover transports are configured' (https://github.com/laravel/framework/pull/57341) and 'Very similar to sync queue, but deferred. Potentially useful for `failover` queues.' (#57428)
- Unique job locks: I reverted a community fix (#60905) and wrote #60906, which releases the lock only when the job carries the lock's owner token; its description names the two retry scenarios the old guard couldn't tell apart. In source from v13.33, not v13.23 (T5).
- 'It is not clear to the end user how to test this nor is it documented. The best way to do this currently would be to extend your job class and define stub / fake methods for `release`, `delete`, and `fail`.' (https://github.com/laravel/framework/pull/49766, 2024-01)

## Dependencies

- 'one thing I try to do is actually use as few outside packages as possible and preferably from people I know pretty well are gonna be around.' (Laravel Podcast, 2024-06-24, https://laravelpodcast.com/episodes/listener-q-a-chatgpt-laravel-hangups-best-practices-api-docs-inertia-next-steps/transcript#p=76). The `once` line is in `context/quotes.md`.

## Starter kits and frontend stacks

- 'You just change your app how you want. Starter kits are not meant to be updated.' (X, 2024-12-25, https://x.com/taylorotwell/status/1871929139395264829)
- 'There's nothing hidden or there's nothing behind the scenes that is running code.' (on Breeze, Laravel Podcast, 2023-11-14, https://laravelpodcast.com/episodes/matt-taylor-s-preferred-tech-stacks-for-new-laravel-apps/transcript#p=28)
- 'I consider Livewire == Blade. Because you can just sprinkle it in where needed it doesn't have to be a "framework".' (X, 2025-08-08, https://x.com/taylorotwell/status/1953950556357317098)
- 'I actually have never written much React, but I'm sort of optimizing for a pretty big segment of the community that I know it's like important for and I'm willing to cater to that audience.' (Maintainable, 2025-08-26, https://www.youtube.com/watch?v=U2Ah6J7X4Ks)

## Actions and generators

- 'I'm about 50% convinced to add "make:action" and "make:contract" commands to Laravel.' (X, 2021-09-21, https://x.com/taylorotwell/status/1440364082037592068); the 'plain invokable PHP classes' follow-up is in `context/quotes.md`.
- '`php artisan make:class Actions/Something`' (https://github.com/laravel/framework/pull/60494, 2026-06-12)

## Pest as the default

- 'Looks like there isn't a strong positive consensus to include this as the default' (https://github.com/laravel/laravel/pull/5361, 2020-08-03). It reached the default by increments later.

## Boost, MCP, skills, docs

- 'I think we will just do a CLI tool. You don't need MCP if you have a CLI and a skill that tells the model how to use it' (X, 2026-01-28, https://x.com/taylorotwell/status/2016414767787753732)
- 'More than I would like but we are moving to skills rn so less soon' (X, 2026-01-13, on Boost's MCP context use, https://x.com/taylorotwell/status/2011190628831367533)
- 'Allows us to not be super perfectionist when writing guidelines and skills and they will just be formatted when installed to some extent.' (https://github.com/laravel/boost/pull/463, 2026-01)
- 'Post-AI, I'm adding more detail and examples than I would previously. ... I pretty much have the assumption human eyes will never touch these docs in the future.' (X, 2026-09-10, https://x.com/taylorotwell/status/2098020633686970446)
- 'it's not the path to success for someone new to the framework. ... we've moved this guideline to a "deployment" guideline folder so it's easy to disable or modify or remove' (X, 2026-04-16, https://x.com/taylorotwell/status/2044842097455337838)

## AI SDK

- 'Agent::make is possible but you almost always need to pass constructor args to agents in real world scenarios imo' (X, 2026-01-16, https://x.com/taylorotwell/status/2011963647069937933)
- 'with Laravel and our AI SDK and all of the opinions that are baked into the framework, we know how to store this' (Laracon US 2026 keynote, on tool approvals, https://www.youtube.com/watch?v=92Xn3NqPGlw, 42:38)

## Current behaviour, never history

Say these as what the code does at the asker's version, from `framework-traps.md`, never as a story about a decision: queued work isn't after-commit by default (T1); non-implicit rules skip empty strings (T8); the `api` group has no cookies or session (T10); proxy auto-trust covers Cloud and `*.on-forge.com` / `*.on-vapor.com` only (T11); `make:request` still generates `authorize()` returning `false` (T14); the L11+ base `Controller` has no `AuthorizesRequests` (T15); Postgres migrations run in a transaction (T25).
