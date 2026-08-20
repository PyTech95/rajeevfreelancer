"""Jeny AI chat assistant — backend tests (SSE streaming, phone capture, admin chat CRUD).

NOTE: LLM allows only 1 concurrent request; all chat calls are sequential (module-scoped
ordering) and each may take 5-25s.
"""
import json
import os
import re
import time
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


# ---------------- fixtures ----------------
@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def credentials():
    p = Path("/app/memory/test_credentials.md")
    if not p.exists():
        pytest.skip("missing test_credentials.md")
    c = p.read_text()
    e = re.search(r'(?im)^\s*(?:[-*]\s*)?(?:\*\*)?email(?:\*\*)?\s*:\s*`?([^`\s]+)', c)
    pw = re.search(r'(?im)^\s*(?:[-*]\s*)?(?:\*\*)?password(?:\*\*)?\s*:\s*`?([^`\s]+)', c)
    if not e or not pw:
        pytest.skip("no creds parsed")
    return {"email": e.group(1), "password": pw.group(1)}


@pytest.fixture(scope="module")
def token(client, credentials):
    r = client.post(f"{API}/auth/login", json=credentials)
    if r.status_code != 200:
        pytest.fail(f"admin login failed {r.status_code}: {r.text[:300]}")
    t = r.json().get("token") or r.json().get("access_token")
    assert t, f"no token in login response: {r.json()}"
    return t


@pytest.fixture(scope="module")
def auth(token):
    return {"Authorization": f"Bearer {token}"}


# session ids created during this module (cleaned up at the end)
CREATED = []


@pytest.fixture(scope="module")
def sid_ctx():
    s = f"TEST-jeny-ctx-{uuid.uuid4().hex[:8]}"
    CREATED.append(s)
    return s


@pytest.fixture(scope="module")
def sid_phone():
    s = f"TEST-jeny-phone-{uuid.uuid4().hex[:8]}"
    CREATED.append(s)
    return s


@pytest.fixture(scope="module", autouse=True)
def cleanup(auth):
    yield
    for s in CREATED:
        try:
            requests.delete(f"{API}/admin/chats/{s}", headers=auth, timeout=30)
        except Exception:
            pass


# ---------------- helpers ----------------
def stream_chat(session_id, message, page="/", timeout=90):
    """POST /api/chat and parse the SSE stream. Returns (status, full_text, done_event, chunk_count)."""
    r = requests.post(f"{API}/chat", json={"session_id": session_id, "message": message, "page": page},
                      stream=True, timeout=timeout,
                      headers={"Content-Type": "application/json", "Accept": "text/event-stream"})
    if r.status_code != 200:
        return r.status_code, r.text[:400], None, 0
    ctype = r.headers.get("content-type", "")
    full, done, chunks = [], None, 0
    for raw in r.iter_lines(decode_unicode=True):
        if not raw or not raw.startswith("data: "):
            continue
        payload = json.loads(raw[6:])
        if "delta" in payload:
            full.append(payload["delta"])
            chunks += 1
        elif payload.get("done"):
            done = payload
    return r.status_code, ("".join(full), ctype), done, chunks


# ---------------- POST /api/chat validation ----------------
class TestChatValidation:
    def test_missing_message_returns_422(self, client):
        r = client.post(f"{API}/chat", json={"session_id": "x", "message": "  "})
        assert r.status_code == 422, r.text[:300]

    def test_missing_session_id_returns_422(self, client):
        r = client.post(f"{API}/chat", json={"message": "hello"})
        assert r.status_code == 422, r.text[:300]


# ---------------- SSE streaming + multi-turn memory ----------------
class TestChatStreamingAndMemory:
    def test_01_first_turn_streams(self, sid_ctx):
        status, res, done, chunks = stream_chat(sid_ctx, "Hi Jeny, my name is Arjun. What services does Rajeev offer?")
        assert status == 200, res
        text, ctype = res
        assert "text/event-stream" in ctype, f"wrong content-type: {ctype}"
        assert text.strip(), "assistant reply is empty"
        assert chunks >= 1, "no delta chunks streamed"
        assert done is not None and done.get("done") is True, f"missing done event: {done}"
        assert done.get("phone_captured") is False
        print(f"[turn1 chunks={chunks}] {text[:200]}")

    def test_02_second_turn_remembers_context(self, sid_ctx):
        status, res, done, _ = stream_chat(sid_ctx, "What is my name? Reply with just the name.")
        assert status == 200, res
        text, _ = res
        assert text.strip(), "empty reply"
        print(f"[turn2] {text[:200]}")
        assert "arjun" in text.lower(), f"Jeny did not remember earlier context: {text[:300]}"

    def test_03_history_endpoint_public(self, client, sid_ctx):
        r = client.get(f"{API}/chat/history/{sid_ctx}")
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d.get("messages"), list)
        assert len(d["messages"]) == 4, f"expected 4 messages (2 turns), got {len(d['messages'])}"
        roles = [m["role"] for m in d["messages"]]
        assert roles == ["user", "assistant", "user", "assistant"], roles
        assert all(m.get("text") for m in d["messages"]), "empty message text stored"
        assert d["phone_captured"] is False

    def test_04_history_unknown_session_returns_empty(self, client):
        r = client.get(f"{API}/chat/history/does-not-exist-{uuid.uuid4().hex[:6]}")
        assert r.status_code == 200
        assert r.json() == {"messages": [], "phone_captured": False}


# ---------------- phone capture + auto lead ----------------
class TestPhoneCaptureAndLead:
    # unique per run so previously-created (undeletable) leads don't pollute the count
    PHONE = "98765" + uuid.uuid4().int.__str__()[:5]

    def test_01_phone_capture_sets_flag(self, sid_phone):
        status, res, done, _ = stream_chat(sid_phone, f"Sure, my number is +91 {self.PHONE}")
        assert status == 200, res
        text, _ = res
        assert text.strip(), "empty reply"
        assert done.get("phone_captured") is True, f"phone not captured: {done}"

    def test_02_session_stores_phone(self, client, auth, sid_phone):
        r = client.get(f"{API}/admin/chats/{sid_phone}", headers=auth)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert "_id" not in d
        assert d["phone_captured"] is True
        assert self.PHONE in d["phone"], d["phone"]
        assert d["phone"].startswith("+91"), f"expected +91 prefix, got {d['phone']}"

    def test_02b_admin_list_shows_phone_and_lead_flag(self, client, auth, sid_phone):
        time.sleep(2)
        r = client.get(f"{API}/admin/chats", headers=auth)
        assert r.status_code == 200
        s = next((x for x in r.json()["sessions"] if x["session_id"] == sid_phone), None)
        assert s, "phone session missing from admin list"
        assert s["phone_captured"] is True and self.PHONE in s["phone"]
        assert s["lead_created"] is True, "lead_created flag not set on session"

    def test_03_lead_auto_created_once(self, client, auth, sid_phone):
        # give the background task time
        matched = []
        for _ in range(10):
            r = client.get(f"{API}/leads?limit=200", headers=auth)
            assert r.status_code == 200, r.text[:300]
            leads = r.json()["leads"]
            matched = [l for l in leads if l.get("service") == "Jeny chat lead"
                       and self.PHONE in str(l.get("phone", ""))]
            if matched:
                break
            time.sleep(2)
        assert matched, "no Jeny chat lead created for captured phone"
        lead = matched[0]
        assert lead["name"] == "Website chat visitor (Jeny)", lead["name"]
        assert lead.get("source_path") == "/jeny-chat"
        assert "_id" not in lead
        assert len(matched) == 1, f"lead duplicated: {len(matched)} copies"

    def test_04_repeat_phone_does_not_duplicate_lead(self, client, auth, sid_phone):
        status, res, done, _ = stream_chat(sid_phone, f"Just to confirm my whatsapp is {self.PHONE}")
        assert status == 200, res
        assert done.get("phone_captured") is True
        time.sleep(3)
        r = client.get(f"{API}/leads?limit=200", headers=auth)
        matched = [l for l in r.json()["leads"] if l.get("service") == "Jeny chat lead"
                   and self.PHONE in str(l.get("phone", ""))]
        assert len(matched) == 1, f"lead created more than once per session: {len(matched)}"

    def test_05_cleanup_lead(self, client, auth):
        # leads have no delete endpoint; document leftover test data
        r = client.get(f"{API}/leads?limit=200", headers=auth)
        assert r.status_code == 200


# ---------------- admin chat endpoints ----------------
class TestAdminChats:
    """Self-contained: creates its own session so the class can run in any xdist worker."""

    @pytest.fixture(scope="class")
    def own_sid(self):
        sid = f"TEST-jeny-admin-{uuid.uuid4().hex[:8]}"
        CREATED.append(sid)
        status, res, done, _ = stream_chat(sid, "Hi Jeny, does Rajeev build mobile apps?")
        assert status == 200, res
        return sid

    def test_list_requires_auth(self, client):
        assert client.get(f"{API}/admin/chats").status_code == 401

    def test_detail_requires_auth(self, client, own_sid):
        assert client.get(f"{API}/admin/chats/{own_sid}").status_code == 401

    def test_delete_requires_auth(self, client, own_sid):
        assert client.delete(f"{API}/admin/chats/{own_sid}").status_code == 401

    def test_invalid_token_rejected(self, client):
        r = client.get(f"{API}/admin/chats", headers={"Authorization": "Bearer bogus.token.here"})
        assert r.status_code == 401

    def test_list_shape(self, client, auth, own_sid):
        r = client.get(f"{API}/admin/chats", headers=auth)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert isinstance(d["sessions"], list) and isinstance(d["total"], int)
        by_id = {s["session_id"]: s for s in d["sessions"]}
        assert own_sid in by_id, "newly created session missing from admin list"
        s = by_id[own_sid]
        for k in ("created_at", "updated_at", "page", "phone", "phone_captured", "lead_created",
                  "message_count", "last_message"):
            assert k in s, f"missing key {k}"
        assert s["message_count"] == 2, s["message_count"]
        assert s["last_message"]
        assert s["phone_captured"] is False
        # newest-first ordering
        updated = [x["updated_at"] for x in d["sessions"]]
        assert updated == sorted(updated, reverse=True), "sessions not sorted by updated_at desc"

    def test_detail_404_for_unknown(self, client, auth):
        r = client.get(f"{API}/admin/chats/nope-{uuid.uuid4().hex[:6]}", headers=auth)
        assert r.status_code == 404

    def test_delete_and_verify_removal(self, client, auth):
        sid = f"TEST-jeny-del-{uuid.uuid4().hex[:8]}"
        # create session via history? no — needs a chat call; use a minimal chat
        status, res, done, _ = stream_chat(sid, "Hello")
        assert status == 200, res
        r = client.delete(f"{API}/admin/chats/{sid}", headers=auth)
        assert r.status_code == 200, r.text[:300]
        assert r.json().get("ok") is True
        assert client.get(f"{API}/admin/chats/{sid}", headers=auth).status_code == 404
        assert client.get(f"{API}/chat/history/{sid}").json()["messages"] == []
        # deleting again -> 404
        assert client.delete(f"{API}/admin/chats/{sid}", headers=auth).status_code == 404
