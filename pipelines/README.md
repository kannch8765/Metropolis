# Open-data pipelines

Each source adapter owns downloading and parsing one external dataset. Adapters must emit canonical records plus source and freshness metadata; product code never parses source-specific files.

## First official source

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

The next source adapter should add verified Japanese classes or multicultural events using the same provenance boundary.
