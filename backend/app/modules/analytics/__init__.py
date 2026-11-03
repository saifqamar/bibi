"""analytics module: aggregates and dashboards from listening events.

Other modules may import only the names exported here.
"""

from app.modules.analytics.service import AGGREGATE_JOB, AnalyticsService

__all__ = ["AGGREGATE_JOB", "AnalyticsService"]
