"""The drafting graph: draft → writer review ⟲ → continuity (subgraph) ⟲ → canon → finalize.

It pauses (LangGraph interrupt) for the writer at review, at contradictions and at canon
confirmation; the Postgres checkpointer lets a run resume days later.
"""

from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from app.modules.ai.engine import NODE_RETRY, Deps, node
from app.modules.ai.graphs.continuity.graph import build_continuity_subgraph
from app.modules.ai.graphs.drafting import nodes


class DraftingState(TypedDict, total=False):
    run_id: str
    episode_id: str
    series_id: str
    context_episode_ids: list[str]
    draft_version: int
    review: str
    sections: list[dict[str, Any]] | None
    open_errors: int
    proposal_ids: list[str]
    finished: bool


def _after_review(state: dict[str, Any]) -> str:
    return "apply_section_rewrites" if state.get("review") == "regenerate" else "continuity"


def _after_continuity(state: dict[str, Any]) -> str:
    return "resolve_contradictions" if state.get("open_errors") else "propose_canon"


def _after_proposals(state: dict[str, Any]) -> str:
    return "confirm_canon" if state.get("proposal_ids") else "finalize"


def build_drafting_graph(deps: Deps, checkpointer: Any) -> CompiledStateGraph:
    graph = StateGraph(DraftingState)
    steps = {
        "load_context": nodes.load_context,
        "draft": nodes.draft,
        "writer_review": nodes.writer_review,
        "apply_section_rewrites": nodes.apply_section_rewrites,
        "resolve_contradictions": nodes.resolve_contradictions,
        "propose_canon": nodes.propose_canon,
        "confirm_canon": nodes.confirm_canon,
        "finalize": nodes.finalize,
    }
    for name, fn in steps.items():
        graph.add_node(name, node(deps, name, fn), retry_policy=NODE_RETRY)

    graph.add_node("continuity", build_continuity_subgraph(deps))

    graph.add_edge(START, "load_context")
    graph.add_edge("load_context", "draft")
    graph.add_edge("draft", "writer_review")
    graph.add_conditional_edges("writer_review", _after_review)
    graph.add_edge("apply_section_rewrites", "writer_review")
    graph.add_conditional_edges("continuity", _after_continuity)
    graph.add_edge("resolve_contradictions", "continuity")
    graph.add_conditional_edges("propose_canon", _after_proposals)
    graph.add_edge("confirm_canon", "finalize")
    graph.add_edge("finalize", END)
    return graph.compile(checkpointer=checkpointer)


class SectionRegenState(TypedDict, total=False):
    run_id: str
    episode_id: str
    series_id: str
    sections: list[dict[str, Any]]
    draft_version: int


def build_section_regen_graph(deps: Deps, checkpointer: Any) -> CompiledStateGraph:
    """One-step workflow used from the editor outside a drafting run."""
    graph = StateGraph(SectionRegenState)
    graph.add_node(
        "apply_section_rewrites",
        node(deps, "apply_section_rewrites", nodes.apply_section_rewrites),
        retry_policy=NODE_RETRY,
    )
    graph.add_edge(START, "apply_section_rewrites")
    graph.add_edge("apply_section_rewrites", END)
    return graph.compile(checkpointer=checkpointer)
