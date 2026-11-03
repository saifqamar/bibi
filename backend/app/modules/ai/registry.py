"""Workflow name → graph builder. The job type is always known, so routing is a plain lookup."""

from collections.abc import Callable
from typing import Any

from app.modules.ai.engine import Deps
from app.modules.ai.graphs.continuity.graph import build_continuity_graph
from app.modules.ai.graphs.drafting.graph import build_drafting_graph, build_section_regen_graph

GraphBuilder = Callable[[Deps, Any], Any]

WORKFLOWS: dict[str, GraphBuilder] = {
    "drafting": build_drafting_graph,
    "section_regen": build_section_regen_graph,
    "continuity": build_continuity_graph,
}


def register_workflow(name: str, builder: GraphBuilder) -> None:
    WORKFLOWS[name] = builder


def get_builder(name: str) -> GraphBuilder:
    try:
        return WORKFLOWS[name]
    except KeyError as exc:
        raise KeyError(f"Unknown workflow {name}") from exc
