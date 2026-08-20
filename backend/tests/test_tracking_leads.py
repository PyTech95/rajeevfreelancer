"""Backend tests: leads persistence, tracking site-settings group, services catalog regression."""
import os
import re
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"

TRACKING_KEYS = ["ga4_id", "ads_id", "ads_conversion_label", "gtm_id", "meta_pixel_id",
                 "head_code", "body_code", "thankyou_code"]


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def test_credentials():
    p = Path("/app/memory/test_credentials.md")
    if not p.exists():
        pytest.skip("missing test_credentials.md")
    c = p.read_text()
    e = re.search(r'(?im)^\s*(?:[-*]\s*)?(?:\*\*)?email(?:\*\*)?\s*:\s*`?([^`\s]+)', c)
    pw = re.search(r'(?im)^\s*(?:[-*]\s*)?(?:\*\*)?password(?:\*\*)?\s*:\s*`?([^`\s]+)', c)
    if not e or not pw:
        pytest.skip("no creds parsed")
    return {"email": e.group(1), "password": pw.group(1)}


@pytest.fixture(scope="session")
def auth_token(api_client, test_credentials):
    r = api_client.post(f"{API}/auth/login", json=test_credentials)
    if r.status_code != 200:
        pytest.fail(f"login failed {r.status_code}: {r.text[:300]}")
    tok = r.json().get("token")
    assert tok
    return tok


@pytest.fixture(scope="session")
def admin_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


# ---------------- Regression: public endpoints ----------------
class TestPublicRegression:
    def test_services_catalog(self, api_client):
        r = api_client.get(f"{API}/services")
        assert r.status_code == 200
        data = r.json()
        items = data["services"] if isinstance(data, dict) else data
        assert isinstance(items, list) and len(items) > 0
        assert "slug" in items[0] and "name" in items[0]

    def test_public_settings_has_tracking_group(self, api_client):
        r = api_client.get(f"{API}/settings")
        assert r.status_code == 200
        t = r.json().get("tracking")
        assert isinstance(t, dict), "tracking group missing from public /api/settings"
        for k in TRACKING_KEYS:
            assert k in t, f"tracking.{k} missing"


# ---------------- Leads ----------------
class TestLeads:
    created = []

    def test_create_lead_and_verify_persistence(self, api_client, admin_headers):
        marker = uuid.uuid4().hex[:8]
        payload = {
            "name": f"TEST_Lead {marker}",
            "email": f"test_{marker}@example.test",
            "phone": "+919999999999",
            "service": "Web Development",
            "message": "TEST automated lead",
            "source_path": "/contact",
            "budget": "1000",
        }
        r = api_client.post(f"{API}/leads", json=payload)
        assert r.status_code == 200, r.text[:300]
        body = r.json()
        assert body.get("ok") is True
        assert isinstance(body.get("id"), str) and body["id"]
        TestLeads.created.append(body["id"])

        g = api_client.get(f"{API}/leads?limit=50", headers=admin_headers)
        assert g.status_code == 200
        leads = g.json()["leads"]
        match = [l for l in leads if l.get("id") == body["id"]]
        assert match, "created lead not returned by GET /api/leads"
        lead = match[0]
        assert lead["email"] == payload["email"]
        assert lead["name"] == payload["name"]
        assert lead["service"] == payload["service"]
        assert lead.get("status") == "new"
        assert "_id" not in lead

    def test_leads_requires_auth(self, api_client):
        r = api_client.get(f"{API}/leads")
        assert r.status_code in (401, 403), f"unauthenticated GET /leads returned {r.status_code}"

    def test_create_lead_validation(self, api_client):
        # email/phone are intentionally optional (call-booking flow); name is required
        r = api_client.post(f"{API}/leads", json={"email": "x@example.test"})
        assert r.status_code == 422, f"missing name accepted: {r.status_code}"

    def test_lead_status_patch(self, api_client, admin_headers):
        if not TestLeads.created:
            pytest.skip("no lead created")
        lid = TestLeads.created[0]
        r = api_client.patch(f"{API}/leads/{lid}", json={"status": "contacted"}, headers=admin_headers)
        assert r.status_code == 200
        g = api_client.get(f"{API}/leads?limit=50", headers=admin_headers)
        lead = [l for l in g.json()["leads"] if l["id"] == lid][0]
        assert lead["status"] == "contacted"
        bad = api_client.patch(f"{API}/leads/{lid}", json={"status": "bogus"}, headers=admin_headers)
        assert bad.status_code == 400
        # reset
        api_client.patch(f"{API}/leads/{lid}", json={"status": "new"}, headers=admin_headers)


# ---------------- Tracking settings ----------------
class TestTrackingSettings:
    def test_admin_get_settings(self, api_client, admin_headers):
        r = api_client.get(f"{API}/admin/settings/site", headers=admin_headers)
        assert r.status_code == 200
        assert isinstance(r.json().get("tracking"), dict)

    def test_update_tracking_and_persist_then_reset(self, api_client, admin_headers):
        head = "<script>window.__testHead=1</script>"
        ty = "<script>window.__tyTest=1</script>"
        r = api_client.put(f"{API}/admin/settings/site", headers=admin_headers,
                           json={"tracking": {"head_code": head, "thankyou_code": ty, "gtm_id": "GTM-TEST123"}})
        assert r.status_code == 200, r.text[:300]
        t = r.json()["tracking"]
        assert t["head_code"] == head and t["thankyou_code"] == ty and t["gtm_id"] == "GTM-TEST123"

        pub = api_client.get(f"{API}/settings").json()["tracking"]
        assert pub["head_code"] == head, "head_code not exposed on public /api/settings"
        assert pub["thankyou_code"] == ty
        # other groups untouched
        assert api_client.get(f"{API}/settings").json()["contact"]["email"]

        # reset
        rr = api_client.put(f"{API}/admin/settings/site", headers=admin_headers,
                            json={"tracking": {"head_code": "", "body_code": "", "thankyou_code": "", "gtm_id": ""}})
        assert rr.status_code == 200
        t2 = rr.json()["tracking"]
        assert t2["head_code"] == "" and t2["thankyou_code"] == "" and t2["gtm_id"] == ""

    def test_settings_requires_auth(self, api_client):
        r = api_client.put(f"{API}/admin/settings/site", json={"tracking": {"head_code": "x"}})
        assert r.status_code in (401, 403)

    def test_settings_rejects_empty_payload(self, api_client, admin_headers):
        r = api_client.put(f"{API}/admin/settings/site", headers=admin_headers, json={"bogus": {"a": 1}})
        assert r.status_code == 400


@pytest.fixture(scope="session", autouse=True)
def final_reset(api_client):
    yield
    # ensure tracking custom code is empty after the suite
    try:
        p = Path("/app/memory/test_credentials.md").read_text()
        e = re.search(r'(?im)^\s*(?:[-*]\s*)?(?:\*\*)?email(?:\*\*)?\s*:\s*`?([^`\s]+)', p).group(1)
        pw = re.search(r'(?im)^\s*(?:[-*]\s*)?(?:\*\*)?password(?:\*\*)?\s*:\s*`?([^`\s]+)', p).group(1)
        tok = api_client.post(f"{API}/auth/login", json={"email": e, "password": pw}).json()["token"]
        api_client.put(f"{API}/admin/settings/site", headers={"Authorization": f"Bearer {tok}"},
                       json={"tracking": {"head_code": "", "body_code": "", "thankyou_code": "", "gtm_id": ""}})
    except Exception:
        pass
