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
| `aliases` | yes | Short forms parley resolves to this persona ('marie' → 'marie-curie'). Each alias is written as a separate entry in the extensions manifest pointing at the same path. |
| `description` | yes | Single sentence shown in the discovery menu and surfaced in `parley_peers`. |
| `traits` | yes | Tags surfaced in `/personas list`. |
| `memory` | no | Set `false` to opt this persona out of parley's durable memory. Omit (the default) to keep memory on. Carried into the extensions manifest so parley applies it. |

Do **not** include an `mcpServers` block. The Personas manager registers your persona with parley by writing the extensions manifest at `~/.claude/parley/extensions/personas.json` when the user runs `/personas enable <name>`. Persona plugins must not bundle parley as their own MCP server or write to parley state directly.

## CLAUDE.md

The persona's system prompt. When a user asks the persona a question, parley spawns claude in the persona's plugin directory; claude reads `CLAUDE.md` as it would in any other Claude Code project. Write it as if you're addressing the persona itself: voice, principles, output format, scope boundaries.

You can reference `@context/voice.md` etc. inline; Claude Code resolves @-references when loading `CLAUDE.md`. Or you can keep `CLAUDE.md` tight and rely on Claude Code's own conventions to surface adjacent context.

## context/

Optional. Convention from earlier persona iterations: hold reference-heavy material in separate files so `CLAUDE.md` stays scannable. Conventional file names if you use this pattern:

- `voice.md`: how the persona speaks. Registers, vocabulary, what's off-limits.
- `quotes.md`: documented quotes that shape natural language.
- `personality.md`: conditional personality modes triggered by content.
- `anti-patterns.md`: what the persona rejects and why.

Reference them from `CLAUDE.md` via `@context/<name>.md`. Without explicit references, only `CLAUDE.md` itself loads on persona spawn.

## skills/

Optional. Skills inside your persona plugin activate when their description matches. Personas in this repo use a `search-knowledge` skill that loads deep guidance on specific topics on demand. Follow the same pattern: keep CLAUDE.md tight, push reference-heavy content into a skill that the persona can call when needed.

## commands/

Optional. Slash commands scoped to your persona. Steve has `/steve-jobs:hello`, `/steve-jobs:evaluate`, etc. Useful for orientation and structured asks.

## Templates

Fork any persona under [personas/](../../personas/) as a starting point. Steve Jobs ships the fuller shape (commands, rules, context, skills); the others use a leaner shape (CLAUDE.md, context, skills).

## Publishing

Once your plugin is ready, publish it to a marketplace. For your own marketplace, follow the [Anthropic plugin marketplace docs](https://code.claude.com/docs/en/plugin-marketplaces). To list your persona alongside others in `by-mischa`, send a PR to [mischasigtermans/by-mischa](https://github.com/mischasigtermans/by-mischa) adding a plugin entry.
