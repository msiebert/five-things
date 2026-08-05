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
| `assets/data/facts.jsonl` | yes (duplicate search) | appended |
| `daily/YYYY-MM-DD/index.md` | no | created |

This skill is self-contained: the steps below already restate everything
needed for a normal run, drawn from `docs/agent-reference-files.md` and
`docs/fact-store-schema.md`. **Do not open those docs during a run** — they
exist for humans maintaining this skill, not as required reading each
morning. If a step below ever seems to contradict the live repo state,
that's a signal this skill file is stale and needs a human to reconcile it
against those docs, not something to resolve by reading them mid-run.

## Context discipline

`assets/data/facts.jsonl` grows by 5 lines every day and has no upper bound, so
it is the one file in this skill that must never be read in full — doing
so wastes tokens today and will eventually blow the context window
outright. Every step below that touches it says exactly how to access it;
the rule behind all of them is:

- **Never** open/cat/read the whole file, and never pass it to a tool
  without a keyword filter or line-count bound.
- **Only** access it via a keyword search (grep/ripgrep for a specific
  category slug or candidate question/answer term) or a bounded tail read
  (the last N lines — records are always appended in date order, so recent
  history is always at the end).
- Keep N small. A handful of recent days (roughly the last 20-50 lines) is
  enough context for both the topic-repeat check and the same-day
  numbering check below — there is never a reason to pull more.

`_data/categories.md` and `_data/rotation-state.md` are small and
fixed/slow-growing by design (see their docs), so reading them in full is
fine and expected — this discipline applies specifically to
`assets/data/facts.jsonl`.

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
   from ones already visible for this category recently. Check this with a
   **keyword grep** for the category's `topic` slug against
   `assets/data/facts.jsonl` (e.g. `grep '"topic": "space"' assets/data/facts.jsonl`),
   not a full-file read — see Context discipline above. If that turns up
   many matches, it's enough to skim the most recent few.

### 2. Research the topic

1. Perform web research on the chosen topic.
2. From that research, select the 5 most **notable and influential** facts
   about it — but explicitly favor genuine learning over trivia the reader
   almost certainly already knows. This is a daily "I actually learned
   something" product, not an elementary-school quiz.
   - Reject candidates that are common knowledge or the first thing anyone
     would say about the topic (e.g., for "Jupiter": "it's the largest
     planet" is too obvious to use).
   - Prefer facts that are specific, surprising, mechanistic, or
     little-known but still verifiably significant — the kind of thing
     that makes someone say "huh, I didn't know that" rather than "sure,
     everyone knows that." (For "Jupiter": its Great Red Spot has been
     measurably shrinking for over a century, or its immense gravity
     deflects a significant share of comets that would otherwise threaten
     the inner solar system, are the right altitude — specific and
     non-obvious, but still meaningfully important, not obscure trivia for
     its own sake.)
   - Still avoid true obscurity/trivia-for-trivia's-sake — each fact should
     be something a reasonably informed person would recognize as
     important once they read it, even if they didn't know it before.
3. Before finalizing each candidate fact, check `assets/data/facts.jsonl` for
   similar `question`/`answer` text via a **keyword grep** on distinctive
   terms from the candidate (e.g. `grep -i "great red spot"
   assets/data/facts.jsonl`), not a full-file read — see Context discipline
   above. Swap out any candidate that's a near-duplicate of something
   already published. This is a best-effort check, not exhaustive
   deduplication — see Known Limitations below.

### 3. Write each fact

For each of the 5 facts, write:

- A short **question** (the trivia prompt).
- A **one-word or one-name answer** — a single term, number, date, place,
  or proper name (e.g. `Mosaic`, `GET`, `NeXT`, `Ted Nelson`, `1965`), not
  a phrase or sentence. This matters for the quiz UI, where users
  type the answer in themselves — a short answer is quick to type and easy
  to judge as right/wrong. If the most interesting angle on a fact would
  naturally take a multi-word phrase to answer, reshape the *question* to
  ask for the single compact term at the heart of it instead (e.g. ask
  "What computer brand ran the whole early Web?" → `NeXT`, rather than
  asking for a whole sentence about the setup) — the depth still goes in
  the explanatory paragraph, not the answer field.
- An **explanatory paragraph** (3-6 sentences) that gives real context —
  this is where the interesting, non-obvious detail actually lives, since
  the question/answer pair itself is now deliberately terse. Assume the
  reader wants to actually learn something, not just check a fact.

### 4. Append to the fact store

1. Determine today's date `YYYY-MM-DD`.
2. Confirm no records already exist for today's date by checking a
   **bounded tail** of `assets/data/facts.jsonl` (e.g. the last 5-10 lines — new
   records are always appended in date order, so today's, if any, would be
   there), not a full-file read — see Context discipline above. This is
   normally empty, since this runs once per morning; if it isn't, continue
   numbering after the highest existing sequence number for today rather
   than restarting at 1.
3. Append 5 JSON lines to `assets/data/facts.jsonl`, one per fact, with:
   - `id`: `YYYY-MM-DD-1` through `YYYY-MM-DD-5` (or continuing the
     sequence per step 2).
   - `question`, `answer`, `topic` (today's category slug), `date_added`
     (`YYYY-MM-DD`).
4. Follow the existing file's exact JSONL conventions: one compact JSON
   object per line, UTF-8, no trailing commas, no blank lines, and the file
   still ends with a trailing newline after the append.
5. Do **not** rewrite or reformat any existing line in the file.

### 5. Render the day's static page

Create `daily/YYYY-MM-DD/index.md` (matching the URL contract
`/daily/YYYY-MM-DD/` from `docs/fact-store-schema.md`) using the real
Daily Learning Page template. The page is nothing but YAML front matter —
`layout: daily` (defined in `_layouts/daily.html`) renders the answer-first
reading-card view (question, answer, explanation, "add to my collection"
button) for each entry in `facts`, and gives each card `id="{fact id}"` so
the deep-link convention `/daily/{date}/#{id}` resolves correctly. No
content is needed below the front matter:

```markdown
---
layout: daily
title: "Daily Learning — {{ today's date, e.g. July 31, 2026 }}"
permalink: /daily/{{ YYYY-MM-DD }}/
date: {{ YYYY-MM-DD }}
topic: "{{ today's topic title, e.g. Jupiter }}"
facts:
  - id: "{{ fact 1 id }}"
    question: "{{ fact 1 question }}"
    answer: "{{ fact 1 answer }}"
    topic: {{ today's category slug }}
    explanation: >-
      {{ fact 1 explanatory paragraph }}
  - id: "{{ fact 2 id }}"
    question: "{{ fact 2 question }}"
    answer: "{{ fact 2 answer }}"
    topic: {{ today's category slug }}
    explanation: >-
      {{ fact 2 explanatory paragraph }}

  <!-- repeat entries for facts 3-5 -->
---
```

The top-level `date` and `topic` fields are not decorative — `_layouts/daily.html`
and the home page's journal listing both read them (`page.date`, `page.topic`),
so they must be set on every run, not just the `facts` list.

**`topic` is the bare topic title only — never append the category in
parentheses.** Write `topic: "Jupiter"`, not `topic: "Jupiter (space)"`. The
category already lives in each fact's own `topic` field inside `facts`
(the per-fact category slug, e.g. `space`) and on that category's own page
(`category/{{ slug }}/index.md`, see below) — repeating it in parentheses
on the page-level title is redundant and has slipped in before. If you're
ever unsure, check a recent entry under `daily/` first rather than
inventing a format.

### 6. Advance the rotation state

Overwrite `_data/rotation-state.md` (do not append — replace the existing
"Current state" values) so that:

- `last_category` is today's category slug.
- `last_run_date` is today's date (`YYYY-MM-DD`).

(Historical note for maintainers, not needed during a run: this overwrite
replaced an earlier append-only history-log design — see
`docs/agent-reference-files.md`.)

## Known limitations

These are explicitly out of scope for this skill and tracked as open
questions elsewhere (no need to chase them down during a run):

- **Duplicate avoidance** is a simple keyword search against
  `assets/data/facts.jsonl` (step 2.3) plus picking a topic distinct from
  category peers (step 1.4). There is no semantic similarity check or
  guaranteed non-duplication — a near-duplicate fact could still slip
  through.
- **Rotation algorithm** is strictly "next category in `categories.md`
  order, wrapping at the end" (step 1.3). It does not weight categories by
  how long it's been since each was used, skip categories, or otherwise
  balance beyond simple round-robin order.

## Failure behavior

If any step fails (research turns up nothing usable, a file is missing or
malformed, etc.), stop without partially appending to `assets/data/facts.jsonl`
or writing a partial day page — a half-written day is worse than a missed
one. There is no backfill mechanism for a missed day; that is handled (via
failure notification) by the scheduled-task wiring, not by this skill.
