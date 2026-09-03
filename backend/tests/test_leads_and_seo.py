"""Backend tests for leads, offers geo, sitemap, Delhi NCR, admin flows."""
import os
import time
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    # fallback read from frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE = line.split("=", 1)[1].strip().rstrip("/")
API = f"{BASE}/api"

ADMIN_EMAIL = "rajeev@rajeevfreelancer.com"
ADMIN_PASSWORD = "Rajeev@2026!Admin"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"login failed {r.status_code} {r.text}"
    tok = r.json().get("access_token") or r.json().get("token")
    assert tok
    return tok


@pytest.fixture(scope="module")
def created_lead_ids():
    return []


def test_create_lead_contact(created_lead_ids):
    payload = {
        "name": "TEST_Contact User",
        "email": "test_contact@example.com",
        "phone": "+919999900001",
        "service": "SEO",
        "message": "Automated test enquiry from contact page",
        "source_path": "/contact",
    }
    r = requests.post(f"{API}/leads", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("ok") is True
    assert "id" in data
    created_lead_ids.append(data["id"])


def test_create_lead_exit_intent(created_lead_ids):
    payload = {
        "name": "TEST_Exit User",
        "email": "test_exit@example.com",
        "phone": "+919999900002",
        "service": "exit-offer",
        "message": "Exit intent offer test",
        "source_path": "/",
    }
    r = requests.post(f"{API}/leads", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("ok") is True
    created_lead_ids.append(data["id"])


def test_admin_list_leads_contains_created(admin_token, created_lead_ids):
    r = requests.get(f"{API}/leads?limit=100", headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "leads" in data and "total" in data
    ids = {l.get("id") for l in data["leads"]}
    for lid in created_lead_ids:
        assert lid in ids, f"created lead {lid} not visible in admin list"


def test_geo_endpoint():
    r = requests.get(f"{API}/geo", timeout=15)
    assert r.status_code == 200
    # In preview, geo may be null -> UI defaults to INR
    # accept any JSON body
    r.json()


def test_sitemap_xml_valid():
    r = requests.get(f"{API}/sitemap.xml", timeout=15)
    assert r.status_code == 200
    ct = r.headers.get("content-type", "")
    assert "xml" in ct.lower(), f"unexpected content-type: {ct}"
    body = r.text
    assert "<urlset" in body
    assert "www.rajeevfreelancer.com" in body
    assert "/delhi-ncr" in body


def test_offers_or_home_reachable():
    # No dedicated offers API - offers are in frontend. Just sanity-check root works.
    r = requests.get(f"{BASE}/", timeout=15)
    assert r.status_code == 200
