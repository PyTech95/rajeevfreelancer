"""Iteration 5: Topic suggestions (LLM) + bulk publish/unpublish API."""
import os

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")

ADMIN_EMAIL = "rajeev@rajeevfreelancer.com"
ADMIN_PASSWORD = "Rajeev@2026!Admin"


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.fail(f"Admin login failed {r.status_code}: {r.text[:300]}")
    token = r.json().get("access_token") or r.json().get("token")
    assert token, f"no token in {r.json()}"
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="module", autouse=True)
def restore_state(admin):
    yield
    admin.put(f"{BASE_URL}/api/admin/blog-autopilot", json={"custom_topics": [], "enabled": True})


def _make_post(admin, title, published=True):
    r = admin.post(f"{BASE_URL}/api/admin/blog", json={
        "title": title, "excerpt": "test excerpt", "category": "Guide",
        "body": ["para one", "para two"], "published": published,
    })
    assert r.status_code in (200, 201), r.text[:300]
    return r.json()


# ---------------- POST /api/admin/blog-autopilot/suggest ----------------
class TestSuggestTopics:
    def test_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/admin/blog-autopilot/suggest")
        assert r.status_code in (401, 403), r.status_code

    def test_returns_eight_suggestions(self, admin):
        rows = admin.get(f"{BASE_URL}/api/admin/blog").json()
        rows = rows["posts"] if isinstance(rows, dict) else rows
        existing_titles = {p["title"].strip().lower() for p in rows}
        r = admin.post(f"{BASE_URL}/api/admin/blog-autopilot/suggest", timeout=180)
        assert r.status_code == 200, f"{r.status_code}: {r.text[:400]}"
        data = r.json()
        assert "suggestions" in data, data
        ideas = data["suggestions"]
        assert isinstance(ideas, list)
        assert len(ideas) == 8, f"expected 8, got {len(ideas)}: {ideas}"
        for idea in ideas:
            assert isinstance(idea, str) and idea.strip(), f"bad idea: {idea!r}"
            assert len(idea) <= 110, f"too long ({len(idea)}): {idea}"
            assert "```" not in idea and not idea.strip().startswith(("-", "*")), idea
        assert len(set(i.lower() for i in ideas)) == 8, f"duplicate ideas: {ideas}"
        for idea in ideas:
            assert idea.strip().lower() not in existing_titles, f"repeats existing title: {idea}"


# ---------------- POST /api/admin/blog/bulk-publish ----------------
class TestBulkPublish:
    def test_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/admin/blog/bulk-publish", json={"ids": ["x"], "published": True})
        assert r.status_code in (401, 403), r.status_code

    def test_empty_ids_returns_400(self, admin):
        r = admin.post(f"{BASE_URL}/api/admin/blog/bulk-publish", json={"ids": [], "published": True})
        assert r.status_code == 400, f"{r.status_code}: {r.text[:200]}"

    def test_missing_ids_key_returns_400(self, admin):
        r = admin.post(f"{BASE_URL}/api/admin/blog/bulk-publish", json={"published": True})
        assert r.status_code == 400, f"{r.status_code}: {r.text[:200]}"

    def test_unknown_ids_return_zero_updated(self, admin):
        r = admin.post(f"{BASE_URL}/api/admin/blog/bulk-publish",
                       json={"ids": ["nope-1", "nope-2"], "published": True})
        assert r.status_code == 200, r.text[:200]
        assert r.json() == {"ok": True, "updated": 0}, r.json()

    def test_bulk_unpublish_then_publish_persists(self, admin):
        a = _make_post(admin, "TEST_ Bulk One", published=True)
        b = _make_post(admin, "TEST_ Bulk Two", published=True)
        ids = [a["id"], b["id"]]
        try:
            r = admin.post(f"{BASE_URL}/api/admin/blog/bulk-publish",
                           json={"ids": ids, "published": False})
            assert r.status_code == 200, r.text[:300]
            d = r.json()
            assert d["ok"] is True and d["updated"] == 2, d

            # verify persistence via admin list + public 404
            rows = admin.get(f"{BASE_URL}/api/admin/blog").json()
            rows = rows["posts"] if isinstance(rows, dict) else rows
            by_id = {p["id"]: p for p in rows}
            assert by_id[a["id"]]["published"] is False
            assert by_id[b["id"]]["published"] is False
            assert requests.get(f"{BASE_URL}/api/blog/{a['slug']}").status_code == 404

            r = admin.post(f"{BASE_URL}/api/admin/blog/bulk-publish",
                           json={"ids": ids, "published": True})
            assert r.status_code == 200
            assert r.json()["updated"] == 2, r.json()
            rows = admin.get(f"{BASE_URL}/api/admin/blog").json()
            rows = rows["posts"] if isinstance(rows, dict) else rows
            by_id = {p["id"]: p for p in rows}
            assert by_id[a["id"]]["published"] is True
            assert by_id[b["id"]]["published"] is True
            assert requests.get(f"{BASE_URL}/api/blog/{a['slug']}").status_code == 200
        finally:
            for pid in ids:
                admin.delete(f"{BASE_URL}/api/admin/blog/{pid}")

    def test_default_published_true(self, admin):
        p = _make_post(admin, "TEST_ Bulk Default", published=False)
        try:
            r = admin.post(f"{BASE_URL}/api/admin/blog/bulk-publish", json={"ids": [p["id"]]})
            assert r.status_code == 200, r.text[:200]
            assert r.json()["updated"] == 1
            rows = admin.get(f"{BASE_URL}/api/admin/blog").json()
            rows = rows["posts"] if isinstance(rows, dict) else rows
            row = next(x for x in rows if x["id"] == p["id"])
            assert row["published"] is True
        finally:
            admin.delete(f"{BASE_URL}/api/admin/blog/{p['id']}")

    def test_partial_mix_of_valid_and_invalid_ids(self, admin):
        p = _make_post(admin, "TEST_ Bulk Mixed", published=True)
        try:
            r = admin.post(f"{BASE_URL}/api/admin/blog/bulk-publish",
                           json={"ids": [p["id"], "ghost-id"], "published": False})
            assert r.status_code == 200, r.text[:200]
            assert r.json()["updated"] == 1, r.json()
        finally:
            admin.post(f"{BASE_URL}/api/admin/blog/bulk-publish", json={"ids": [p["id"]], "published": True})
            admin.delete(f"{BASE_URL}/api/admin/blog/{p['id']}")


# ---------------- Regression: autopilot settings persistence ----------------
class TestAutopilotSettingsRegression:
    def test_settings_and_topics_still_persist(self, admin):
        r = admin.put(f"{BASE_URL}/api/admin/blog-autopilot",
                      json={"enabled": True, "frequency_days": 14,
                            "custom_topics": ["TEST_ idea alpha", "TEST_ idea beta"]})
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["frequency_days"] == 14
        assert d["custom_topics"] == ["TEST_ idea alpha", "TEST_ idea beta"]
        g = admin.get(f"{BASE_URL}/api/admin/blog-autopilot").json()
        assert g["enabled"] is True and g["frequency_days"] == 14
        assert g["custom_topics"] == ["TEST_ idea alpha", "TEST_ idea beta"]
        admin.put(f"{BASE_URL}/api/admin/blog-autopilot",
                  json={"frequency_days": 7, "custom_topics": []})
