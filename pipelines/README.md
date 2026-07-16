# Open-data pipelines

The pipeline will follow four explicit stages:

1. `collect`: download immutable source snapshots and record URL, license, and retrieval time.
2. `normalize`: map source-specific columns into `@metropolis/schema`.
3. `validate`: reject invalid coordinates, dates, duplicates, and records without provenance.
4. `publish`: emit D1 import SQL/CSV plus precomputed ward metrics.

Do not let the web application parse source-specific files directly.
