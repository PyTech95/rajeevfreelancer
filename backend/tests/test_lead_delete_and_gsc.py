"""Backend tests for new features: DELETE /api/leads/{id} and seo.google_verification setting."""
import os
import copy
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE = line.split("=", 1)[1].strip().rstrip("/")
API = f"{BASE}/api"

ADMIN_EMAIL = "rajeev@rajeevfreelancer.com"
ADMIN_PASSWORD = "Rajeev@2026!Admin"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    if r.status_code != 200:
        pytest.fail(f"admin login failed {r.status_code} {r.text[:300]}")
    tok = r.json().get("access_token") or r.json().get("token")
    assert tok, "no token in login response"
    return tok


@pytest.fixture(scope="module")
def auth(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def _create_lead(suffix="delete"):
    payload = {
        "name": f"TEST_Delete Lead {suffix}",
        "email": f"test_delete_{suffix}@example.com",
        "phone": "+919999900011",
        "service": "SEO",
        "message": "QA lead for delete endpoint",
        "source_path": "/contact",
    }
    r = requests.post(f"{API}/leads", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("ok") is True and data.get("id")
    return data["id"]


# --- DELETE /api/leads/{id} ---

def test_delete_lead_requires_auth():
    lid = _create_lead("noauth")
    r = requests.delete(f"{API}/leads/{lid}", timeout=15)
    assert r.status_code in (401, 403), f"unauthenticated delete allowed: {r.status_code}"


def test_delete_lead_success_and_removal(auth):
    lid = _create_lead("ok")
    # verify visible first
    r = requests.get(f"{API}/leads?limit=200", headers=auth, timeout=20)
    assert r.status_code == 200
    assert lid in {l.get("id") for l in r.json()["leads"]}

    d = requests.delete(f"{API}/leads/{lid}", headers=auth, timeout=20)
    assert d.status_code == 200, d.text
    assert d.json() == {"ok": True}

    r2 = requests.get(f"{API}/leads?limit=200", headers=auth, timeout=20)
    assert lid not in {l.get("id") for l in r2.json()["leads"]}


def test_delete_lead_not_found(auth):
    r = requests.delete(f"{API}/leads/does-not-exist-abc123", headers=auth, timeout=20)
    assert r.status_code == 404, f"expected 404, got {r.status_code} {r.text[:200]}"


def test_delete_lead_twice_is_404(auth):
    lid = _create_lead("twice")
    assert requests.delete(f"{API}/leads/{lid}", headers=auth, timeout=20).status_code == 200
    assert requests.delete(f"{API}/leads/{lid}", headers=auth, timeout=20).status_code == 404


# --- seo.google_verification setting ---

def test_settings_has_google_verification_field():
    r = requests.get(f"{API}/settings", timeout=20)
    assert r.status_code == 200
    seo = r.json().get("seo", {})
    assert "google_verification" in seo, f"seo keys: {list(seo.keys())}"


def test_update_google_verification_persists(auth):
    orig = requests.get(f"{API}/settings", timeout=20).json()
    payload = copy.deepcopy(orig)
    payload.setdefault("seo", {})["google_verification"] = "test-gsc-verify-123"
    payload.pop("_id", None)
    put = requests.put(f"{API}/admin/settings/site", json=payload, headers=auth, timeout=20)
    assert put.status_code == 200, put.text
    try:
        got = requests.get(f"{API}/settings", timeout=20).json()
        assert got["seo"]["google_verification"] == "test-gsc-verify-123"
    finally:
        restore = copy.deepcopy(got if isinstance(got, dict) else orig)
        restore.setdefault("seo", {})["google_verification"] = ""
        restore.pop("_id", None)
        rr = requests.put(f"{API}/admin/settings/site", json=restore, headers=auth, timeout=20)
        assert rr.status_code == 200
        assert requests.get(f"{API}/settings", timeout=20).json()["seo"]["google_verification"] == ""


def test_settings_marketing_defaults_intact():
    m = requests.get(f"{API}/settings", timeout=20).json().get("marketing", {})
    assert m.get("offers_enabled") is True
    assert m.get("popup_enabled") is True
