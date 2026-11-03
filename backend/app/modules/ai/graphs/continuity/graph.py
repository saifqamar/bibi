"""Continuity graph: prepare → deterministic checks → model check → tally.

Runs on its own (writer clicks "Check continuity") and as a subgraph inside drafting.
"""

from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from app.modules.ai.engine import NODE_RETRY, Deps, node
from app.modules.ai.graphs.continuity import nodes


class ContinuityState(TypedDict, total=False):
    run_id: str
    episode_id: str
    series_id: str
    draft_version: int
    open_errors: int


def _graph(deps: Deps) -> StateGraph:
    graph = StateGraph(ContinuityState)
    steps = [
        ("prepare", nodes.prepare),
        ("deterministic_checks", nodes.deterministic_checks),
        ("llm_check", nodes.llm_check),
        ("tally", nodes.tally),
    ]
    previous = START
    for name, fn in steps:
        graph.add_node(name, node(deps, name, fn), retry_policy=NODE_RETRY)
        graph.add_edge(previous, name)
        previous = name
    graph.add_edge(previous, END)
    return graph


def build_continuity_graph(deps: Deps, checkpointer: Any) -> CompiledStateGraph:
    return _graph(deps).compile(checkpointer=checkpointer)


def build_continuity_subgraph(deps: Deps) -> CompiledStateGraph:
    """Compiled without a checkpointer; inside drafting it uses the parent's."""
    return _graph(deps).compile()
