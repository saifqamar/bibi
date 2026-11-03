import io
import uuid
from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.container import Container
from app.modules.catalog import CatalogService, SeriesCreate, SeriesStatus, SeriesUpdate
from app.modules.catalog.models import Series
from app.modules.identity import CurrentUser, Role
from app.shared.audit import AuditLog
from app.shared.errors import NotFound
from tests.factories import TestUser

API = "/api/v1"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


def as_current(user: TestUser) -> CurrentUser:
    return CurrentUser(id=user.id, email=user.user.email, role=user.user.role)


def make_series(
    db: Session,
    owner: TestUser,
    title: str,
    status: SeriesStatus = SeriesStatus.PUBLISHED,
) -> Series:
    series = Series(
        owner_writer_id=owner.id, title=title, language="en", status=status, themes=["mystery"]
    )
    db.add(series)
    db.commit()
    return series


def test_listeners_only_see_published(
    client: TestClient, db: Session, make: Callable[..., TestUser]
) -> None:
    admin, writer, listener = make(Role.ADMIN), make(Role.WRITER), make(Role.LISTENER)
    published = make_series(db, writer, "The Lighthouse Keeper")
    hidden = [
        make_series(db, writer, "Lighthouse Draft", SeriesStatus.DRAFT),
        make_series(db, writer, "Lighthouse Review", SeriesStatus.IN_REVIEW),
        make_series(db, writer, "Lighthouse Archive", SeriesStatus.ARCHIVED),
    ]
    shelf = client.post(
        f"{API}/admin/shelves",
        json={"title": "Quiet nights", "kind": "mood"},
        headers=admin.headers,
    ).json()
    client.put(
        f"{API}/admin/shelves/{shelf['id']}/items",
        json={"series_ids": [str(published.id), *[str(s.id) for s in hidden]]},
        headers=admin.headers,
    )

    shelves = client.get(f"{API}/shelves", headers=listener.headers).json()
    assert [s["title"] for s in shelves["items"][0]["series"]] == ["The Lighthouse Keeper"]
    found = client.get(f"{API}/search?q=lighthouse", headers=listener.headers).json()
    assert [s["title"] for s in found["items"]] == ["The Lighthouse Keeper"]

    for series in hidden[:2]:
        assert client.get(f"{API}/series/{series.id}", headers=listener.headers).status_code == 404
    # Archived stays readable by id for listeners who already have it.
    assert client.get(f"{API}/series/{hidden[2].id}", headers=listener.headers).status_code == 200
    assert client.get(f"{API}/shelves").status_code == 401


def test_listener_payload_is_always_ai_assisted(
    client: TestClient, db: Session, make: Callable[..., TestUser]
) -> None:
    admin, writer, listener = make(Role.ADMIN), make(Role.WRITER), make(Role.LISTENER)
    series = make_series(db, writer, "Saga")
    body = client.get(f"{API}/series/{series.id}", headers=listener.headers).json()
    assert body["is_ai_assisted"] is True
    rejected = client.put(
        f"{API}/admin/series/{series.id}", json={"is_ai_assisted": False}, headers=admin.headers
    )
    assert rejected.status_code == 422
    db.expire_all()
    assert db.get(Series, series.id).is_ai_assisted is True  # type: ignore[union-attr]


def test_shelf_order_applies_immediately(
    client: TestClient, db: Session, make: Callable[..., TestUser]
) -> None:
    admin, writer, listener = make(Role.ADMIN), make(Role.WRITER), make(Role.LISTENER)
    series = make_series(db, writer, "One")
    ids = []
    for title in ["First", "Second", "Third"]:
        shelf = client.post(f"{API}/admin/shelves", json={"title": title}, headers=admin.headers)
        ids.append(shelf.json()["id"])
        client.put(
            f"{API}/admin/shelves/{ids[-1]}/items",
            json={"series_ids": [str(series.id)]},
            headers=admin.headers,
        )
    titles = lambda: [  # noqa: E731
        s["title"] for s in client.get(f"{API}/shelves", headers=listener.headers).json()["items"]
    ]
    assert titles() == ["First", "Second", "Third"]
    response = client.put(
        f"{API}/admin/shelves/order", json={"shelf_ids": ids[::-1]}, headers=admin.headers
    )
    assert response.status_code == 204
    assert titles() == ["Third", "Second", "First"]
    bad = client.put(
        f"{API}/admin/shelves/order", json={"shelf_ids": ids[:1]}, headers=admin.headers
    )
    assert bad.json()["error"]["code"] == "invalid_shelf_order"


def test_writer_scoping_in_service(
    db: Session, container: Container, make: Callable[..., TestUser]
) -> None:
    writer_a, writer_b, admin = make(Role.WRITER), make(Role.WRITER), make(Role.ADMIN)
    service = CatalogService(db, container)
    series = service.create_series(
        as_current(writer_a), SeriesCreate(title="Mine", language="en", themes=["family"])
    )
    db.commit()
    assert service.get_series_for_user(as_current(writer_a), series.id).title == "Mine"
    assert service.get_series_for_user(as_current(admin), series.id).title == "Mine"
    with pytest.raises(NotFound):
        service.get_series_for_user(as_current(writer_b), series.id)
    with pytest.raises(NotFound):
        service.update_series(as_current(writer_b), series.id, SeriesUpdate(title="Stolen"))
    mine = db.scalars(service.studio_series_query(as_current(writer_b))).all()
    assert mine == []


def test_cover_upload(
    client: TestClient, db: Session, make: Callable[..., TestUser], container: Container
) -> None:
    admin, writer = make(Role.ADMIN), make(Role.WRITER)
    series = make_series(db, writer, "Covered")
    bad = client.post(
        f"{API}/admin/series/{series.id}/cover",
        files={"file": ("x.txt", io.BytesIO(b"hello"), "text/plain")},
        headers=admin.headers,
    )
    assert bad.status_code == 422
    assert bad.json()["error"]["code"] == "invalid_cover"

    first = client.post(
        f"{API}/admin/series/{series.id}/cover",
        files={"file": ("a.png", io.BytesIO(PNG), "image/png")},
        headers=admin.headers,
    ).json()
    second = client.post(
        f"{API}/admin/series/{series.id}/cover",
        files={"file": ("b.png", io.BytesIO(PNG), "image/png")},
        headers=admin.headers,
    ).json()
    assert first["cover_url"] != second["cover_url"]
    assert "sig=" in second["cover_url"]
    media = client.get(second["cover_url"].replace("http://testserver", ""))
    assert media.status_code == 200 and media.content == PNG


def test_admin_series_edit_reassign_and_archive(
    client: TestClient, db: Session, make: Callable[..., TestUser]
) -> None:
    admin, writer, other, listener = (
        make(Role.ADMIN),
        make(Role.WRITER),
        make(Role.WRITER),
        make(Role.LISTENER),
    )
    series = make_series(db, writer, "Moving")
    response = client.put(
        f"{API}/admin/series/{series.id}",
        json={"owner_writer_id": str(other.id), "free_episode_count": 3, "title": "Moved"},
        headers=admin.headers,
    )
    assert response.status_code == 200, response.text
    assert response.json()["owner_writer_id"] == str(other.id)
    assert response.json()["free_episode_count"] == 3

    not_writer = client.put(
        f"{API}/admin/series/{series.id}",
        json={"owner_writer_id": str(listener.id)},
        headers=admin.headers,
    )
    assert not_writer.json()["error"]["code"] == "invalid_owner"

    archived = client.put(
        f"{API}/admin/series/{series.id}", json={"archived": True}, headers=admin.headers
    )
    assert archived.json()["status"] == "archived"
    assert client.get(f"{API}/search?q=Moved", headers=listener.headers).json()["total"] == 0

    listing = client.get(f"{API}/admin/series?status=archived", headers=admin.headers).json()
    assert [s["title"] for s in listing["items"]] == ["Moved"]
    assert client.get(f"{API}/admin/series", headers=writer.headers).status_code == 403

    actions = set(db.scalars(select(AuditLog.action)))
    assert {"series.admin_update"} <= actions


def test_shelf_items_validation_and_audit(
    client: TestClient, db: Session, make: Callable[..., TestUser]
) -> None:
    admin = make(Role.ADMIN)
    shelf = client.post(f"{API}/admin/shelves", json={"title": "S"}, headers=admin.headers).json()
    unknown = client.put(
        f"{API}/admin/shelves/{shelf['id']}/items",
        json={"series_ids": [str(uuid.uuid4())]},
        headers=admin.headers,
    )
    assert unknown.json()["error"]["code"] == "unknown_series"
    client.put(
        f"{API}/admin/shelves/{shelf['id']}", json={"title": "Renamed"}, headers=admin.headers
    )
    assert (
        client.delete(f"{API}/admin/shelves/{shelf['id']}", headers=admin.headers).status_code
        == 204
    )
    actions = set(db.scalars(select(AuditLog.action)))
    assert {"shelf.create", "shelf.update", "shelf.delete"} <= actions


def test_play_count_and_status_helpers(
    db: Session, container: Container, make: Callable[..., TestUser]
) -> None:
    writer = make(Role.WRITER)
    series = make_series(db, writer, "Counted", SeriesStatus.DRAFT)
    service = CatalogService(db, container)
    service.set_status(series.id, SeriesStatus.PUBLISHED)
    service.increment_play_count(series.id, 5)
    db.commit()
    db.refresh(series)
    assert series.status == SeriesStatus.PUBLISHED and series.published_at is not None
    assert series.play_count == 5
