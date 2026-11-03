"""ai module: every AI workflow, provider port, usage metering and cost report.

Other modules call only the names exported here; nothing outside this module imports LangGraph
or a provider SDK.
"""

from app.modules.ai.adapters.ports import (
    EMBEDDING_DIM,
    EmbeddingPort,
    LLMMessage,
    LLMPort,
    ProviderError,
    TTSPort,
    TTSResult,
)
from app.modules.ai.continuity import ContinuityService
from app.modules.ai.costs import CostService
from app.modules.ai.metering import Metered, UsageContext, call_with_retry
from app.modules.ai.models import RunStatus
from app.modules.ai.runs import RunService
from app.modules.ai.schemas import CostSummary

__all__ = [
    "EMBEDDING_DIM",
    "ContinuityService",
    "CostService",
    "CostSummary",
    "EmbeddingPort",
    "LLMMessage",
    "LLMPort",
    "Metered",
    "ProviderError",
    "RunService",
    "RunStatus",
    "TTSPort",
    "TTSResult",
    "UsageContext",
    "call_with_retry",
]
