# Central Fact Store Schema

The central fact store is the single source of truth for all trivia facts in
5 Things. It is a flat file committed to this repo — not a database — and is
written to by the daily generation agent (append-only) and read by the
Take-25 quiz (full-file client-side cache, looked up by `id`).

## File location

```
_data/facts.jsonl
```

`_data/` is Jekyll's conventional home for structured data files. Note that
`.jsonl` is **not** one of Jekyll's auto-loaded data formats (`.yml`,
`.yaml`, `.json`, `.csv` are read automatically into `site.data`) — consuming
this file from a Jekyll build requires an explicit plugin/generator or a
build step that reads it directly. This is a deliberate tradeoff: JSONL's
append-friendliness for the daily generation agent matters more than
Jekyll's zero-config data auto-loading. Wiring up that consumption is future
work, not part of this schema.

## Format

- **JSONL (newline-delimited JSON)**: exactly one JSON object per line.
- UTF-8 encoding, no trailing commas within a line.
- The file always ends with a trailing newline after the last record.
- No blank lines between records.

JSONL is used instead of a single JSON array so the daily generation agent
can append a new day's facts by writing lines to the end of the file,
without parsing or re-serializing everything already there.

## Fields

| Field        | Type   | Required | Description |
|--------------|--------|----------|-------------|
| `id`         | string | yes      | Unique fact ID, format `YYYY-MM-DD-N` (see below). |
| `question`   | string | yes      | The trivia question text. |
| `answer`     | string | yes      | The short answer. |
| `topic`      | string | yes      | Category bucket, e.g. `history`, `science`, `geography`, `biography`. |
| `date_added` | string | yes      | ISO 8601 date (`YYYY-MM-DD`) the fact was added; matches the date portion of `id`. |

The full explanatory paragraph for each fact is **not** stored in the fact
store. It lives only on that day's rendered daily page, keeping this file
small enough for the Take-25 quiz to fetch and cache in full on every visit.
See [Linking to the explanation](#linking-to-the-explanation) below for how
to find it from a fact record alone.

### `id` format

```
YYYY-MM-DD-N
```

- `YYYY-MM-DD` is the date the fact was added.
- `N` is a 1-based sequence number that **resets to 1 each day**.
- Example: the five facts added on 2026-07-31 are IDs `2026-07-31-1` through
  `2026-07-31-5`.

This format is chosen for human readability (the ID alone tells you when a
fact was learned) over maximal compactness.

## Linking to the explanation

Each fact's full explanatory paragraph is published on that day's daily
page, not stored in this file. The link to it is fully derivable from `id`
alone, so no URL field is stored:

- Daily pages live at `/daily/YYYY-MM-DD/`, where the date is the first 10
  characters of `id`.
- On that page, each fact is rendered under a heading with
  `id="{fact id}"`.
- The deep link to a specific fact's explanation is therefore:

  ```
  /daily/{date}/#{id}
  ```

  Example: fact `2026-07-31-1` → `/daily/2026-07-31/#2026-07-31-1`.

This convention must be followed by the daily page templates once they're
built (not yet part of this scaffold).

## Append workflow (for the daily generation agent)

1. Determine today's date, `YYYY-MM-DD`.
2. Read the existing file to find the highest existing sequence number `N`
   already used for today's date prefix (0 if none exist yet today —
   normally the case, since generation runs once per morning).
3. Append new records starting at `N + 1`, one JSON object per line, without
   modifying or re-serializing any existing lines.
4. Ensure the file still ends with a trailing newline after appending.

## Validation notes

- `id` values must be unique across the whole file and strictly increasing
  (no gaps, no duplicates) within a given date.
- There is currently no automated schema validation (e.g. a JSON Schema file
  or lint script) — this is a known gap, consistent with the product doc's
  list of open questions, and may be addressed in a future issue.

## Example record

```json
{"id": "2026-07-31-1", "question": "What is the largest planet in our solar system?", "answer": "Jupiter", "topic": "science", "date_added": "2026-07-31"}
```

Pretty-printed for readability:

```json
{
  "id": "2026-07-31-1",
  "question": "What is the largest planet in our solar system?",
  "answer": "Jupiter",
  "topic": "science",
  "date_added": "2026-07-31"
}
```

See [`_data/facts.jsonl`](../_data/facts.jsonl) for a full sample file with
five example records.
