"""Backend tests for marketing offers/popup admin toggle and lead regression."""
import os
import uuid
import pytest
import requests

from dotenv import dotenv_values as _dv
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _dv("/app/frontend/.env")["REACT_APP_BACKEND_URL"]).rstrip("/")
ADMIN_EMAIL = "rajeev@rajeevfreelancer.com"
ADMIN_PASSWORD = "Rajeev@2026!Admin"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_headers(api):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


class TestMarketingToggle:
    def test_default_marketing_present(self, api):
        r = api.get(f"{BASE_URL}/api/settings")
        assert r.status_code == 200
        data = r.json()
        assert "marketing" in data
        assert "offers_enabled" in data["marketing"]
        assert "popup_enabled" in data["marketing"]

    def test_toggle_off_and_on(self, api, admin_headers):
        # Turn OFF
        r = api.put(f"{BASE_URL}/api/admin/settings/site",
                    json={"marketing": {"offers_enabled": False, "popup_enabled": False}},
                    headers=admin_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["marketing"]["offers_enabled"] is False
        assert data["marketing"]["popup_enabled"] is False

        # Verify via public endpoint
        pub = api.get(f"{BASE_URL}/api/settings").json()
        assert pub["marketing"]["offers_enabled"] is False
        assert pub["marketing"]["popup_enabled"] is False

        # Turn ON
        r = api.put(f"{BASE_URL}/api/admin/settings/site",
                    json={"marketing": {"offers_enabled": True, "popup_enabled": True}},
                    headers=admin_headers)
        assert r.status_code == 200
        pub = api.get(f"{BASE_URL}/api/settings").json()
        assert pub["marketing"]["offers_enabled"] is True
        assert pub["marketing"]["popup_enabled"] is True


class TestLeadRegression:
    def test_create_lead_returns_ok_id(self, api):
        payload = {
            "name": f"TEST_Marketing_{uuid.uuid4().hex[:6]}",
            "email": "test_marketing@example.com",
            "phone": "+911234567890",
            "service": "seo",
            "budget": "1000",
            "message": "TEST marketing toggle regression",
            "source_path": "/contact",
        }
        r = api.post(f"{BASE_URL}/api/leads", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["ok"] is True
        assert isinstance(data["id"], str) and len(data["id"]) > 0
        return payload, data["id"]

    def test_lead_visible_to_admin(self, api, admin_headers):
        # Create lead
        marker = f"TEST_Mkt_{uuid.uuid4().hex[:8]}"
        payload = {"name": marker, "email": "mkt@example.com", "phone": "+911234567890",
                   "message": "regression check"}
        cr = api.post(f"{BASE_URL}/api/leads", json=payload)
        assert cr.status_code == 200
        lead_id = cr.json()["id"]
        # List
        lr = api.get(f"{BASE_URL}/api/leads?limit=50", headers=admin_headers)
        assert lr.status_code == 200
        leads = lr.json()["leads"]
        assert any(l.get("id") == lead_id and l.get("name") == marker for l in leads), \
            f"Lead {lead_id} not found in admin listing"
