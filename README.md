# Metropolis

Metropolis is an open-data platform for multicultural coexistence in Tokyo.
It combines a resident-facing map for discovering Japanese classes, multilingual support, and cultural events with an administrator-facing dashboard for identifying service gaps.

## MVP principles

- Build one narrow, complete vertical slice first.
- Keep open-data ingestion, product APIs, GIS presentation, and the AI agent independently replaceable.
- Treat AI as a natural-language interface to verified data, not as the source of truth.
- Preserve source, license, and freshness metadata for every published record.

## Repository layout

```text
apps/web        React + Cloudflare Worker application
apps/agent      Google ADK service with a constrained data-query tool
packages/schema Shared resource and analytics contracts
pipelines       Open-data collection and normalization jobs
data             Local raw/processed working directories (contents ignored)
migrations       Cloudflare D1 schema migrations
docs             Architecture and data-contract decisions
```

## Start the web scaffold

```bash
corepack enable
pnpm install
pnpm dev
```

The scaffold runs with seed data before D1 or the ADK service is configured. See `docs/architecture.md` for the staged rollout.
