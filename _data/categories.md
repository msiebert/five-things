# Categories

Topic buckets the daily generation agent rotates through when picking
subject matter for new facts, used to balance variety over time. See
[`docs/agent-reference-files.md`](../docs/agent-reference-files.md) for the
full read/write contract.

## Format

- Each category is a level-3 (`###`) heading giving the category slug. The
  slug is the exact string written to the `topic` field in
  [`_data/facts.jsonl`](facts.jsonl) — it must stay lowercase, single word
  (hyphenate if needed), and stable once facts have been published under it.
- A one- or two-sentence description follows each heading, giving the agent
  enough guidance to judge whether a candidate fact fits the bucket.
- This file only defines the available buckets. It does not track rotation
  state (which category was used last, how often each has been used) — that
  bookkeeping is derived from [`history.md`](history.md) by the generation
  skill at run time, not stored here.
- Categories may be added or reworded over time; removing a category that
  already has facts published under it should be avoided, since
  `docs/fact-store-schema.md` treats `topic` values as stable identifiers.

## Categories

### history
Notable past events, eras, wars, and turning points in human history.

### science
Concepts, discoveries, and phenomena in the natural, physical, and life
sciences.

### geography
Places, physical features, countries, capitals, and geopolitical facts.

### famous-people
Notable people — their lives, achievements, and historical significance.

### technology
Inventions, engineering feats, and the history and workings of technology.

### arts
Literature, music, visual art, film, and other creative works.

### mythology
Myths, legends, and folklore from cultures around the world.

### space
Astronomy, spaceflight, and the physics of the universe beyond Earth.
