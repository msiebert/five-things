# Agent Reference Data Files

Two small supporting files the daily generation agent consults before each
run and updates after each run, so it can pick a fresh, varied topic without
repeating recent subject matter. Both are markdown rather than raw JSON,
since they exist primarily to be read and written by an AI agent, and
markdown is a more natural format for that than JSON.

## File locations

```
_data/categories.md
_data/rotation-state.md
```

Placed alongside [`_data/facts.jsonl`](../_data/facts.jsonl) — `_data/` is
already this repo's convention for the generation agent's flat data files,
regardless of Jekyll's own auto-loading rules for the directory (see
[`fact-store-schema.md`](fact-store-schema.md#file-location) for that
caveat).

## `categories.md`

Lists the topic buckets (`history`, `science`, `geography`, `famous-people`,
etc.) the agent rotates through to balance variety over time, in the exact
order the rotation follows. Each bucket's slug is the exact string used in
the `topic` field of `facts.jsonl`. See
[`_data/categories.md`](../_data/categories.md) for the format and current
list.

This file changes rarely — only when a category is added or reworded. The
daily generation run does not write to it.

## `rotation-state.md`

Holds a single piece of state — the last category used and the date it was
used — so each run can advance to the next category in `categories.md`
without needing any history of prior runs. It is **overwritten in place**
each run, never appended to, so it stays a fixed, small size forever. See
[`_data/rotation-state.md`](../_data/rotation-state.md) for the format.

Note what this file deliberately does *not* do: it doesn't log past topics
or questions. Duplicate avoidance is handled separately, by searching
`facts.jsonl` itself (see below) rather than keeping a second copy of that
information here.

## Read/write contract

**Before a run**, the generation skill reads:

1. `_data/categories.md` — the full ordered list of category buckets.
2. `_data/rotation-state.md` — the last category used, to determine the next
   one in sequence (wrapping to the top after the last category).
3. `_data/facts.jsonl` — keyword-searched for existing questions/answers
   related to each candidate fact, to avoid publishing a near-duplicate. The
   exact search/matching strategy is an open question tracked separately —
   this contract only guarantees the data is available to search, not how
   matches are judged.

**After a run**, the generation skill writes:

1. New records appended to `_data/facts.jsonl`, per
   [`fact-store-schema.md`](fact-store-schema.md).
2. `_data/rotation-state.md` overwritten (not appended) with the category
   just used and today's date.

`categories.md` is not written to as part of a normal run — only edited
manually when the set of buckets changes.

## Non-goals

This contract defines file formats, locations, and the read/write timing
only. It does *not* define:

- The exact rotation-advancement rule beyond "next category in list order"
  (e.g. whether a category can ever be skipped).
- The duplicate-detection logic for comparing a candidate fact against
  `facts.jsonl` (search strategy, similarity threshold, etc.).

Both are open questions tracked in separate issues.
