# Agent Reference Data Files

Two small supporting files the daily generation agent consults before each
run and updates after each run, so it can pick a fresh topic and avoid
repeating recent subject matter. Both are markdown rather than raw JSON,
since they exist primarily to be read and written by an AI agent, and
markdown is a more natural format for that than JSON.

## File locations

```
_data/categories.md
_data/history.md
```

Placed alongside [`_data/facts.jsonl`](../_data/facts.jsonl) — `_data/` is
already this repo's convention for the generation agent's flat data files,
regardless of Jekyll's own auto-loading rules for the directory (see
[`fact-store-schema.md`](fact-store-schema.md#file-location) for that
caveat).

## `categories.md`

Lists the topic buckets (`history`, `science`, `geography`, `biography`,
etc.) the agent rotates through to balance variety over time. Each bucket's
slug is the exact string used in the `topic` field of `facts.jsonl`. See
[`_data/categories.md`](../_data/categories.md) for the format and current
list.

This file changes rarely — only when a category is added or reworded. The
daily generation run does not write to it.

## `history.md`

Logs each day's published topics and questions, one section per date, so
the agent can check recent coverage and avoid near-duplicates. See
[`_data/history.md`](../_data/history.md) for the format and sample entry.

## Read/write contract

**Before a run**, the generation skill reads:

1. `_data/categories.md` — the full list of available category buckets.
2. `_data/history.md` — recent days' topics and questions, to check what's
   already been covered and steer away from near-duplicate subject matter.
   How far back to look, and the exact duplicate/rotation logic, are open
   questions tracked separately — this contract only guarantees the data is
   available to read, not how it's weighted.

**After a run**, the generation skill writes:

1. New records appended to `_data/facts.jsonl`, per
   [`fact-store-schema.md`](fact-store-schema.md).
2. A new `### YYYY-MM-DD` section appended to `_data/history.md`, with one
   `- **{topic}**: {question}` bullet per fact just published, in the same
   order as their `id` sequence numbers. The date and topics/questions must
   match what was just written to `facts.jsonl`.

`categories.md` is not written to as part of a normal run — only edited
manually when the set of buckets changes.

## Non-goals

This contract defines file formats, locations, and the read/write timing
only. It does *not* define:

- The rotation/balancing algorithm across categories.
- The duplicate-detection logic for comparing candidate topics against
  `history.md`.

Both are open questions tracked in separate issues.
