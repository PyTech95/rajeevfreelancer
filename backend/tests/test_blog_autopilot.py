"""Blog Autopilot API tests (admin JWT required) + slug cleanliness regression."""
import os
import re
import time

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
SLUG_RE = re.compile(r"^[a-z0-9-]+$")


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin(client):
    r = client.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.fail(f"Admin login failed {r.status_code}: {r.text[:300]}")
    token = r.json().get("access_token") or r.json().get("token")
    assert token, f"no token in {r.json()}"
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    return s


class TestAutopilotSettings:
    def test_get_requires_auth(self, client):
        r = client.get(f"{BASE_URL}/api/admin/blog-autopilot")
        assert r.status_code in (401, 403), r.status_code

    def test_get_settings_shape(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/blog-autopilot")
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        for k in ("enabled", "frequency_days", "auto_publish", "last_run",
                  "generated_count", "next_topic", "next_run"):
            assert k in d, f"missing {k} in {d}"
        assert isinstance(d["enabled"], bool)
        assert isinstance(d["frequency_days"], int)
        assert isinstance(d["auto_publish"], bool)
        assert isinstance(d["generated_count"], int)
        assert isinstance(d["next_topic"], str) and d["next_topic"]
        assert "_id" not in d

    def test_update_persists(self, admin):
        orig = admin.get(f"{BASE_URL}/api/admin/blog-autopilot").json()
        r = admin.put(f"{BASE_URL}/api/admin/blog-autopilot",
                      json={"enabled": False, "frequency_days": 30, "auto_publish": False})
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["enabled"] is False and d["frequency_days"] == 30 and d["auto_publish"] is False
        # GET verifies persistence
        g = admin.get(f"{BASE_URL}/api/admin/blog-autopilot").json()
        assert g["enabled"] is False and g["frequency_days"] == 30 and g["auto_publish"] is False
        # restore
        admin.put(f"{BASE_URL}/api/admin/blog-autopilot", json={
            "enabled": True, "frequency_days": int(orig["frequency_days"]), "auto_publish": True})
        back = admin.get(f"{BASE_URL}/api/admin/blog-autopilot").json()
        assert back["enabled"] is True and back["auto_publish"] is True

    def test_frequency_clamped(self, admin):
        r = admin.put(f"{BASE_URL}/api/admin/blog-autopilot", json={"frequency_days": 5000})
        assert r.status_code == 200
        assert r.json()["frequency_days"] == 90
        r = admin.put(f"{BASE_URL}/api/admin/blog-autopilot", json={"frequency_days": 0})
        assert r.json()["frequency_days"] == 1
        admin.put(f"{BASE_URL}/api/admin/blog-autopilot", json={"frequency_days": 7})

    def test_partial_update_does_not_clear_others(self, admin):
        admin.put(f"{BASE_URL}/api/admin/blog-autopilot", json={"enabled": True, "auto_publish": True})
        r = admin.put(f"{BASE_URL}/api/admin/blog-autopilot", json={"frequency_days": 14})
        d = r.json()
        assert d["enabled"] is True and d["auto_publish"] is True and d["frequency_days"] == 14
        admin.put(f"{BASE_URL}/api/admin/blog-autopilot", json={"frequency_days": 7})


class TestExistingSlugs:
    def test_all_public_blog_slugs_clean(self, client):
        r = client.get(f"{BASE_URL}/api/blog")
        assert r.status_code == 200
        posts = r.json()
        posts = posts.get("posts", posts) if isinstance(posts, dict) else posts
        assert isinstance(posts, list) and len(posts) > 0
        bad = [p["slug"] for p in posts if not SLUG_RE.match(p["slug"])]
        assert not bad, f"dirty slugs: {bad}"


class TestAutopilotRun:
    """Real LLM call — slow (15-40s). Creates one real post; kept (expected)."""

    def test_run_generates_valid_post(self, admin, client):
        before = admin.get(f"{BASE_URL}/api/admin/blog-autopilot").json()
        t0 = time.time()
        r = admin.post(f"{BASE_URL}/api/admin/blog-autopilot/run", timeout=180)
        elapsed = time.time() - t0
        assert r.status_code == 200, f"{r.status_code} in {elapsed:.0f}s: {r.text[:400]}"
        p = r.json()
        print(f"generated in {elapsed:.0f}s slug={p.get('slug')}")
        assert SLUG_RE.match(p["slug"]), f"dirty slug: {p['slug']!r}"
        assert p["ai_generated"] is True
        assert isinstance(p["title"], str) and p["title"].strip()
        assert isinstance(p["excerpt"], str) and len(p["excerpt"]) > 50
        assert isinstance(p["category"], str) and p["category"]
        assert isinstance(p["tags"], list) and len(p["tags"]) >= 1
        assert isinstance(p["body"], list) and 8 <= len(p["body"]) <= 12, f"body paras={len(p['body'])}"
        assert "_id" not in p

        # public fetch when published
        if p.get("published"):
            g = client.get(f"{BASE_URL}/api/blog/{p['slug']}")
            assert g.status_code == 200, f"public fetch {g.status_code}"
            body = g.json()
            fetched = body.get("post", body)
            assert fetched["title"] == p["title"]
            assert len(fetched["body"]) == len(p["body"])

        # counters updated
        after = admin.get(f"{BASE_URL}/api/admin/blog-autopilot").json()
        assert after["generated_count"] == before["generated_count"] + 1
        assert after["last_run"]

    def test_run_requires_auth(self, client):
        r = client.post(f"{BASE_URL}/api/admin/blog-autopilot/run")
        assert r.status_code in (401, 403)
