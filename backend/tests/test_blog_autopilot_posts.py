"""Verify the last autopilot-generated post is publicly fetchable and well formed."""
import os
import re

import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or frontend_env["REACT_APP_BACKEND_URL"]).rstrip("/")
SLUG_RE = re.compile(r"^[a-z0-9-]+$")
ADMIN = {"email": "rajeev@rajeevfreelancer.com", "password": "Rajeev@2026!Admin"}


def test_generated_posts_public_and_clean():
    s = requests.Session()
    tok = s.post(f"{BASE_URL}/api/auth/login", json=ADMIN).json()["token"]
    s.headers["Authorization"] = f"Bearer {tok}"
    posts = s.get(f"{BASE_URL}/api/admin/blog").json()["posts"]
    ai = [p for p in posts if p.get("ai_generated")]
    assert ai, "no ai_generated posts found"
    dirty = [p["slug"] for p in ai if not SLUG_RE.match(p["slug"])]
    for p in ai:
        assert 8 <= len(p["body"]) <= 12, f"{p['slug']} body paras={len(p['body'])}"
        assert p["excerpt"] and p["category"] and p["tags"]
        if p.get("published"):
            r = requests.get(f"{BASE_URL}/api/blog/{p['slug']}")
            print(p["slug"], r.status_code)
            assert r.status_code == 200, f"{p['slug']} -> {r.status_code}"
            assert r.json()["post"]["title"] == p["title"]
    assert not dirty, f"AI posts with dirty slugs (pre-fix leftovers): {dirty}"
