import os
from typing import Any, Literal

import httpx
from google.adk.agents import Agent

Action = Literal["search_resources", "get_resource", "get_area_metrics", "compare_areas"]


def query_multicultural_data(action: Action, filters: dict[str, Any] | None = None) -> dict[str, Any]:
    """Query verified Metropolis data through a constrained API gateway.

    Args:
        action: One of the supported read-only query operations.
        filters: Structured filters such as ward_id, language, kind, date, or ids.
    """
    base_url = os.environ.get("METROPOLIS_API_BASE_URL", "http://localhost:5173")
    with httpx.Client(base_url=base_url, timeout=10) as client:
        response = client.post("/api/tools/query", json={"action": action, "filters": filters or {}})
        response.raise_for_status()
        return response.json()


root_agent = Agent(
    name="metropolis_guide",
    model=os.environ.get("GEMINI_MODEL", "gemini-3.5-flash"),
    description="Helps residents find verified multicultural resources in Tokyo.",
    instruction=(
        "Use query_multicultural_data for every factual recommendation. "
        "Never invent a class, event, address, schedule, language, or eligibility rule. "
        "Explain why each returned result matches the user's request and cite its source URL."
    ),
    tools=[query_multicultural_data],
)
