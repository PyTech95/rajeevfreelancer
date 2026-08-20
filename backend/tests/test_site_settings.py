"""Backend tests for public /api/settings and admin /api/admin/settings/site.
Also verifies sitemap uses canonical_domain, digest settings endpoints, and warmup endpoints.
"""
import os
import pytest
import requests

from dotenv import dotenv_values

_env = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _env["REACT_APP_BACKEND_URL"]).rstrip("/")
ADMIN_EMAIL = "admin@rajeevfreelancer.com"
ADMIN_PASSWORD = "RajeevAdmin#2026"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---- Public settings ----
class TestPublicSettings:
    def test_get_settings_shape(self, api):
        r = api.get(f"{BASE_URL}/api/settings")
        assert r.status_code == 200
        data = r.json()
        for k in ("seo", "contact", "social", "business"):
            assert k in data and isinstance(data[k], dict)
        assert data["seo"]["canonical_domain"] == "https://rajeevfreelancer.com"
        assert "og_image" in data["seo"]
        assert "site_name" in data["seo"]

    def test_sitemap_uses_canonical_domain(self, api):
        r = api.get(f"{BASE_URL}/api/sitemap.xml")
        assert r.status_code == 200
        assert "https://rajeevfreelancer.com/" in r.text
        assert "<urlset" in r.text


# ---- Admin site settings ----
class TestAdminSiteSettings:
    def test_get_admin_settings_requires_auth(self, api):
        r = api.get(f"{BASE_URL}/api/admin/settings/site")
        assert r.status_code == 401

    def test_get_admin_settings(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/admin/settings/site", headers=admin_headers)
        assert r.status_code == 200
        assert "seo" in r.json()

    def test_put_empty_body_returns_400(self, api, admin_headers):
        r = api.put(f"{BASE_URL}/api/admin/settings/site", json={}, headers=admin_headers)
        assert r.status_code == 400

    def test_put_invalid_structure_returns_400(self, api, admin_headers):
        # non-dict values for allowed keys are stripped -> results in empty -> 400
        r = api.put(f"{BASE_URL}/api/admin/settings/site",
                    json={"seo": "not-an-object", "unknown": {"x": 1}},
                    headers=admin_headers)
        assert r.status_code == 400

    def test_put_valid_partial_merge_and_persist(self, api, admin_headers):
        new_site_name = "TEST_Rajeev_Freelancer"
        new_linkedin = "https://www.linkedin.com/in/test-rajeev"
        new_github = "https://github.com/test-rajeev"
        payload = {
            "seo": {"site_name": new_site_name},
            "social": {"linkedin": new_linkedin, "github": new_github},
        }
        r = api.put(f"{BASE_URL}/api/admin/settings/site", json=payload, headers=admin_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["seo"]["site_name"] == new_site_name
        assert data["social"]["linkedin"] == new_linkedin
        assert data["social"]["github"] == new_github
        # Other fields should still exist (merge, not replace)
        assert data["seo"]["canonical_domain"] == "https://rajeevfreelancer.com"
        assert data["contact"]["email"]

        # Verify persistence via public endpoint
        r2 = api.get(f"{BASE_URL}/api/settings")
        pub = r2.json()
        assert pub["seo"]["site_name"] == new_site_name
        assert pub["social"]["linkedin"] == new_linkedin

        # Restore defaults
        restore = {
            "seo": {"site_name": "Rajeev Freelancer"},
            "social": {"linkedin": "", "github": ""},
        }
        r3 = api.put(f"{BASE_URL}/api/admin/settings/site", json=restore, headers=admin_headers)
        assert r3.status_code == 200


# ---- Digest settings ----
class TestDigestSettings:
    def test_get_digest_settings(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/admin/digest/settings", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert "hour" in d and "tz" in d and "enabled" in d
        assert isinstance(d.get("common_timezones"), list)

    def test_update_digest_settings(self, api, admin_headers):
        r = api.put(f"{BASE_URL}/api/admin/digest/settings",
                    json={"hour": 9, "tz": "Asia/Kolkata", "enabled": True},
                    headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["hour"] == 9
        assert r.json()["tz"] == "Asia/Kolkata"

    def test_update_digest_invalid_hour(self, api, admin_headers):
        r = api.put(f"{BASE_URL}/api/admin/digest/settings",
                    json={"hour": 99, "tz": "UTC", "enabled": True},
                    headers=admin_headers)
        assert r.status_code == 400

    def test_update_digest_invalid_tz(self, api, admin_headers):
        r = api.put(f"{BASE_URL}/api/admin/digest/settings",
                    json={"hour": 7, "tz": "Not/AZone", "enabled": True},
                    headers=admin_headers)
        assert r.status_code == 400


# ---- Warmup endpoints (do NOT run 'all') ----
class TestWarmupEndpoints:
    def test_warmup_status(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/admin/pregenerate/status", headers=admin_headers)
        assert r.status_code == 200
        assert "running" in r.json()

    def test_warmup_requires_auth(self, api):
        r = api.post(f"{BASE_URL}/api/admin/pregenerate", json={"cities": ["mumbai-india"]})
        assert r.status_code == 401


# ---- Location page cache (used by SEO frontend test) ----
class TestLocationPage:
    def test_mumbai_page_returns_content(self, api):
        r = api.get(f"{BASE_URL}/api/page/freelance-seo-expert/mumbai-india")
        assert r.status_code == 200
        d = r.json()
        assert d["canonical"] == "/freelance-seo-expert/mumbai-india"
        assert "content" in d and "faqs" in d["content"]
