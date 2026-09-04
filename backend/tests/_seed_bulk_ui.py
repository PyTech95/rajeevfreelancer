"""Helper: seed/cleanup TEST_ posts used by the bulk-publish UI test."""
import os
import sys

import requests
from dotenv import dotenv_values

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL")
            or dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"]).rstrip("/")
s = requests.Session()
tok = s.post(f"{BASE_URL}/api/auth/login", json={
    "email": "rajeev@rajeevfreelancer.com", "password": "Rajeev@2026!Admin"}).json()
s.headers.update({"Authorization": f"Bearer {tok.get('access_token') or tok.get('token')}"})

SLUGS = ["test-bulk-ui-one", "test-bulk-ui-two"]

if sys.argv[1] == "seed":
    for i, slug in enumerate(SLUGS, 1):
        r = s.post(f"{BASE_URL}/api/admin/blog", json={
            "title": f"TEST_ Bulk UI {i}", "slug": slug, "excerpt": "ui test",
            "category": "Guide", "body": ["p1", "p2"], "published": True})
        print(slug, r.status_code)
else:
    rows = s.get(f"{BASE_URL}/api/admin/blog").json()
    rows = rows["posts"] if isinstance(rows, dict) else rows
    for p in rows:
        if p["slug"] in SLUGS or "TEST_" in p["title"] or "test-" in p["slug"]:
            print("delete", p["slug"], s.delete(f"{BASE_URL}/api/admin/blog/{p['id']}").status_code)
    print("drafts remaining:", [p["slug"] for p in rows if not p["published"]])
