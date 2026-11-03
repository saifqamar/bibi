"""Story bible service: canon entities, the delete guard and AI canon proposals."""

import uuid
from collections import defaultdict
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel, ValidationError
from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session

from app.modules.catalog import CatalogService
from app.modules.identity import CurrentUser
from app.modules.writing.models import (
    CanonProposal,
    Character,
    Location,
    PlotThread,
    ProposalOp,
    ProposalStatus,
    Relationship,
    TimelineEvent,
    WorldRule,
)
from app.modules.writing.schemas import (
    BibleOut,
    CharacterCreate,
    CharacterOut,
    CharacterUpdate,
    LocationCreate,
    LocationOut,
    LocationUpdate,
    PlotThreadCreate,
    PlotThreadOut,
    PlotThreadUpdate,
    ProposalIn,
    ProposalOut,
    RelationshipCreate,
    RelationshipOut,
    RelationshipUpdate,
    TimelineEventCreate,
    TimelineEventOut,
    TimelineEventUpdate,
    WorldRuleCreate,
    WorldRuleOut,
    WorldRuleUpdate,
)
from app.shared.audit import record_audit
from app.shared.errors import Conflict, NotFound, ValidationFailed

if TYPE_CHECKING:
    from app.container import Container


@dataclass(frozen=True)
class EntitySpec:
    model: Any
    create: type[BaseModel]
    update: type[BaseModel]
    out: type[BaseModel]
    search_fields: tuple[str, ...]
    order: tuple[str, ...]


ENTITIES: dict[str, EntitySpec] = {
    "characters": EntitySpec(
        Character,
        CharacterCreate,
        CharacterUpdate,
        CharacterOut,
        ("name", "description"),
        ("name",),
    ),
    "relationships": EntitySpec(
        Relationship,
        RelationshipCreate,
        RelationshipUpdate,
        RelationshipOut,
        ("description",),
        ("created_at",),
    ),
    "locations": EntitySpec(
        Location, LocationCreate, LocationUpdate, LocationOut, ("name", "description"), ("name",)
    ),
    "world-rules": EntitySpec(
        WorldRule, WorldRuleCreate, WorldRuleUpdate, WorldRuleOut, ("rule_text",), ("created_at",)
    ),
    "timeline": EntitySpec(
        TimelineEvent,
        TimelineEventCreate,
        TimelineEventUpdate,
        TimelineEventOut,
        ("description", "story_time"),
        ("position", "created_at"),
    ),
    "plot-threads": EntitySpec(
        PlotThread,
        PlotThreadCreate,
        PlotThreadUpdate,
        PlotThreadOut,
        ("title", "description"),
        ("created_at",),
    ),
}

# Other modules (e.g. audio voice assignments) register checks that list what still uses an
# entity, so deleting it asks for confirmation first.
ReferenceChecker = Callable[[Session, uuid.UUID], list[str]]
_reference_checkers: dict[str, list[ReferenceChecker]] = defaultdict(list)


def register_reference_checker(entity_type: str) -> Callable[[ReferenceChecker], ReferenceChecker]:
    def decorator(fn: ReferenceChecker) -> ReferenceChecker:
        if fn not in _reference_checkers[entity_type]:
            _reference_checkers[entity_type].append(fn)
        return fn

    return decorator


@register_reference_checker("characters")
def _relationship_references(db: Session, character_id: uuid.UUID) -> list[str]:
    count = db.scalar(
        select(func.count())
        .select_from(Relationship)
        .where(
            or_(
                Relationship.character_a_id == character_id,
                Relationship.character_b_id == character_id,
            )
        )
    )
    return [f"{count} relationship(s)"] if count else []


def _spec(entity_type: str) -> EntitySpec:
    spec = ENTITIES.get(entity_type)
    if spec is None:
        raise NotFound("Unknown bible section")
    return spec


def _to_dict(out: BaseModel) -> dict[str, Any]:
    return out.model_dump(mode="json")


class BibleService:
    def __init__(self, db: Session, container: "Container") -> None:
        self.db = db
        self.container = container
        self.catalog = CatalogService(db, container)

    def _check_series(self, user: CurrentUser, series_id: uuid.UUID) -> None:
        self.catalog.get_series_for_user(user, series_id)

    def _entity(self, spec: EntitySpec, series_id: uuid.UUID, entity_id: uuid.UUID) -> Any:
        entity = self.db.get(spec.model, entity_id)
        if entity is None or entity.series_id != series_id:
            raise NotFound("Bible entry not found")
        return entity

    # Reads -----------------------------------------------------------------------------------

    def list_entries(
        self, user: CurrentUser, series_id: uuid.UUID, entity_type: str, q: str | None = None
    ) -> list[BaseModel]:
        self._check_series(user, series_id)
        return self._list(series_id, entity_type, q)

    def _list(
        self, series_id: uuid.UUID, entity_type: str, q: str | None = None
    ) -> list[BaseModel]:
        spec = _spec(entity_type)
        stmt = select(spec.model).where(spec.model.series_id == series_id)
        if q:
            pattern = f"%{q.strip()}%"
            stmt = stmt.where(
                or_(*(getattr(spec.model, f).ilike(pattern) for f in spec.search_fields))
            )
        stmt = stmt.order_by(*(getattr(spec.model, f) for f in spec.order))
        return [spec.out.model_validate(row) for row in self.db.scalars(stmt)]

    def get(
        self, user: CurrentUser, series_id: uuid.UUID, entity_type: str, entity_id: uuid.UUID
    ) -> BaseModel:
        self._check_series(user, series_id)
        spec = _spec(entity_type)
        return spec.out.model_validate(self._entity(spec, series_id, entity_id))

    def bible(self, user: CurrentUser, series_id: uuid.UUID, q: str | None = None) -> BibleOut:
        self._check_series(user, series_id)
        return BibleOut(
            characters=self._list(series_id, "characters", q),
            relationships=self._list(series_id, "relationships", q),
            locations=self._list(series_id, "locations", q),
            world_rules=self._list(series_id, "world-rules", q),
            timeline=self._list(series_id, "timeline", q),
            plot_threads=self._list(series_id, "plot-threads", q),
        )

    def snapshot(self, series_id: uuid.UUID) -> dict[str, list[dict[str, Any]]]:
        """The whole canon as plain data, read live, for the AI module (no user scoping)."""
        return {key: [_to_dict(item) for item in self._list(series_id, key)] for key in ENTITIES}

    # Writes ----------------------------------------------------------------------------------

    def _validate_refs(self, series_id: uuid.UUID, values: dict[str, Any]) -> None:
        for key in ("character_a_id", "character_b_id"):
            if key in values and values[key] is not None:
                character = self.db.get(Character, values[key])
                if character is None or character.series_id != series_id:
                    raise ValidationFailed(
                        "Characters must belong to this series", code="unknown_character"
                    )

    def _apply_narrator(self, series_id: uuid.UUID, entity: Any) -> None:
        if isinstance(entity, Character) and entity.is_narrator:
            self.db.execute(
                update(Character)
                .where(Character.series_id == series_id, Character.id != entity.id)
                .values(is_narrator=False)
            )

    def _audit(
        self,
        actor: CurrentUser,
        action: str,
        entity_type: str,
        entity_id: uuid.UUID,
        series_id: uuid.UUID,
        source: str,
    ) -> None:
        record_audit(
            self.db,
            actor_id=actor.id,
            action=f"bible.{entity_type}.{action}",
            entity_type=entity_type,
            entity_id=entity_id,
            metadata={"series_id": str(series_id), "source": source},
        )

    def create(
        self,
        user: CurrentUser,
        series_id: uuid.UUID,
        entity_type: str,
        data: BaseModel,
        *,
        source: str = "writer",
    ) -> BaseModel:
        self._check_series(user, series_id)
        spec = _spec(entity_type)
        values = data.model_dump()
        self._validate_refs(series_id, values)
        if spec.model is TimelineEvent and values.get("position") is None:
            last = self.db.scalar(
                select(func.max(TimelineEvent.position)).where(TimelineEvent.series_id == series_id)
            )
            values["position"] = (last or 0) + 1
        entity = spec.model(series_id=series_id, **values)
        self.db.add(entity)
        self.db.flush()
        self._apply_narrator(series_id, entity)
        self._audit(user, "create", entity_type, entity.id, series_id, source)
        return spec.out.model_validate(entity)

    def update(
        self,
        user: CurrentUser,
        series_id: uuid.UUID,
        entity_type: str,
        entity_id: uuid.UUID,
        data: BaseModel,
        *,
        source: str = "writer",
    ) -> BaseModel:
        self._check_series(user, series_id)
        spec = _spec(entity_type)
        entity = self._entity(spec, series_id, entity_id)
        values = data.model_dump(exclude_unset=True)
        self._validate_refs(series_id, values)
        for key, value in values.items():
            setattr(entity, key, value)
        if isinstance(entity, Relationship) and entity.character_a_id == entity.character_b_id:
            raise ValidationFailed("A relationship needs two different characters")
        self.db.flush()
        self._apply_narrator(series_id, entity)
        self._audit(user, "update", entity_type, entity.id, series_id, source)
        return spec.out.model_validate(entity)

    def references(self, entity_type: str, entity_id: uuid.UUID) -> list[str]:
        return [
            ref for check in _reference_checkers[entity_type] for ref in check(self.db, entity_id)
        ]

    def delete(
        self,
        user: CurrentUser,
        series_id: uuid.UUID,
        entity_type: str,
        entity_id: uuid.UUID,
        *,
        force: bool = False,
        source: str = "writer",
    ) -> None:
        self._check_series(user, series_id)
        spec = _spec(entity_type)
        entity = self._entity(spec, series_id, entity_id)
        references = self.references(entity_type, entity_id)
        if references and not force:
            raise Conflict(
                "This entry is still used; confirm to delete it and what depends on it",
                code="entity_in_use",
                details={"references": references},
            )
        self.db.delete(entity)
        self.db.flush()
        self._audit(user, "delete", entity_type, entity_id, series_id, source)

    # Canon proposals -------------------------------------------------------------------------

    def propose(self, series_id: uuid.UUID, proposal: ProposalIn) -> CanonProposal:
        """The only way the AI module changes canon: it creates a pending proposal."""
        spec = _spec(proposal.entity_type)
        if proposal.op in (ProposalOp.UPDATE, ProposalOp.DELETE):
            if proposal.entity_id is None:
                raise ValidationFailed("entity_id is required for update and delete proposals")
            self._entity(spec, series_id, proposal.entity_id)
        row = CanonProposal(
            series_id=series_id,
            episode_id=proposal.episode_id,
            entity_type=proposal.entity_type,
            op=proposal.op,
            entity_id=proposal.entity_id,
            payload=proposal.payload,
            reason=proposal.reason,
        )
        self.db.add(row)
        self.db.flush()
        return row

    def proposal_out(self, proposal: CanonProposal) -> ProposalOut:
        out = ProposalOut.model_validate(proposal)
        if proposal.entity_id and proposal.status == ProposalStatus.PENDING:
            spec = ENTITIES.get(proposal.entity_type)
            entity = self.db.get(spec.model, proposal.entity_id) if spec else None
            out.current = _to_dict(spec.out.model_validate(entity)) if spec and entity else None
        return out

    def list_proposals(
        self, user: CurrentUser, series_id: uuid.UUID, status: ProposalStatus | None
    ) -> list[ProposalOut]:
        self._check_series(user, series_id)
        stmt = select(CanonProposal).where(CanonProposal.series_id == series_id)
        if status:
            stmt = stmt.where(CanonProposal.status == status)
        stmt = stmt.order_by(CanonProposal.created_at)
        return [self.proposal_out(p) for p in self.db.scalars(stmt)]

    def _pending_proposal(self, user: CurrentUser, proposal_id: uuid.UUID) -> CanonProposal:
        proposal = self.db.get(CanonProposal, proposal_id)
        if proposal is None:
            raise NotFound("Proposal not found")
        self._check_series(user, proposal.series_id)
        if proposal.status != ProposalStatus.PENDING:
            raise Conflict("This proposal was already decided", code="proposal_decided")
        return proposal

    def accept(
        self, user: CurrentUser, proposal_id: uuid.UUID, payload: dict[str, Any] | None = None
    ) -> ProposalOut:
        proposal = self._pending_proposal(user, proposal_id)
        spec = _spec(proposal.entity_type)
        data = payload if payload is not None else proposal.payload
        try:
            if proposal.op == ProposalOp.CREATE:
                created = self.create(
                    user,
                    proposal.series_id,
                    proposal.entity_type,
                    spec.create.model_validate(data),
                    source="ai_proposal",
                )
                proposal.entity_id = created.id  # type: ignore[attr-defined]
            elif proposal.op == ProposalOp.UPDATE:
                assert proposal.entity_id is not None
                self.update(
                    user,
                    proposal.series_id,
                    proposal.entity_type,
                    proposal.entity_id,
                    spec.update.model_validate(data),
                    source="ai_proposal",
                )
            else:
                assert proposal.entity_id is not None
                self.delete(
                    user,
                    proposal.series_id,
                    proposal.entity_type,
                    proposal.entity_id,
                    force=True,
                    source="ai_proposal",
                )
        except ValidationError as exc:
            raise ValidationFailed(
                "The proposed change is not valid",
                code="invalid_proposal",
                details={"errors": exc.errors(include_url=False, include_context=False)},
            ) from exc
        except NotFound as exc:
            raise Conflict(
                "The entry this proposal changes no longer exists", code="proposal_stale"
            ) from exc
        proposal.payload = data
        proposal.status = ProposalStatus.ACCEPTED
        proposal.decided_by = user.id
        proposal.decided_at = datetime.now(UTC)
        self.db.flush()
        return self.proposal_out(proposal)

    def reject(self, user: CurrentUser, proposal_id: uuid.UUID) -> ProposalOut:
        proposal = self._pending_proposal(user, proposal_id)
        proposal.status = ProposalStatus.REJECTED
        proposal.decided_by = user.id
        proposal.decided_at = datetime.now(UTC)
        record_audit(
            self.db,
            actor_id=user.id,
            action="bible.proposal.reject",
            entity_type="canon_proposal",
            entity_id=proposal.id,
            metadata={"series_id": str(proposal.series_id)},
        )
        self.db.flush()
        return self.proposal_out(proposal)
