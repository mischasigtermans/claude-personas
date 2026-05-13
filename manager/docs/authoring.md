# Authoring a persona plugin

A persona is a Claude Code plugin that ships a `persona.json` marker at its root. The Personas manager auto-discovers it after install, and `/personas enable <name>` makes it callable.

## Minimum shape

```
my-persona/
├── .claude-plugin/plugin.json     standard plugin manifest
├── README.md
├── CHANGELOG.md
├── CLAUDE.md                      the persona's system prompt
├── persona.json                   discovery marker + metadata
└── context/                       voice, quotes, personality (auto-loaded)
    ├── voice.md
    ├── quotes.md
    ├── personality.md
    └── anti-patterns.md
```

## persona.json

```json
{
  "name": "marie-curie",
  "displayName": "Marie Curie",
  "aliases": ["marie", "curie"],
  "description": "Channels Marie Curie's empirical rigor and persistence in the face of skepticism.",
  "model": "opus",
  "traits": ["science", "rigor", "persistence"]
}
```

| Field | Required | Effect |
|---|---|---|
| `name` | yes | Canonical identifier. Matches the plugin name and the slug used everywhere. |
| `displayName` | yes | Shown in `/personas list`. |
| `aliases` | yes | Short forms the dispatcher resolves ('marie' → 'marie-curie'). |
| `description` | yes | Single sentence shown in the discovery menu. |
| `model` | yes | Claude model the dispatcher uses for this persona's turns. |
| `traits` | yes | Tags surfaced in `/personas list` and used by the discovery menu. |

Do **not** include an `mcpServers` block. The Personas manager handles parley peer registration via hooks. Personas plugins must not bundle parley as their own MCP server.

## CLAUDE.md

The persona's system prompt. The dispatcher reads this file as the body for every turn. Write it as if you're addressing the persona itself: voice, principles, output format, scope boundaries.

Don't reference `@context/...` in CLAUDE.md. The dispatcher globs `context/*.md` and reads every file before each turn. Your CLAUDE.md only needs to contain the persona's defining content; the voice files are loaded automatically.

## context/

Each `.md` file at the top level of `context/` is loaded before every turn. Conventional file names:

- `voice.md`: how the persona speaks. Registers, vocabulary, what's off-limits.
- `quotes.md`: documented quotes that shape natural language.
- `personality.md`: conditional personality modes triggered by content.
- `anti-patterns.md`: what the persona rejects and why.

You can ship fewer or more files; the dispatcher reads everything in `context/*.md`. Nested subdirectories are not picked up.

## skills/

Optional. Skills inside your persona plugin activate when their description matches. Personas in this repo use a `search-knowledge` skill that loads deep guidance on specific topics on demand. Follow the same pattern: keep CLAUDE.md tight, push reference-heavy content into a skill that the persona can call when needed.

## commands/

Optional. Slash commands scoped to your persona. Steve has `/steve-jobs:hello`, `/steve-jobs:evaluate`, etc. Useful for orientation and structured asks.

## Templates

Fork any of the four personas in this repo:

- [steve-jobs](../../personas/steve-jobs/): commands + rules + context + skills, fuller shape.
- [taylor-otwell](../../personas/taylor-otwell/), [raymond-hettinger](../../personas/raymond-hettinger/), [david-tolnay](../../personas/david-tolnay/): leaner shape (CLAUDE.md + context + skills).

## Publishing

Once your plugin is ready, publish it to a marketplace. For your own marketplace, follow the [Anthropic plugin marketplace docs](https://code.claude.com/docs/en/plugin-marketplaces). To list your persona alongside others in `by-mischa`, send a PR to [mischasigtermans/by-mischa](https://github.com/mischasigtermans/by-mischa) adding a plugin entry.
