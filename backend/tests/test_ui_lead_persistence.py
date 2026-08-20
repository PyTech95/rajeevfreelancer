"""Verifies leads created through the UI flows (Playwright) persisted in Mongo via GET /api/leads."""
import os
import pytest
import requests
from dotenv import dotenv_values

_env = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _env["REACT_APP_BACKEND_URL"]).rstrip("/")
API = f"{BASE_URL}/api"
ADMIN = {"email": "admin@rajeevfreelancer.com", "password": "RajeevAdmin#2026"}

EXPECTED = {
    "test_pw_contact@example.test": "TEST Playwright Contact",
    "test_pw_inquiry@example.test": "TEST Inquiry Modal",
    "test_pw_home@example.test": "TEST Home Form",
}


@pytest.fixture(scope="module")
def leads():
    tok = requests.post(f"{API}/auth/login", json=ADMIN, timeout=15).json()["token"]
    r = requests.get(f"{API}/leads?limit=200", headers={"Authorization": f"Bearer {tok}"}, timeout=20)
    assert r.status_code == 200
    return r.json()["leads"]


@pytest.mark.parametrize("email,name", list(EXPECTED.items()))
def test_ui_lead_persisted(leads, email, name):
    match = [l for l in leads if l.get("email") == email]
    assert match, f"UI-submitted lead {email} not persisted"
    assert match[0]["name"] == name


def test_call_booking_lead_persisted(leads):
    match = [l for l in leads if l.get("name") == "TEST Call Booking"]
    assert match, "call-scheduler lead not persisted"
    lead = match[0]
    assert lead["service"] == "Call booking"
    assert "Call requested" in (lead.get("message") or "")
    assert lead.get("phone")
