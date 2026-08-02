---
name: daily-fact-generation
description: Generates the day's 5 trivia facts for the 5 Things site — picks a topic via the category rotation, researches it, appends the facts to the central fact store, renders that day's static page, and advances the rotation state. Invoked once per morning by a scheduled Cowork task, with no other prompting.
---

# Daily Fact Generation

Produces one day's worth of content for 5 Things: five researched trivia
facts on a single topic, appended to the central fact store and published
as a static daily page.

This skill is meant to be run **stand-alone**, with no extra instructions
from the invoker beyond "run the daily fact generation skill." Everything
it needs to decide what to do lives in the repo files it reads below.

## Repo files this skill reads and writes

| File | Read | Written |
|---|---|---|
| `_data/categories.md` | yes | no |
| `_data/rotation-state.md` | yes | overwritten in place |
| `_data/facts.jsonl` | yes (duplicate search) | appended |
| `daily/YYYY-MM-DD/index.html` | no | created |

See `docs/agent-reference-files.md` and `docs/fact-store-schema.md` for the
full format/contract of these files. This skill assumes those contracts;
if either doc changes, update the steps below to match.

## Procedure

Run these steps in order. Do not skip or reorder them.

### 1. Pick today's topic

1. Read `_data/categories.md` and note the full ordered list of category
   slugs.
2. Read `_data/rotation-state.md` and note `last_category` and
   `last_run_date`.
3. The next category is the one immediately after `last_category` in the
   `categories.md` order, wrapping to the first category if `last_category`
   was the last one in the list. This is the day's category.
4. Within that category, choose a specific, concrete topic (e.g. category
   `space` → topic "Jupiter", not "space" itself). Prefer a topic distinct
   from ones already visible for this category in `_data/facts.jsonl` (grep
   the file for the category's `topic` slug and skim recent `question`
   values before picking, so you don't immediately repeat a subject).

### 2. Research the topic

1. Perform web research on the chosen topic.
2. From that research, select the 5 most useful, commonly known, or
   influential facts about it — the kind of facts a well-informed
   generalist would consider the highlights, not obscure trivia. (Example:
   for "Jupiter," facts like its status as the largest planet, its Great
   Red Spot, its moon count, its role in the early solar system, and the
   Galileo/Juno missions are the kind of thing to surface.)
3. Before finalizing each candidate fact, search `_data/facts.jsonl` for
   similar `question`/`answer` text (simple keyword search) and swap out
   any candidate that's a near-duplicate of something already published.
   This is a best-effort check, not exhaustive deduplication — see
   Known Limitations below.

### 3. Write each fact

For each of the 5 facts, write:

- A short **question** (the trivia prompt).
- A short **answer**.
- An **explanatory paragraph** (3-6 sentences) that gives real context —
  not a one-word or one-sentence restatement of the answer. Assume the
  reader wants to actually learn something, not just check a fact.

### 4. Append to the fact store

1. Determine today's date `YYYY-MM-DD`.
2. Read `_data/facts.jsonl` to confirm no records already exist for
   today's date (normally true, since this runs once per morning). If any
   do, continue numbering after the highest existing sequence number for
   today rather than restarting at 1.
3. Append 5 JSON lines to `_data/facts.jsonl`, one per fact, with:
   - `id`: `YYYY-MM-DD-1` through `YYYY-MM-DD-5` (or continuing the
     sequence per step 2).
   - `question`, `answer`, `topic` (today's category slug), `date_added`
     (`YYYY-MM-DD`).
4. Follow the existing file's exact JSONL conventions: one compact JSON
   object per line, UTF-8, no trailing commas, no blank lines, and the file
   still ends with a trailing newline after the append.
5. Do **not** rewrite or reformat any existing line in the file.

### 5. Render the day's static page

Create `daily/YYYY-MM-DD/index.html` (matching the URL contract
`/daily/YYYY-MM-DD/` from `docs/fact-store-schema.md`) containing all 5
facts, with each fact's heading carrying `id="{fact id}"` so the deep-link
convention `/daily/{date}/#{id}` resolves correctly.

Until the real Daily Learning Page template (tracked separately) exists,
use this minimal self-contained page — plain HTML, no Jekyll layout
dependency, so it renders correctly today and can be swapped for the real
template later without touching the fact data:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>5 Things — {{ today's date, e.g. July 31, 2026 }}</title>
</head>
<body>
  <h1>5 Things — {{ today's date }}</h1>
  <p>Today's topic: {{ topic title, e.g. "Jupiter" }} ({{ category slug }})</p>

  <article id="{{ fact 1 id }}">
    <h2>{{ fact 1 question }}</h2>
    <p><strong>{{ fact 1 answer }}</strong></p>
    <p>{{ fact 1 explanatory paragraph }}</p>
  </article>

  <!-- repeat article block for facts 2-5 -->
</body>
</html>
```

**When the real Daily Learning Page template lands, switch this step to
use it instead of the placeholder markup above** — the fact content and
IDs produced by steps 3-4 do not need to change, only how they're
rendered.

### 6. Advance the rotation state

Overwrite `_data/rotation-state.md` (do not append — replace the existing
"Current state" values) so that:

- `last_category` is today's category slug.
- `last_run_date` is today's date (`YYYY-MM-DD`).

This is the only step from the original spec that differs from a literal
"append to a history file": the reference-file design (see
`docs/agent-reference-files.md`) replaced an append-only history log with
this fixed-size, overwrite-in-place rotation state, so step 6 here is an
overwrite, not an append.

## Known limitations

These are explicitly out of scope for this skill and tracked as open
questions elsewhere, per the design docs it depends on:

- **Duplicate avoidance** is a simple keyword search against
  `_data/facts.jsonl` (step 2.3) plus picking a topic distinct from
  category peers (step 1.4). There is no semantic similarity check or
  guaranteed non-duplication — a near-duplicate fact could still slip
  through.
- **Rotation algorithm** is strictly "next category in `categories.md`
  order, wrapping at the end" (step 1.3). It does not weight categories by
  how long it's been since each was used, skip categories, or otherwise
  balance beyond simple round-robin order.
- **Day page rendering** (step 5) uses a placeholder template pending the
  real Daily Learning Page template. Swap it in once available.

## Failure behavior

If any step fails (research turns up nothing usable, a file is missing or
malformed, etc.), stop without partially appending to `_data/facts.jsonl`
or writing a partial day page — a half-written day is worse than a missed
one. There is no backfill mechanism for a missed day; that is handled (via
failure notification) by the scheduled-task wiring, not by this skill.
