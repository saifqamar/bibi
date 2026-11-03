"""writing module: story bible, canon proposals (and later episodes, drafts and versions).

Other modules may import only the names exported here.
"""

from app.modules.writing.models import ProposalOp
from app.modules.writing.schemas import ProposalIn
from app.modules.writing.service import BibleService, register_reference_checker

__all__ = ["BibleService", "ProposalIn", "ProposalOp", "register_reference_checker"]
