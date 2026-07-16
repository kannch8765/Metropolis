# Metropolis agent

This service is intentionally thin: Google ADK interprets a user's question and calls one read-only gateway tool. The Worker and database remain the source of truth.

```bash
cd apps/agent
python -m venv .venv
source .venv/bin/activate
pip install -e .
cp ../../.env.example .env
adk web
```

`/api/tools/query` is deliberately left for the first data/API slice. Until it exists, the agent should not be exposed in the web UI.
