import uuid
from collections.abc import Callable
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.container import Container
from app.modules.identity import Role
from app.modules.writing import BibleService, ProposalIn, ProposalOp
from app.modules.writing.models import Character, Location, Relationship
from app.shared.audit import AuditLog
from tests.factories import TestUser

API = "/api/v1/studio"


def create_series(client: TestClient, user: TestUser, title: str = "The Archive") -> dict[str, Any]:
    response = client.post(
        f"{API}/series",
        json={"title": title, "language": "en", "themes": ["mystery"], "tone": "quiet"},
        headers=user.headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def add(client: TestClient, user: TestUser, series_id: str, section: str, body: dict) -> dict:
    response = client.post(f"{API}/series/{series_id}/{section}", json=body, headers=user.headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_writer_series_crud_and_scoping(client: TestClient, make: Callable[..., TestUser]) -> None:
    writer_a, writer_b, admin = make(Role.WRITER), make(Role.WRITER), make(Role.ADMIN)
    series = create_series(client, writer_a)
    assert series["status"] == "draft" and series["is_ai_assisted"] is True
    assert series["owner_writer_id"] == str(writer_a.id)

    updated = client.put(
        f"{API}/series/{series['id']}", json={"premise": "A sealed room."}, headers=writer_a.headers
    )
    assert updated.json()["premise"] == "A sealed room."

    assert client.get(f"{API}/series", headers=writer_b.headers).json()["total"] == 0
    for method, path in [
        ("get", f"{API}/series/{series['id']}"),
        ("get", f"{API}/series/{series['id']}/bible"),
        ("get", f"{API}/series/{series['id']}/characters"),
    ]:
        assert getattr(client, method)(path, headers=writer_b.headers).status_code == 404
    assert (
        client.post(
            f"{API}/series/{series['id']}/characters", json={"name": "X"}, headers=writer_b.headers
        ).status_code
        == 404
    )
    assert client.get(f"{API}/series/{series['id']}", headers=admin.headers).status_code == 200
    listener = make(Role.LISTENER)
    assert client.get(f"{API}/series", headers=listener.headers).status_code == 403


def test_bible_crud_for_every_section(
    client: TestClient, make: Callable[..., TestUser], db: Session
) -> None:
    writer = make(Role.WRITER)
    sid = create_series(client, writer)["id"]
    ana = add(client, writer, sid, "characters", {"name": "Ana", "traits": ["curious"]})
    ben = add(client, writer, sid, "characters", {"name": "Ben", "voice_notes": "low, slow"})
    add(
        client,
        writer,
        sid,
        "relationships",
        {
            "character_a_id": ana["id"],
            "character_b_id": ben["id"],
            "description": "siblings",
        },
    )
    add(client, writer, sid, "locations", {"name": "The lighthouse"})
    add(client, writer, sid, "world-rules", {"rule_text": "No one leaves the island at night."})
    first = add(client, writer, sid, "timeline", {"description": "Storm", "episode_number": 1})
    second = add(client, writer, sid, "timeline", {"description": "Shipwreck"})
    assert (first["position"], second["position"]) == (1, 2)
    thread = add(client, writer, sid, "plot-threads", {"title": "Who rang the bell?"})
    assert thread["status"] == "open"

    resolved = client.put(
        f"{API}/series/{sid}/plot-threads/{thread['id']}",
        json={"status": "resolved", "resolved_in_episode": 4},
        headers=writer.headers,
    )
    assert resolved.json()["status"] == "resolved"

    bible = client.get(f"{API}/series/{sid}/bible", headers=writer.headers).json()
    assert [c["name"] for c in bible["characters"]] == ["Ana", "Ben"]
    assert len(bible["relationships"]) == len(bible["locations"]) == len(bible["world_rules"]) == 1
    assert [t["description"] for t in bible["timeline"]] == ["Storm", "Shipwreck"]

    search = client.get(f"{API}/series/{sid}/bible?q=lighthouse", headers=writer.headers).json()
    assert [loc["name"] for loc in search["locations"]] == ["The lighthouse"]
    assert search["characters"] == []

    invalid = client.post(
        f"{API}/series/{sid}/characters", json={"name": ""}, headers=writer.headers
    )
    assert invalid.status_code == 422
    assert invalid.json()["error"]["code"] == "validation_error"

    self_rel = client.post(
        f"{API}/series/{sid}/relationships",
        json={"character_a_id": ana["id"], "character_b_id": ana["id"]},
        headers=writer.headers,
    )
    assert self_rel.status_code == 422

    actions = set(db.scalars(select(AuditLog.action)))
    assert {"bible.characters.create", "bible.plot-threads.update"} <= actions


def test_relationship_characters_must_belong_to_series(
    client: TestClient, make: Callable[..., TestUser]
) -> None:
    writer = make(Role.WRITER)
    one, two = (
        create_series(client, writer, "One")["id"],
        create_series(client, writer, "Two")["id"],
    )
    a = add(client, writer, one, "characters", {"name": "A"})
    b = add(client, writer, two, "characters", {"name": "B"})
    response = client.post(
        f"{API}/series/{one}/relationships",
        json={"character_a_id": a["id"], "character_b_id": b["id"]},
        headers=writer.headers,
    )
    assert response.json()["error"]["code"] == "unknown_character"


def test_narrator_is_unique_per_series(client: TestClient, make: Callable[..., TestUser]) -> None:
    writer = make(Role.WRITER)
    sid = create_series(client, writer)["id"]
    add(client, writer, sid, "characters", {"name": "Old narrator", "is_narrator": True})
    add(client, writer, sid, "characters", {"name": "New narrator", "is_narrator": True})
    chars = client.get(f"{API}/series/{sid}/characters", headers=writer.headers).json()
    assert {c["name"]: c["is_narrator"] for c in chars} == {
        "New narrator": True,
        "Old narrator": False,
    }


def test_deleting_a_referenced_character_needs_confirmation(
    client: TestClient, make: Callable[..., TestUser], db: Session
) -> None:
    writer = make(Role.WRITER)
    sid = create_series(client, writer)["id"]
    ana = add(client, writer, sid, "characters", {"name": "Ana"})
    ben = add(client, writer, sid, "characters", {"name": "Ben"})
    add(
        client,
        writer,
        sid,
        "relationships",
        {
            "character_a_id": ana["id"],
            "character_b_id": ben["id"],
        },
    )
    blocked = client.delete(f"{API}/series/{sid}/characters/{ana['id']}", headers=writer.headers)
    assert blocked.status_code == 409
    assert blocked.json()["error"]["code"] == "entity_in_use"
    assert blocked.json()["error"]["details"]["references"] == ["1 relationship(s)"]

    forced = client.delete(
        f"{API}/series/{sid}/characters/{ana['id']}?force=true", headers=writer.headers
    )
    assert forced.status_code == 204
    assert db.scalar(select(func.count()).select_from(Relationship)) == 0
    # A character with no references deletes without confirmation.
    assert (
        client.delete(
            f"{API}/series/{sid}/characters/{ben['id']}", headers=writer.headers
        ).status_code
        == 204
    )


def test_canon_proposals_only_change_canon_when_accepted(
    client: TestClient, make: Callable[..., TestUser], db: Session, container: Container
) -> None:
    writer = make(Role.WRITER)
    sid = create_series(client, writer)["id"]
    ana = add(client, writer, sid, "characters", {"name": "Ana", "description": "a sailor"})
    lighthouse = add(client, writer, sid, "locations", {"name": "Lighthouse"})

    service = BibleService(db, container)
    created = service.propose(
        uuid.UUID(sid),
        ProposalIn(
            entity_type="characters",
            op=ProposalOp.CREATE,
            payload={"name": "Cora", "description": "the keeper"},
            reason="Introduced in ep 2",
        ),
    )
    updated = service.propose(
        uuid.UUID(sid),
        ProposalIn(
            entity_type="characters",
            op=ProposalOp.UPDATE,
            entity_id=uuid.UUID(ana["id"]),
            payload={"description": "a sailor who lost her ship"},
        ),
    )
    deleted = service.propose(
        uuid.UUID(sid),
        ProposalIn(
            entity_type="locations",
            op=ProposalOp.DELETE,
            entity_id=uuid.UUID(lighthouse["id"]),
        ),
    )
    db.commit()

    # Nothing has changed yet.
    assert db.scalar(select(func.count()).select_from(Character)) == 1
    assert db.scalar(select(func.count()).select_from(Location)) == 1

    pending = client.get(
        f"{API}/series/{sid}/canon-proposals?status=pending", headers=writer.headers
    ).json()
    assert len(pending) == 3
    by_id = {p["id"]: p for p in pending}
    assert by_id[str(updated.id)]["current"]["description"] == "a sailor"

    accept = lambda pid, body=None: client.post(  # noqa: E731
        f"{API}/canon-proposals/{pid}/accept", json=body, headers=writer.headers
    )
    assert (
        accept(created.id, {"payload": {"name": "Cora", "description": "the old keeper"}}).json()[
            "status"
        ]
        == "accepted"
    )
    assert accept(updated.id).status_code == 200
    rejected = client.post(f"{API}/canon-proposals/{deleted.id}/reject", headers=writer.headers)
    assert rejected.json()["status"] == "rejected"
    assert accept(deleted.id).json()["error"]["code"] == "proposal_decided"

    db.expire_all()
    names = {c.name: c.description for c in db.scalars(select(Character))}
    assert names == {"Ana": "a sailor who lost her ship", "Cora": "the old keeper"}
    assert db.scalar(select(func.count()).select_from(Location)) == 1

    sources = {
        (row.action, row.meta["source"])
        for row in db.scalars(select(AuditLog).where(AuditLog.action.like("bible.%")))
        if "source" in row.meta
    }
    assert ("bible.characters.create", "ai_proposal") in sources


def test_invalid_and_stale_proposals(
    client: TestClient, make: Callable[..., TestUser], db: Session, container: Container
) -> None:
    writer = make(Role.WRITER)
    sid = create_series(client, writer)["id"]
    ana = add(client, writer, sid, "characters", {"name": "Ana"})
    service = BibleService(db, container)
    bad = service.propose(
        uuid.UUID(sid),
        ProposalIn(
            entity_type="characters",
            op=ProposalOp.CREATE,
            payload={"nickname": "?"},
        ),
    )
    stale = service.propose(
        uuid.UUID(sid),
        ProposalIn(
            entity_type="characters",
            op=ProposalOp.UPDATE,
            entity_id=uuid.UUID(ana["id"]),
            payload={"name": "A"},
        ),
    )
    db.commit()
    response = client.post(f"{API}/canon-proposals/{bad.id}/accept", headers=writer.headers)
    assert response.json()["error"]["code"] == "invalid_proposal"
    client.delete(f"{API}/series/{sid}/characters/{ana['id']}", headers=writer.headers)
    response = client.post(f"{API}/canon-proposals/{stale.id}/accept", headers=writer.headers)
    assert response.json()["error"]["code"] == "proposal_stale"

    other = make(Role.WRITER)
    assert (
        client.post(f"{API}/canon-proposals/{bad.id}/reject", headers=other.headers).status_code
        == 404
    )


def test_snapshot_reads_live_canon(
    client: TestClient, make: Callable[..., TestUser], db: Session, container: Container
) -> None:
    writer = make(Role.WRITER)
    sid = create_series(client, writer)["id"]
    add(client, writer, sid, "characters", {"name": "Ana"})
    snapshot = BibleService(db, container).snapshot(uuid.UUID(sid))
    assert [c["name"] for c in snapshot["characters"]] == ["Ana"]
    assert set(snapshot) == {
        "characters",
        "relationships",
        "locations",
        "world-rules",
        "timeline",
        "plot-threads",
    }
    add(client, writer, sid, "world-rules", {"rule_text": "Magic costs memory."})
    db.expire_all()
    assert len(BibleService(db, container).snapshot(uuid.UUID(sid))["world-rules"]) == 1


def test_proposal_requires_entity_for_update(db: Session, container: Container) -> None:
    from app.shared.errors import ValidationFailed

    with pytest.raises(ValidationFailed):
        BibleService(db, container).propose(
            uuid.UUID(int=0),
            ProposalIn(entity_type="characters", op=ProposalOp.UPDATE, payload={}),
        )
