# Open-data pipelines

Each source adapter owns downloading and parsing one external dataset. Adapters must emit canonical records plus source and freshness metadata; product code never parses source-specific files.

## Tokyo foreign-resident statistics

Tokyo's January 2026 foreign-resident table provides the first administrator-side denominator. The importer publishes the 23 special wards as JSON and idempotent D1 SQL.

```bash
python -m pipelines.sources.tokyo_foreign_residents
python -m unittest discover -s pipelines/tests
```

For an offline or reproducible run, pass a previously downloaded CSV:

```bash
python -m pipelines.sources.tokyo_foreign_residents \
  --input data/raw/ga26ev0100.csv \
  --output-dir data/processed
```

## Itabashi multicultural events

Itabashi's event feed is published under CC BY 4.0 and includes coordinates. The adapter keeps only records whose title or description signals Japanese learning, international exchange, foreign-resident support, or multicultural activity.

```bash
python -m pipelines.sources.itabashi_events \
  --output-json data/processed/itabashi_events.json \
  --output-sql data/processed/itabashi_events.sql
```

For a pinned snapshot or offline run:

```bash
python -m pipelines.sources.itabashi_events \
  --input data/raw/itabashi_events.csv \
  --source-updated-at 2026-02-10 \
  --output-json data/processed/itabashi_events.json \
  --output-sql data/processed/itabashi_events.sql
```

The raw download and generated outputs remain ignored. The repository keeps the adapter, fixture, tests, source URLs, license, and attribution boundary.
