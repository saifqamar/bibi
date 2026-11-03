"""admin module: review queue, publishing decisions and writer notifications.

Other modules may import only the names exported here.
"""

from app.modules.admin.service import ReviewService

__all__ = ["ReviewService"]
