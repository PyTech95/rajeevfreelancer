"""Backend API tests for case studies (public + admin CRUD) and sitemap."""
import os
import uuid
import pytest
import requests

from dotenv import dotenv_values as _dv
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _dv("/app/frontend/.env")["REACT_APP_BACKEND_URL"]).rstrip("/")
ADMIN_EMAIL = "rajeev@rajeevfreelancer.com"
ADMIN_PASSWORD = "Rajeev@2026!Admin"

EXPECTED_CATEGORIES = {"SEO", "AI", "Web", "Marketing", "App"}


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---- Public endpoints ----
def test_public_list_case_studies():
    r = requests.get(f"{BASE_URL}/api/case-studies", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "items" in data and "categories" in data
    items = data["items"]
    assert len(items) >= 6, f"expected >=6 items, got {len(items)}"
    cats = set(data["categories"])
    assert EXPECTED_CATEGORIES.issubset(cats), f"missing categories: {EXPECTED_CATEGORIES - cats}"
    # ensure no _id leakage
    for it in items:
        assert "_id" not in it
        assert "slug" in it and "title" in it


def test_public_get_case_study_by_slug():
    slug = "50k-downloads-fitness-app"
    r = requests.get(f"{BASE_URL}/api/case-studies/{slug}", timeout=15)
    assert r.status_code == 200
    item = r.json().get("item")
    assert item and item["slug"] == slug
    for key in ("chart", "results", "approach", "quote"):
        assert key in item, f"missing {key}"
    assert item["quote"] and "text" in item["quote"]
    assert item["chart"] and "before" in item["chart"] and "after" in item["chart"]


def test_public_get_case_study_404():
    r = requests.get(f"{BASE_URL}/api/case-studies/does-not-exist-xyz", timeout=15)
    assert r.status_code == 404


# ---- Admin auth guard ----
def test_admin_case_studies_requires_auth():
    r = requests.get(f"{BASE_URL}/api/admin/case-studies", timeout=15)
    assert r.status_code == 401


def test_admin_list_case_studies(auth_headers):
    r = requests.get(f"{BASE_URL}/api/admin/case-studies", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) >= 6


# ---- Admin CRUD full flow ----
@pytest.fixture(scope="module")
def created_case(auth_headers):
    slug = f"test-case-{uuid.uuid4().hex[:8]}"
    payload = {
        "title": "TEST_ Case Study",
        "slug": slug,
        "category": "Web",
        "metric": "10x",
        "metricLabel": "faster",
        "excerpt": "TEST excerpt",
        "results": [{"value": "10x", "label": "faster"}],
        "approach": [{"h": "Step", "t": "Do it"}],
        "chart": {"label": "x", "before": 1, "after": 10, "higherIsBetter": True},
        "quote": {"text": "great", "name": "Test", "role": "Tester"},
        "published": True,
        "order": 999,
    }
    r = requests.post(f"{BASE_URL}/api/admin/case-studies", json=payload, headers=auth_headers, timeout=15)
    assert r.status_code == 200, f"create failed: {r.status_code} {r.text}"
    doc = r.json()
    assert doc["slug"] == slug
    assert "id" in doc
    yield doc
    # teardown
    requests.delete(f"{BASE_URL}/api/admin/case-studies/{doc['id']}", headers=auth_headers, timeout=15)


def test_created_appears_in_admin_and_public(created_case, auth_headers):
    slug = created_case["slug"]
    admin_r = requests.get(f"{BASE_URL}/api/admin/case-studies", headers=auth_headers, timeout=15)
    assert any(i["slug"] == slug for i in admin_r.json()["items"])
    pub_r = requests.get(f"{BASE_URL}/api/case-studies", timeout=15)
    assert any(i["slug"] == slug for i in pub_r.json()["items"])


def test_duplicate_slug_returns_409(created_case, auth_headers):
    payload = {"title": "dup", "slug": created_case["slug"], "category": "Web"}
    r = requests.post(f"{BASE_URL}/api/admin/case-studies", json=payload, headers=auth_headers, timeout=15)
    assert r.status_code == 409


def test_update_case_study(created_case, auth_headers):
    cs_id = created_case["id"]
    payload = {
        "title": "TEST_ Updated Title",
        "slug": created_case["slug"],
        "category": "AI",
        "metric": "20x",
    }
    r = requests.put(f"{BASE_URL}/api/admin/case-studies/{cs_id}",
                     json=payload, headers=auth_headers, timeout=15)
    assert r.status_code == 200, r.text
    updated = r.json()
    assert updated["title"] == "TEST_ Updated Title"
    assert updated["category"] == "AI"
    # verify via public GET
    pub = requests.get(f"{BASE_URL}/api/case-studies/{created_case['slug']}", timeout=15)
    assert pub.status_code == 200
    assert pub.json()["item"]["title"] == "TEST_ Updated Title"


def test_delete_case_study(auth_headers):
    slug = f"test-del-{uuid.uuid4().hex[:8]}"
    r = requests.post(f"{BASE_URL}/api/admin/case-studies",
                      json={"title": "TEST_ del", "slug": slug, "category": "Web"},
                      headers=auth_headers, timeout=15)
    assert r.status_code == 200
    cs_id = r.json()["id"]
    d = requests.delete(f"{BASE_URL}/api/admin/case-studies/{cs_id}", headers=auth_headers, timeout=15)
    assert d.status_code == 200
    g = requests.get(f"{BASE_URL}/api/case-studies/{slug}", timeout=15)
    assert g.status_code == 404


# ---- Sitemap ----
def test_sitemap_contains_case_studies():
    r = requests.get(f"{BASE_URL}/api/sitemap.xml", timeout=15)
    assert r.status_code == 200
    body = r.text
    assert "/case-studies/50k-downloads-fitness-app" in body
    assert "/case-studies/3x-organic-traffic-d2c-skincare" in body
