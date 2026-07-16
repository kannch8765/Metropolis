# Architecture

## First vertical slice

```text
open data -> Python normalization -> canonical records -> D1
                                                   -> Worker API -> React map/dashboard
Gemini via Google ADK -> constrained HTTP tool ----^
```

The Worker API is the stable boundary. The React application and ADK service do not access raw source files or construct arbitrary SQL.

## Staged rollout

1. Scaffold: runnable web shell, contracts, seed records, migration, agent boundary.
2. Data slice: ingest one Japanese-class source and one cultural-event source with provenance.
3. GIS slice: MapLibre markers, filters, resource details, and bounding-box queries.
4. Analysis slice: precompute one ward coverage metric and expose it in the admin panel.
5. Agent slice: implement `/api/tools/query`, connect ADK, and enable the question box.
6. Expansion: add wards, languages, sources, temporal coverage, and policy-oriented comparisons.

## Deliberate non-decisions

- D1 may later be replaced by PostgreSQL/PostGIS without changing client contracts.
- The agent can move between local, Cloud Run, or another host because it communicates over HTTP.
- Map tiles and geocoding providers are not selected in the scaffold.
- Authentication is deferred until the public resident flow and read-only admin demo are stable.
