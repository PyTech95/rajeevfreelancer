"""QA cleanup: reset seo.google_verification to '' and delete TEST_ leads."""
import requests

BASE = ""
with open("/app/frontend/.env") as f:
    for line in f:
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE = line.split("=", 1)[1].strip().rstrip("/")
API = f"{BASE}/api"

tok = requests.post(f"{API}/auth/login", json={
    "email": "rajeev@rajeevfreelancer.com", "password": "Rajeev@2026!Admin"}, timeout=20).json()
tok = tok.get("access_token") or tok.get("token")
auth = {"Authorization": f"Bearer {tok}"}

s = requests.get(f"{API}/settings", timeout=20).json()
s.pop("_id", None)
s.setdefault("seo", {})["google_verification"] = ""
s["marketing"] = {"offers_enabled": True, "popup_enabled": True, "offers_end_date": ""}
print("PUT settings:", requests.put(f"{API}/admin/settings/site", json=s, headers=auth, timeout=20).status_code)
after = requests.get(f"{API}/settings", timeout=20).json()
print("google_verification now:", repr(after["seo"]["google_verification"]))
print("marketing now:", after["marketing"])

leads = requests.get(f"{API}/leads?limit=200", headers=auth, timeout=20).json()["leads"]
removed = 0
for l in leads:
    if str(l.get("name", "")).startswith("TEST_"):
        r = requests.delete(f"{API}/leads/{l['id']}", headers=auth, timeout=20)
        removed += 1 if r.status_code == 200 else 0
print("deleted TEST_ leads:", removed)
left = requests.get(f"{API}/leads?limit=200", headers=auth, timeout=20).json()
print("remaining leads total:", left["total"],
      "TEST_ left:", sum(1 for l in left["leads"] if str(l.get("name", "")).startswith("TEST_")))
