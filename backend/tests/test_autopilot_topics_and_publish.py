"""Iteration 4: Autopilot custom topics queue + one-click publish/unpublish API."""
import os
import re

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
def restore_topics(admin):
    yield
    admin.put(f"{BASE_URL}/api/admin/blog-autopilot", json={"custom_topics": [], "enabled": True})


# ---------------- Custom topics settings ----------------
class TestCustomTopicsSettings:
    def test_auth_required(self):
        r = requests.put(f"{BASE_URL}/api/admin/blog-autopilot", json={"custom_topics": ["x"]})
        assert r.status_code in (401, 403), r.status_code

    def test_trim_dedupe_and_next_topic(self, admin):
        payload = {"custom_topics": ["  TEST_ Local SEO for dentists  ", "", "   ",
                                     "test_ local seo for dentists", "TEST_ WhatsApp funnels"]}
        r = admin.put(f"{BASE_URL}/api/admin/blog-autopilot", json=payload)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["custom_topics"] == ["TEST_ Local SEO for dentists", "TEST_ WhatsApp funnels"], d["custom_topics"]
        assert d["next_topic"] == "TEST_ Local SEO for dentists", d["next_topic"]

        g = admin.get(f"{BASE_URL}/api/admin/blog-autopilot")
        assert g.status_code == 200
        gd = g.json()
        assert gd["custom_topics"] == ["TEST_ Local SEO for dentists", "TEST_ WhatsApp funnels"]
        assert gd["next_topic"] == "TEST_ Local SEO for dentists"

    def test_cap_at_50(self, admin):
        r = admin.put(f"{BASE_URL}/api/admin/blog-autopilot",
                      json={"custom_topics": [f"TEST_ topic {i}" for i in range(60)]})
        assert r.status_code == 200, r.text[:300]
        assert len(r.json()["custom_topics"]) == 50
        assert r.json()["next_topic"] == "TEST_ topic 0"

    def test_clear_topics_falls_back_to_rotation(self, admin):
        r = admin.put(f"{BASE_URL}/api/admin/blog-autopilot", json={"custom_topics": []})
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["custom_topics"] == []
        assert "—" in d["next_topic"] or len(d["next_topic"]) > 3

    def test_other_settings_still_persist(self, admin):
        r = admin.put(f"{BASE_URL}/api/admin/blog-autopilot",
                      json={"enabled": True, "frequency_days": 5, "auto_publish": True})
        assert r.status_code == 200
        assert r.json()["frequency_days"] == 5
        g = admin.get(f"{BASE_URL}/api/admin/blog-autopilot").json()
        assert g["frequency_days"] == 5 and g["enabled"] is True
        # restore weekly
        admin.put(f"{BASE_URL}/api/admin/blog-autopilot", json={"frequency_days": 7})


# ---------------- One-click publish/unpublish ----------------
class TestPublishToggle:
    def test_publish_toggle_and_persistence(self, admin):
        created = admin.post(f"{BASE_URL}/api/admin/blog", json={
            "title": "TEST_ Publish Toggle Post",
            "excerpt": "test excerpt",
            "category": "Guide",
            "body": ["para one", "para two"],
            "published": True,
        })
        assert created.status_code in (200, 201), created.text[:300]
        post = created.json()
        pid, slug = post["id"], post["slug"]
        try:
            r = admin.patch(f"{BASE_URL}/api/admin/blog/{pid}/publish", json={"published": False})
            assert r.status_code == 200, r.text[:300]
            assert r.json()["published"] is False
            assert r.json()["id"] == pid
            assert "_id" not in r.json()

            pub = requests.get(f"{BASE_URL}/api/blog/{slug}")
            assert pub.status_code == 404, f"draft still public: {pub.status_code}"

            r = admin.patch(f"{BASE_URL}/api/admin/blog/{pid}/publish", json={"published": True})
            assert r.status_code == 200
            assert r.json()["published"] is True
            pub = requests.get(f"{BASE_URL}/api/blog/{slug}")
            assert pub.status_code == 200, f"live post not public: {pub.status_code}"

            lst = admin.get(f"{BASE_URL}/api/admin/blog").json()
            rows = lst["posts"] if isinstance(lst, dict) else lst
            row = next((p for p in rows if p["id"] == pid), None)
            assert row is not None and row["published"] is True
        finally:
            admin.delete(f"{BASE_URL}/api/admin/blog/{pid}")

    def test_publish_bad_id_404(self, admin):
        r = admin.patch(f"{BASE_URL}/api/admin/blog/does-not-exist-123/publish", json={"published": True})
        assert r.status_code == 404, f"{r.status_code}: {r.text[:200]}"

    def test_publish_requires_auth(self, admin):
        r = requests.patch(f"{BASE_URL}/api/admin/blog/whatever/publish", json={"published": True})
        assert r.status_code in (401, 403), r.status_code


# ---------------- Custom topic consumption via generate-now (real LLM) ----------------
class TestCustomTopicConsumption:
    def test_run_consumes_first_custom_topic(self, admin):
        topics = ["TEST_ Shopify speed optimisation checklist", "TEST_ second idea stays queued"]
        r = admin.put(f"{BASE_URL}/api/admin/blog-autopilot", json={"custom_topics": topics})
        assert r.json()["custom_topics"] == topics

        run = admin.post(f"{BASE_URL}/api/admin/blog-autopilot/run", timeout=180)
        assert run.status_code == 200, f"{run.status_code}: {run.text[:400]}"
        post = run.json()
        pid = post["id"]
        try:
            assert SLUG_RE.match(post["slug"]), f"dirty slug: {post['slug']}"
            assert 8 <= len(post["body"]) <= 12, f"body paragraphs={len(post['body'])}"
            blob = (post["title"] + " " + post["excerpt"] + " " + " ".join(post["body"])).lower()
            assert "shopify" in blob, f"topic not reflected. title={post['title']}"

            g = admin.get(f"{BASE_URL}/api/admin/blog-autopilot").json()
            assert g["custom_topics"] == ["TEST_ second idea stays queued"], g["custom_topics"]
            assert g["next_topic"] == "TEST_ second idea stays queued"
        finally:
            admin.delete(f"{BASE_URL}/api/admin/blog/{pid}")
            admin.put(f"{BASE_URL}/api/admin/blog-autopilot", json={"custom_topics": []})
