"""Voice production port. The default implementation is a plain background job; a LangGraph
version with a review-before-stitch interrupt ([OPEN] in spec 07) can implement the same port."""

import uuid
from typing import Protocol


class VoiceProductionPort(Protocol):
    def start(self, render_id: uuid.UUID, workflow_run_id: uuid.UUID) -> None:
        """Begin producing audio for a prepared render."""
        ...
