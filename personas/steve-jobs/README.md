# Steve Jobs

Channels Steve Jobs, reframing the question before answering.

Steve evaluates products, strategies, teams, and presentations through the lens of Jobs's philosophy as documented by the people who worked alongside him. Binary verdicts. Specific reasoning. No hedging.

## What Steve is good at

- Cutting feature lists down to one priority. The Simple Stick.
- Reframing strategic questions before answering them.
- Calling out over-design, over-engineering, and over-process.
- Spotting where the experience breaks at the seams between products.
- Evaluating teams against A-player standards.
- Critiquing pitches, demos, and keynote structure.

## Example

**Input:** 'We're building a project management tool. We have task boards, time tracking, invoicing, team chat, file storage, and a wiki.'

**Steve:**

> **Verdict:** This is not there yet.
>
> **The Real Problem:** You don't have a product. You have six products pretending to be one. A product with six priorities has no priorities. Which one is so good that someone would switch from their current tool? If the answer is 'the combination,' you've already lost.
>
> **What to Kill:** Time tracking, invoicing, team chat, file storage, wiki. All of them.
>
> **What Remains:** Task boards. Make the best task board anyone has ever used.
>
> **Next:** Pick the one thing. Kill the other five. Today.

## Installation

```
/plugin marketplace add mischasigtermans/by-mischa
/plugin install steve-jobs@by-mischa
```

### Requires

- Claude Code
- [Personas plugin](https://github.com/mischasigtermans/claude-personas/tree/main/manager) for threads and memory
- [Parley plugin](https://github.com/mischasigtermans/claude-parley), used by Personas as transport

## With the Personas plugin

Per-project memory: Steve in your Laravel app remembers your launch plan; Steve in your Rust crate remembers the API decisions. Threads continue across CC sessions until you move on, then Steve writes 3-8 takeaway bullets to `memory.md` so the next conversation starts where this one ended.

Without the Personas plugin, Steve still loads his voice and runs his slash commands, but every conversation is fresh.

## What's inside

- 25-item Jobs-ism checklist covering product, strategy, people, and execution.
- Ten knowledge modules: product design, leadership, strategy, simplicity, presentation, negotiation, innovation, Zen aesthetics, marketing and brand, decision frameworks. Loaded on demand.
- Six slash commands: `/hello`, `/evaluate`, `/strategy`, `/simplify`, `/team`, `/pitch`.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Credits

- [Mischa Sigtermans](https://github.com/mischasigtermans)
- Philosophy: Steve Jobs, as documented by Walter Isaacson, Brent Schlender, Jony Ive, Ed Catmull, Tony Fadell, Ken Segall, Guy Kawasaki, Bob Iger, David Yoffie, and Hayashi Nobuyuki.

## License

MIT. See [../../LICENSE](../../LICENSE).
