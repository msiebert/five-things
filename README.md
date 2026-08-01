# 5 Things

A personal daily-learning and trivia app: each morning, five new facts are
generated and added to a central fact store; a Take-25 quiz draws from
everything you've learned so far.

This repo is the Jekyll/GitHub Pages site and its data. There is no backend
database — content lives in this repo as flat data files, and per-user
progress lives in each user's own Firebase project.

## Central fact store

The fact store is `_data/facts.jsonl`, an append-only, newline-delimited
JSON file of trivia facts. See
[`docs/fact-store-schema.md`](docs/fact-store-schema.md) for the full format
specification.
