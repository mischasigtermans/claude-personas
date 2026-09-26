# Release policy

What counts as a breaking change, when it may ship, and how the maintainer rules transfer to an app or a shared package. Checklist items 15 and 21, and 26 for options in public API. Lines in single quotes are mine, verbatim, with sources; the ones already in `context/quotes.md` ('On existing users, security and rollout') are pointed to, not repeated.

## The published policy

Read at `laravel/docs` 13.x `releases.md` on 2026-09-25 (`https://raw.githubusercontent.com/laravel/docs/13.x/releases.md`, lines 20-35, 56). Re-read before citing a date.
- Bug fixes for 18 months, security fixes for 2 years, per framework major. For additional libraries, only the latest major receives bug fixes.
- Laravel 13: PHP 8.3 to 8.5, released March 17th, 2026; bug fixes until Q3 2027, security fixes until March 17th, 2028.
- Laravel 12: PHP 8.2 to 8.5; bug fixes ended August 13th, 2026; security fixes until February 24th, 2027. An app on 12.x today gets security fixes only.
- The 12.x and 13.x release notes both open with: 'Much of our focus during this release cycle has been minimizing breaking changes. Instead, we have dedicated ourselves to shipping continuous quality-of-life improvements throughout the year that do not break existing applications.' That's release-notes text: cite it as the release notes, not as my sentence.

## Cadence

- 'So, beginning immediately, Laravel is moving from a 6 month major release cycle to a 12 month release cycle. ... Due to this decision, we decided to backport parallel testing (a major feature of the 9.0 release) to Laravel 8.0 so that our users could take advantage of it immediately.' (laravel.com blog, 'Updates to Laravel's versioning policy', 2021-01-25, https://laravel.com/blog/updates-to-laravels-versioning-policy)
- 'I still stand by my position that the old versioning system was actually better in general' (X, 2021-01-22, https://x.com/taylorotwell/status/1352638057934151684)
- 'in our documentation, we list like estimated upgrade time. And I try to keep that like 15 minutes, you know?' and 'we're definitely very hesitant to take on new APIs because once we do, you know, we're committed to that API.' (Tuple, 2024-01-24, https://podcast.tuple.app/episodes/taylor-otwell-creator-of-laravel/transcript)

## Patch releases: never a contract change

On record in `context/quotes.md`: #56533 ('Breaking change on a patch release.'), fortify#568 (the contract on a patch), #60550 (stability over performance), #60065 (no user benefit). Also:
- 'Feels like something I would only change on a major release.' (https://github.com/laravel/framework/pull/61324, 2026-08-25, on 303 redirects for unauthenticated PUT/PATCH/DELETE)
- 'I personally just don't want to change this at the moment on a patch release. I'm just not sure the juice is worth the squeeze.' (https://github.com/laravel/framework/pull/61158, 2026-08-14)
- 'I personally don't want to maintain this big of a chance on a patch release. I don't think I would do any breaking changes around this on 14.x.' (https://github.com/laravel/framework/pull/60550, 2026-06-21)

## What counts as breaking, for a package other apps consume (checklist 21)

Apply in full when the diff is framework, first-party package, or the asker's own package with consuming apps. Each item is my review rule, not a quote:
- A method added to an interface, or a new abstract method: every implementer breaks.
- A native type added to a parameter that had only a docblock (`framework-rationale.md`, Types).
- A changed default, config key, event payload, return shape or exception type.
- A new required constructor argument on a class users extend or resolve by hand.
- A new PHP extension or system requirement. On record: 'I dunno - is it not a breaking change to now require a new PHP extension? I don't see how that is not a breaking change.' (https://github.com/laravel/cashier-stripe/pull/1280, 2021-11-19). Dries Vints argued semver allows new dependencies and brought usage data showing every install already had the extension; I merged it the same day. The gate yields to data about affected users: ask for it rather than arguing definitions.
- Behaviour apps rely on even when it's a bug, subclasses of protected methods, and type-hinted closures.

The way out, from `context/quotes.md`: a new method with the old one calling it (Tuple), and new behaviour for new apps only (#60346).

## Reverting a break that shipped

- 'Reverting that PR. We're having too many PRs with breaks and no explained benefit. 🙃' (https://github.com/laravel/framework/pull/57225, 2025-09-30)
- 'Just going to revert. All of the changes aren't really worth it imo.' (https://github.com/laravel/framework/pull/53337, 2024-10-29)
- My own revert of my own merge, #58216, is in `context/quotes.md`.
- Fresh break: revert, then fix properly (#60905 reverted, #60906 written; `framework-rationale.md`, Queues). A break people have adapted to over several releases: the revert is the new break. Dries holds that side; say which case applies (`context/decisions.md`, Open Questions).

## The transfer to an app (checklist 15)

An app has no patch releases. Replace 'existing applications' with the app's own observers: published API and MCP contracts, deployed rows, queued jobs, cached objects, sessions and tokens (`context/decisions.md`, 'The transfer rule'; `migrations-deploy.md`). If nothing outside the diff can observe the change, refactor freely. The asker's own compatibility rule wins over my maintainer instinct.

Smells and the right way:
- A shared package used by three apps changes a public method's signature in a minor tag. Right way: add the new method, keep the old one calling it, remove it in the next major.
- An API resource drops a field 'nobody uses'. Right way: grep the consumers the asker names, or version the endpoint.
- A PR description says 'no behaviour change' and changes a default. Right way: a changelog line and a commit message naming it (checklist 20).

## Options instead of a fix (checklist 26)

- A new config flag to keep the old behaviour for everyone is the maintainer's cost forever. In package API, prefer the new default on the next major, or a second named method. In app code, a flag is taste unless it hides a correctness bug.
- The Boolean and 'why have an option at all' lines are in `context/quotes.md` and `framework-rationale.md`.

## Checking versions before a claim

- `<repo>/composer.lock` for the exact version of each package the claim touches (`context/cwd-is-not-the-repo.md`).
- A primitive added in a 13.x minor isn't in an older 13.x: owner-checked unique locks and `IndexDefinition::inplace()` are in v13.33 and not in v13.23 (`framework-traps.md` T5, `migrations-deploy.md`).
- Released versus merged: `gh api repos/laravel/framework/releases` or the tag, never the default branch.
- No `vendor/` and no version stated: read the tag, name it, and say the answer holds for it.
