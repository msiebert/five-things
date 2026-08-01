# History

Log of previously published topics and questions, appended by the daily
generation agent after each run and read before the next run to avoid
picking near-duplicate subject matter. See
[`docs/agent-reference-files.md`](../docs/agent-reference-files.md) for the
full read/write contract.

## Format

- One section per day, as a level-3 (`###`) heading holding the ISO 8601
  date (`YYYY-MM-DD`), matching that day's `date_added` in
  [`_data/facts.jsonl`](facts.jsonl).
- Followed by one bullet per fact published that day, in the same order as
  their `id` sequence numbers, as:

  ```
  - **{topic}**: {question}
  ```

- Sections are appended in date order; the file is never rewritten or
  reordered, only appended to.
- This file is a log for duplicate-avoidance context, not a source of truth
  — `_data/facts.jsonl` remains authoritative for fact content and IDs.

## Entries

### 2026-07-31
- **science**: What is the largest planet in our solar system?
- **history**: Which ancient wonder of the world was located in Giza, Egypt?
- **geography**: What is the longest river in the world?
- **biography**: Who developed the theory of general relativity?
- **science**: What gas do plants absorb from the atmosphere during photosynthesis?
