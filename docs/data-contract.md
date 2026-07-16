# Data contract

Every published resource must contain a stable internal ID, category, name, coordinates, ward, and provenance. Optional fields may be absent; unknown values must not be fabricated.

## Provenance requirements

- `sourceUrl`: original public page or dataset URL.
- `sourceUpdatedAt`: source-declared update date when available; otherwise retrieval date with a documented flag in the pipeline output.
- pipeline metadata: license, retrieval timestamp, source dataset identifier, and transformation version.

## Quality gates

- coordinates fall within the expected Tokyo-area bounding box;
- category values match the canonical enum;
- duplicate detection considers source ID, normalized name, location, and time;
- expired events remain in raw snapshots but are excluded from default resident search;
- administrative metrics are computed in code before being summarized by an LLM.
