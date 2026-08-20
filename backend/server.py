from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import json
import re
import asyncio
import logging
import uuid
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, UploadFile, File
from fastapi.responses import Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

from data import SERVICES, COUNTRIES, SERVICE_MAP, CITY_MAP, TOP_CITY_SLUGS, india_city_entries
from email_utils import notify_new_lead, send_lead_confirmation, send_lead_digest
from blog_seed import BLOG_SEED
from case_seed import CASE_SEED

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("rajeevfreelancer")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
FRONTEND_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://rajeevfreelancer.com")

app = FastAPI(title="Rajeev Freelancer API")
api_router = APIRouter(prefix="/api")


# ---------------- Object storage (admin image uploads) ----------------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
STORAGE_APP = "rajeevfreelancer"
_storage_key = None
_MIME_EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg"}


def init_storage(force: bool = False):
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": os.environ.get("EMERGENT_LLM_KEY")}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                        headers={"X-Storage-Key": init_storage(), "Content-Type": content_type},
                        data=data, timeout=120)
    if resp.status_code == 404:
        resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                            headers={"X-Storage-Key": init_storage(force=True), "Content-Type": content_type},
                            data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": init_storage()}, timeout=60)
    if resp.status_code == 404:
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": init_storage(force=True)}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ---------------- Auth helpers ----------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(email: str) -> str:
    payload = {
        "sub": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_admin(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    token = auth_header[7:] if auth_header.startswith("Bearer ") else None
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"email": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return {"email": user["email"], "name": user.get("name", "Admin")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------------- Models ----------------
class LoginInput(BaseModel):
    email: EmailStr
    password: str


class LeadCreate(BaseModel):
    name: str
    email: Optional[str] = ""
    phone: Optional[str] = ""
    service: Optional[str] = ""
    budget: Optional[str] = ""
    message: Optional[str] = ""
    source_path: Optional[str] = ""
    location: Optional[str] = ""


class Lead(LeadCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "new"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ---------------- Public catalog endpoints ----------------
@api_router.get("/")
async def root():
    return {"message": "Rajeev Freelancer API", "services": len(SERVICES), "locations": len(CITY_MAP)}


@api_router.get("/services")
async def get_services():
    return {"services": SERVICES}


@api_router.get("/locations")
async def get_locations():
    countries = []
    for slug, c in COUNTRIES.items():
        countries.append({
            "slug": slug,
            "name": c["name"],
            "region": c["region"],
            "cities": india_city_entries() if slug == "india" else [{"city": city, "loc_slug": f"{_slug(city)}-{slug}"} for city in c["cities"]],
        })
    return {"countries": countries, "total_cities": len(CITY_MAP)}


@api_router.get("/service/{service_slug}")
async def get_service_hub(service_slug: str):
    service = SERVICE_MAP.get(service_slug)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    featured = []
    for loc_slug, loc in list(CITY_MAP.items())[:60]:
        featured.append({**loc})
    countries = []
    for slug, c in COUNTRIES.items():
        countries.append({
            "slug": slug,
            "name": c["name"],
            "region": c["region"],
            "cities": india_city_entries() if slug == "india" else [{"city": city, "loc_slug": f"{_slug(city)}-{slug}"} for city in c["cities"]],
        })
    return {"service": service, "countries": countries}


def _slug(text: str) -> str:
    return text.lower().replace("&", "and").replace(".", "").replace("'", "").replace(" ", "-")


# ---------------- AI content generation for location pages ----------------
def _fallback_content(service: dict, loc: dict) -> dict:
    city, country = loc["city"], loc["country"]
    kw = service["keyword"]
    return {
        "title": f"Best {service['name']} in {city} for Your Business | Rajeev Freelancer",
        "meta_description": f"Looking for the best {kw} in {city}, {country}? Rajeev helps you get more traffic, leads and sales. Book a free consultation today."[:158],
        "h1": f"Best {service['name']} in {city} for Growing Businesses",
        "intro": [
            f"Businesses in {city} face fierce competition and rising customer expectations. Generic agencies bill big retainers yet hand your account to junior staff. As a senior {kw} with 12+ years of hands-on experience, Rajeev works with you directly to turn {service['short'].lower()} into measurable growth.",
            f"Whether you are a startup founder, an SMB owner or a marketing lead in {country}, you get twelve years of judgement in the room, on every call and in every deliverable. No relays, no fluff.",
        ],
        "why_choose": [
            {"title": "12+ years, senior only", "text": f"Ex-IOG, Accenture and Google experience applied directly to your {city} project."},
            {"title": "Custom strategy", "text": f"No cookie-cutter playbooks. Everything is tailored to {city}'s market and your goals."},
            {"title": "AI-powered execution", "text": "Automation, agents and workflows that compress weeks of work into days."},
            {"title": "WhatsApp-fast comms", "text": f"Reports, updates and alerts on WhatsApp, tuned to {country}'s time zone."},
            {"title": "Measurable outcomes", "text": "We track revenue, leads and rankings, not vanity metrics."},
        ],
        "service_details": f"Delivered remotely for {city} with full attention to your local market, {service['name']} covers discovery, strategy, build, launch and optimisation. Rajeev adapts to the industries that matter in {country} and collaborates across time zones so momentum never stalls.",
        "process": [
            {"step": "01", "title": "Discovery call", "text": f"A free consultation to understand your {city} business, goals and constraints."},
            {"step": "02", "title": "Audit & strategy", "text": "A deep audit followed by a clear, prioritised roadmap."},
            {"step": "03", "title": "Implementation", "text": "Hands-on build and execution with AI automation where it saves time."},
            {"step": "04", "title": "Reporting", "text": "Transparent reporting shared over WhatsApp and email."},
            {"step": "05", "title": "Optimisation", "text": "Continuous iteration based on real data and results."},
        ],
        "whatsapp_section": f"Communication is on WhatsApp for speed. You get quick answers, progress updates, screen recordings and automated alerts, all aligned to {country}'s business hours, so you are never left waiting on a ticket queue.",
        "local_context": f"{city} hosts a diverse economy, from startups and retail to services and enterprise. Rajeev tailors {service['short'].lower()} to the buying behaviour, languages and channels that convert best in {country}.",
        "faqs": [
            {"q": f"Who is the best {kw} in {city}?", "a": f"Rajeev is a senior freelance specialist serving {city} clients with 12+ years of experience and a senior-only, hands-on approach."},
            {"q": f"How much does a {kw} charge in {city}?", "a": f"Pricing depends on scope. Most {city} engagements start with a free consultation and a fixed-scope proposal so there are no surprises."},
            {"q": "How do we communicate across time zones?", "a": f"Primarily over WhatsApp and scheduled calls aligned to {country}'s hours, with async updates in between."},
            {"q": "How soon will I see results?", "a": "It varies by service, but you will see a clear roadmap in week one and early wins within the first month."},
            {"q": "Do you work remotely?", "a": f"Yes. Rajeev works remotely with {city} clients worldwide and has served 27+ countries."},
            {"q": "How do we get started?", "a": "Book a free consultation or message on WhatsApp and you will get a response, usually within the hour."},
        ],
    }


CONTENT_SYSTEM = (
    "You are an expert SEO copywriter writing for Rajeev Freelancer, a senior freelance engineer & "
    "AI/digital-marketing consultant with 12+ years of experience (ex-IOG, Accenture, Google). "
    "Tone: professional, confident, friendly, results-focused. Write for SMB owners, founders and marketing leads. "
    "Return ONLY valid minified JSON, no markdown, no commentary."
)

# The LLM provider allows only 1 concurrent request on the base plan (429 CONCURRENCY_REQUEST_LIMIT).
# LLM_CONCURRENCY is env-configurable so upgrading the plan instantly unlocks parallel generation.
_llm_gate = asyncio.Semaphore(max(1, int(os.environ.get("LLM_CONCURRENCY", "1"))))
# Keys currently being AI-generated in the background (avoids duplicate work on concurrent visits).
_inflight_pages: set = set()


async def generate_content(service: dict, loc: dict) -> tuple[dict, bool]:
    """Return (content, ai_used). ai_used=False means the deterministic fallback was used."""
    city, country, kw = loc["city"], loc["country"], service["keyword"]
    prompt = f"""Write unique, helpful, non-generic landing page content for the service "{service['name']}" targeted at businesses in {city}, {country}.
Do NOT just swap the city name; adapt to {city}'s real industries, business culture and buyer behaviour.
Return JSON with EXACTLY these keys:
{{
 "title": "SEO title <=60 chars, include 'best', '{kw}', '{city}' and 'Rajeev Freelancer' naturally",
 "meta_description": "150-158 chars, include primary keyword, {city}, 'freelancer' and a benefit + CTA",
 "h1": "H1 with service + {city} + 'freelancer' or 'consultant'",
 "intro": ["paragraph 1 (pain point)", "paragraph 2 (why a freelancer like Rajeev beats agencies)"],
 "why_choose": [{{"title":"...","text":"..."}} x5 reasons],
 "service_details": "one rich paragraph tailored to {city}",
 "process": [{{"step":"01","title":"...","text":"..."}} x5 steps],
 "whatsapp_section": "one paragraph on WhatsApp-based communication and automation for this market",
 "local_context": "one paragraph on {city}/{country} industries and how the service fits",
 "faqs": [{{"q":"...","a":"..."}} x10 location-specific FAQs matching real search queries]
}}
Keep it 800-1000 words total. Natural keyword use, no stuffing."""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        chat = LlmChat(
            api_key=os.environ["EMERGENT_LLM_KEY"],
            session_id=f"{service['slug']}-{loc['loc_slug']}",
            system_message=CONTENT_SYSTEM,
        ).with_model("gemini", "gemini-3-flash-preview")
        async with _llm_gate:
            resp = await chat.send_message(UserMessage(text=prompt))
        text = resp if isinstance(resp, str) else str(resp)
        text = re.sub(r"^```(json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
        m = re.search(r"\{.*\}", text, re.DOTALL)
        data = json.loads(m.group(0) if m else text)
        # basic validation
        for key in ("title", "meta_description", "h1", "intro", "why_choose", "process", "faqs"):
            if key not in data:
                raise ValueError(f"missing {key}")
        return data, True
    except Exception as e:
        logger.warning(f"AI generation failed for {service['slug']}/{loc['loc_slug']}: {e}; using fallback")
        return _fallback_content(service, loc), False


async def _generate_and_cache(service: dict, loc: dict, cache_key: str):
    """Background: generate real AI content and upgrade the cached page. Never raises."""
    if cache_key in _inflight_pages:
        return
    _inflight_pages.add(cache_key)
    try:
        content, ai_used = await generate_content(service, loc)
        if ai_used:
            await db.location_pages.update_one(
                {"key": cache_key},
                {"$set": {"content": content, "ai_generated": True,
                          "generated_at": datetime.now(timezone.utc).isoformat()}},
            )
    except Exception as e:
        logger.warning(f"background generate failed {cache_key}: {e}")
    finally:
        _inflight_pages.discard(cache_key)


def _page_doc(service: dict, loc: dict, cache_key: str, content: dict, ai_used: bool) -> dict:
    return {
        "key": cache_key,
        "service": {"slug": service["slug"], "name": service["name"], "short": service["short"], "keyword": service["keyword"]},
        "location": loc,
        "content": content,
        "ai_generated": ai_used,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "canonical": f"/{service['slug']}/{loc['loc_slug']}",
    }


@api_router.get("/page/{service_slug}/{loc_slug}")
async def get_location_page(service_slug: str, loc_slug: str):
    service = SERVICE_MAP.get(service_slug)
    loc = CITY_MAP.get(loc_slug)
    if not service or not loc:
        raise HTTPException(status_code=404, detail="Page not found")

    cache_key = f"{service_slug}::{loc_slug}"
    cached = await db.location_pages.find_one({"key": cache_key}, {"_id": 0})
    if cached:
        # Serve instantly; if it's only fallback content, upgrade it to AI in the background.
        if not cached.get("ai_generated"):
            asyncio.create_task(_generate_and_cache(service, loc, cache_key))
        return cached

    # First-ever visit: no one should wait ~15-20s for the LLM. Store & serve the
    # deterministic fallback immediately, then generate the AI version in the background
    # so the next visitor gets the upgraded page.
    fallback = _fallback_content(service, loc)
    doc = _page_doc(service, loc, cache_key, fallback, False)
    await db.location_pages.update_one({"key": cache_key}, {"$setOnInsert": doc}, upsert=True)
    asyncio.create_task(_generate_and_cache(service, loc, cache_key))
    asyncio.create_task(ping_indexnow([f"/{service_slug}/{loc_slug}"]))
    doc.pop("_id", None)
    return doc


# ---------------- Leads ----------------
@api_router.post("/leads")
async def create_lead(payload: LeadCreate, request: Request):
    if not ((payload.email or "").strip() or (payload.phone or "").strip()):
        raise HTTPException(status_code=422, detail="Provide an email or phone number so Rajeev can reach you")
    lead = Lead(**payload.model_dump())
    # Capture the inquirer's exact location (server-side, from IP) for the admin + email.
    try:
        xff = request.headers.get("x-forwarded-for", "")
        ip = xff.split(",")[0].strip() if xff else (request.client.host if request.client else "")

        def _lookup(client_ip: str):
            private = (not client_ip) or client_ip.startswith(("127.", "10.", "192.168.", "172.", "::1"))
            url = "https://ipapi.co/json/" if private else f"https://ipapi.co/{client_ip}/json/"
            try:
                r = requests.get(url, timeout=4, headers={"User-Agent": "rajeevfreelancer/1.0"})
                d = r.json()
                parts = [d.get("city"), d.get("region"), d.get("country_name")]
                return {"geo_location": ", ".join([p for p in parts if p]), "geo_country": d.get("country_name"),
                        "geo_city": d.get("city"), "geo_ip": client_ip,
                        "geo_lat": d.get("latitude"), "geo_lon": d.get("longitude")}
            except Exception:
                return {}

        geo = await asyncio.to_thread(_lookup, ip)
    except Exception:
        geo = {}
    doc = {**lead.model_dump(), **geo}
    await db.leads.insert_one(doc)
    logger.info(f"New lead: {lead.email} ({lead.service}) from {geo.get('geo_location') or lead.source_path}")
    asyncio.create_task(notify_new_lead(doc))
    asyncio.create_task(send_lead_confirmation(doc))
    return {"ok": True, "id": lead.id}


@api_router.get("/leads")
async def list_leads(admin: dict = Depends(get_current_admin), limit: int = 100, skip: int = 0):
    limit = max(1, min(limit, 200))
    skip = max(0, skip)
    leads = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.leads.count_documents({})
    return {"leads": leads, "total": total, "limit": limit, "skip": skip}


@api_router.patch("/leads/{lead_id}")
async def update_lead(lead_id: str, body: dict, admin: dict = Depends(get_current_admin)):
    status = body.get("status")
    if status not in ("new", "contacted", "won", "lost"):
        raise HTTPException(status_code=400, detail="Invalid status")
    await db.leads.update_one({"id": lead_id}, {"$set": {"status": status}})
    return {"ok": True}


@api_router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(get_current_admin)):
    total = await db.leads.count_documents({})
    new = await db.leads.count_documents({"status": "new"})
    won = await db.leads.count_documents({"status": "won"})
    pages = await db.location_pages.count_documents({})
    return {"total_leads": total, "new_leads": new, "won_leads": won, "generated_pages": pages,
            "total_services": len(SERVICES), "total_locations": len(CITY_MAP)}


@api_router.get("/admin/leads/geo")
async def leads_geo(admin: dict = Depends(get_current_admin)):
    leads = await db.leads.find(
        {"geo_lat": {"$ne": None}},
        {"_id": 0, "name": 1, "service": 1, "geo_city": 1, "geo_country": 1, "geo_lat": 1, "geo_lon": 1, "created_at": 1},
    ).sort("created_at", -1).to_list(1000)
    points = [l for l in leads if l.get("geo_lat") is not None and l.get("geo_lon") is not None]
    counts = {}
    async for l in db.leads.aggregate([
        {"$match": {"geo_country": {"$ne": None}}},
        {"$group": {"_id": "$geo_country", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]):
        counts[l["_id"]] = l["count"]
    return {"points": points, "countries": [{"country": k, "count": v} for k, v in counts.items()]}


# ---------------- Pre-generate (warm AI cache for top cities) ----------------
_warmup = {"running": False, "total": 0, "done": 0, "generated": 0, "skipped": 0,
           "failed": 0, "started_at": None, "finished_at": None}
_warmup_new_paths: list = []


async def _warm_one(service: dict, loc: dict, sem: asyncio.Semaphore):
    cache_key = f"{service['slug']}::{loc['loc_slug']}"
    try:
        existing = await db.location_pages.find_one({"key": cache_key}, {"ai_generated": 1})
        if existing and existing.get("ai_generated"):
            _warmup["skipped"] += 1
            return
        async with sem:
            content, ai_used = await generate_content(service, loc)
        doc = {
            "key": cache_key,
            "service": {"slug": service["slug"], "name": service["name"], "short": service["short"], "keyword": service["keyword"]},
            "location": loc,
            "content": content,
            "ai_generated": ai_used,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "canonical": f"/{service['slug']}/{loc['loc_slug']}",
        }
        await db.location_pages.update_one({"key": cache_key}, {"$set": doc}, upsert=True)
        _warmup["generated"] += 1
        _warmup_new_paths.append(f"/{service['slug']}/{loc['loc_slug']}")
    except Exception as e:
        logger.warning(f"warmup failed {cache_key}: {e}")
        _warmup["failed"] += 1
    finally:
        _warmup["done"] += 1


async def _run_warmup(loc_slugs: List[str], service_slugs: List[str], concurrency: int):
    _warmup_new_paths.clear()
    sem = asyncio.Semaphore(max(1, concurrency))
    tasks = []
    for s_slug in service_slugs:
        service = SERVICE_MAP.get(s_slug)
        if not service:
            continue
        for l_slug in loc_slugs:
            loc = CITY_MAP.get(l_slug)
            if loc:
                tasks.append(_warm_one(service, loc, sem))
    _warmup.update(running=True, total=len(tasks), done=0, generated=0, skipped=0,
                   failed=0, started_at=datetime.now(timezone.utc).isoformat(), finished_at=None)
    await asyncio.gather(*tasks)
    _warmup.update(running=False, finished_at=datetime.now(timezone.utc).isoformat())
    logger.info(f"warmup complete: {_warmup['generated']} generated, {_warmup['skipped']} skipped, {_warmup['failed']} failed")
    if _warmup_new_paths:
        asyncio.create_task(ping_indexnow(list(_warmup_new_paths)))


async def _auto_warm_top_cities():
    await asyncio.sleep(10)
    if _warmup["running"]:
        return
    keys = [f"{s['slug']}:{l}" for s in SERVICES for l in TOP_CITY_SLUGS if l in CITY_MAP]
    ai_count = await db.location_pages.count_documents({"key": {"$in": keys}, "ai_generated": True})
    if ai_count >= len(keys):
        logger.info("auto-warm: all top-city pages already AI-generated, skipping")
        return
    logger.info(f"auto-warm: starting top-city warm-up ({len(keys) - ai_count} pages pending)")
    await _run_warmup(TOP_CITY_SLUGS, [s["slug"] for s in SERVICES], 3)


class WarmupInput(BaseModel):
    cities: Optional[List[str]] = None
    services: Optional[List[str]] = None
    concurrency: Optional[int] = 3
    all: Optional[bool] = False


@api_router.post("/admin/pregenerate")
async def pregenerate(payload: WarmupInput, admin: dict = Depends(get_current_admin)):
    if _warmup["running"]:
        raise HTTPException(status_code=409, detail="A warm-up is already running")
    if payload.all:
        loc_slugs = list(CITY_MAP.keys())
    else:
        loc_slugs = payload.cities or TOP_CITY_SLUGS
    service_slugs = payload.services or [s["slug"] for s in SERVICES]
    loc_slugs = [s for s in loc_slugs if s in CITY_MAP]
    if not loc_slugs:
        raise HTTPException(status_code=400, detail="No valid cities to warm")
    total = len(loc_slugs) * len([s for s in service_slugs if s in SERVICE_MAP])
    asyncio.create_task(_run_warmup(loc_slugs, service_slugs, payload.concurrency or 3))
    return {"started": True, "total": total, "cities": len(loc_slugs), "services": len(service_slugs)}


@api_router.get("/admin/pregenerate/status")
async def pregenerate_status(admin: dict = Depends(get_current_admin)):
    return _warmup


# ---------------- Daily lead digest ----------------
from zoneinfo import ZoneInfo, available_timezones

DEFAULT_DIGEST = {"hour": int(os.environ.get("DIGEST_HOUR_UTC", "7")), "tz": "UTC", "enabled": True}


async def _get_digest_settings() -> dict:
    doc = await db.settings.find_one({"key": "digest"}, {"_id": 0})
    if not doc:
        doc = {"key": "digest", **DEFAULT_DIGEST}
        await db.settings.update_one({"key": "digest"}, {"$setOnInsert": doc}, upsert=True)
    return {"hour": int(doc.get("hour", 7)), "tz": doc.get("tz", "UTC"), "enabled": bool(doc.get("enabled", True))}


async def _collect_and_send_digest(hours: int = 24) -> int:
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    since_iso = since.isoformat()
    leads = await db.leads.find(
        {"created_at": {"$gte": since_iso}}, {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    label = f"Last {hours}h · since {since.strftime('%d %b %Y %H:%M UTC')}"
    return await send_lead_digest(leads, label)


@api_router.post("/admin/digest/send")
async def send_digest_now(admin: dict = Depends(get_current_admin), hours: int = 24):
    hours = max(1, min(hours, 720))
    count = await _collect_and_send_digest(hours)
    return {"sent": True, "leads_in_period": count, "hours": hours}


@api_router.get("/admin/digest/settings")
async def get_digest_settings(admin: dict = Depends(get_current_admin)):
    settings = await _get_digest_settings()
    # A short, friendly list of common zones for the picker (client may still send any valid IANA tz).
    common = ["UTC", "Asia/Kolkata", "Asia/Dubai", "Europe/London", "Europe/Berlin",
              "America/New_York", "America/Los_Angeles", "Australia/Sydney", "Asia/Singapore"]
    return {**settings, "common_timezones": common}


# ---------------- Site settings (SEO / contact / social / business) ----------------
DEFAULT_SITE = {
    "seo": {
        "site_name": "Rajeev Freelancer",
        "default_title": "App Developer, Website Development & SEO Marketing Consultant | Rajeev",
        "default_description": "Hire Rajeev — app developer, website development & SEO marketing consultant in Delhi NCR. 12+ years turning apps, SEO & AI automation into revenue. Free quote.",
        "og_image": "https://customer-assets-gfyr7b9c.emergentagent.net/job_rajeev-app/artifacts/0zkv66rh_image.png",
        "canonical_domain": "https://rajeevfreelancer.com",
        "twitter_handle": "@rajeevfreelancer",
        "robots_index": True,
        "default_locale": "en",
        "locales": ["en", "hi", "ar"],
    },
    "contact": {
        "name": "Rajeev Freelancer",
        "email": "hello@rajeevfreelancer.com",
        "phone": "+919711623561",
        "whatsapp": "919711623561",
        "whatsapp_display": "+91 97116 23561",
    },
    "social": {"linkedin": "", "twitter": "", "github": "", "instagram": "", "youtube": "", "facebook": ""},
    "business": {
        "logo": "https://customer-assets-gfyr7b9c.emergentagent.net/job_rajeev-app/artifacts/0zkv66rh_image.png",
        "rating": "4.9",
        "reviews_count": "96",
        "founding_year": "2013",
        "founder_name": "Rajeev Gits",
        "address": "Gurgaon, Haryana, India",
        "google_maps_url": "https://www.google.com/maps/place/Gurgaon,+Haryana",
        "map_embed_url": "https://www.google.com/maps?q=Gurgaon,Haryana,India&output=embed",
    },
    "tracking": {"ga4_id": "", "ads_id": "", "ads_conversion_label": "", "gtm_id": "", "meta_pixel_id": "", "head_code": "", "body_code": "", "thankyou_code": ""},
}


def _deep_merge(base: dict, override: dict) -> dict:
    out = {k: (v.copy() if isinstance(v, dict) else v) for k, v in base.items()}
    for k, v in (override or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = v
    return out


async def _get_site_settings() -> dict:
    doc = await db.settings.find_one({"key": "site"}, {"_id": 0, "key": 0})
    return _deep_merge(DEFAULT_SITE, doc or {})


@api_router.get("/settings")
async def public_site_settings():
    """Public: consumed by the frontend for SEO tags, structured data and contact info."""
    return await _get_site_settings()


@api_router.get("/admin/settings/site")
async def admin_get_site_settings(admin: dict = Depends(get_current_admin)):
    return await _get_site_settings()


@api_router.put("/admin/settings/site")
async def admin_update_site_settings(payload: dict, admin: dict = Depends(get_current_admin)):
    allowed = {"seo", "contact", "social", "business", "tracking"}
    update = {k: v for k, v in (payload or {}).items() if k in allowed and isinstance(v, dict)}
    if not update:
        raise HTTPException(status_code=400, detail="No valid settings provided")
    current = await db.settings.find_one({"key": "site"}, {"_id": 0, "key": 0}) or {}
    merged = _deep_merge(current, update)
    await db.settings.update_one({"key": "site"}, {"$set": {"key": "site", **merged}}, upsert=True)
    return await _get_site_settings()


# ---------------- IndexNow (auto-notify search engines of new/updated pages) ----------------
import secrets as _secrets
from urllib.parse import urlparse as _urlparse


async def _get_indexnow() -> dict:
    doc = await db.settings.find_one({"key": "indexnow"}, {"_id": 0, "key": 0})
    if not doc or not doc.get("token"):
        doc = {"token": _secrets.token_hex(16), "enabled": True}
        await db.settings.update_one({"key": "indexnow"}, {"$set": {"key": "indexnow", **doc}}, upsert=True)
    return {"token": doc["token"], "enabled": bool(doc.get("enabled", True))}


@api_router.get("/indexnow-key")
async def indexnow_key_file():
    """IndexNow key verification file (served on the same host as the site)."""
    s = await _get_indexnow()
    return Response(content=s["token"], media_type="text/plain")


async def ping_indexnow(paths: List[str]) -> int:
    s = await _get_indexnow()
    paths = [p for p in dict.fromkeys(paths) if p]  # de-dupe, drop empty
    if not s["enabled"] or not paths:
        return 0
    site = await _get_site_settings()
    domain = site["seo"].get("canonical_domain", "https://rajeevfreelancer.com").rstrip("/")
    host = _urlparse(domain).netloc
    payload = {
        "host": host,
        "key": s["token"],
        "keyLocation": f"{domain}/api/indexnow-key",
        "urlList": [f"{domain}{p}" for p in paths][:10000],
    }

    def _post():
        try:
            r = requests.post("https://api.indexnow.org/indexnow", json=payload, timeout=8)
            logger.info(f"IndexNow pinged {len(payload['urlList'])} url(s) -> {r.status_code}")
            return r.status_code
        except Exception as e:
            logger.warning(f"IndexNow ping failed: {e}")
            return 0

    return await asyncio.to_thread(_post)


class IndexNowInput(BaseModel):
    paths: Optional[List[str]] = None
    enabled: Optional[bool] = None


@api_router.get("/admin/indexnow")
async def get_indexnow(admin: dict = Depends(get_current_admin)):
    return await _get_indexnow()


@api_router.put("/admin/indexnow")
async def update_indexnow(payload: IndexNowInput, admin: dict = Depends(get_current_admin)):
    if payload.enabled is not None:
        await db.settings.update_one({"key": "indexnow"}, {"$set": {"enabled": payload.enabled}}, upsert=True)
    return await _get_indexnow()


@api_router.post("/admin/indexnow/submit")
async def submit_indexnow(payload: IndexNowInput, admin: dict = Depends(get_current_admin)):
    paths = payload.paths or []
    if not paths:
        raise HTTPException(status_code=400, detail="Provide at least one path")
    status = await ping_indexnow(paths)
    return {"submitted": len(paths), "status": status}


# ---------------- Blog / Insights ----------------
class BlogInput(BaseModel):
    title: str
    slug: Optional[str] = None
    category: str = "Article"
    excerpt: Optional[str] = ""
    cover_image: Optional[str] = ""
    tags: Optional[List[str]] = None
    body: Optional[List[str]] = None
    published: bool = True
    featured: bool = False
    order: int = 100


async def _seed_blog():
    existing = set(await db.blog_posts.distinct("slug"))
    now = datetime.now(timezone.utc).isoformat()
    new = [{**p, "published": True, "featured": p.get("category") == "Case Study",
            "order": i + 1, "created_at": now, "updated_at": now, "id": str(uuid.uuid4())}
           for i, p in enumerate(BLOG_SEED) if p["slug"] not in existing]
    if new:
        await db.blog_posts.insert_many(new)
        logger.info(f"Seeded {len(new)} new blog post(s)")


@api_router.get("/blog")
async def list_blog(category: Optional[str] = None, featured: Optional[bool] = None):
    q = {"published": True}
    if category:
        q["category"] = category
    if featured is not None:
        q["featured"] = featured
    posts = await db.blog_posts.find(q, {"_id": 0, "body": 0}).sort([("featured", -1), ("order", 1), ("created_at", -1)]).to_list(200)
    cats = await db.blog_posts.distinct("category", {"published": True})
    return {"posts": posts, "categories": cats}


@api_router.get("/blog/{slug}")
async def get_blog(slug: str):
    post = await db.blog_posts.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    related = await db.blog_posts.find({"published": True, "slug": {"$ne": slug}}, {"_id": 0, "body": 0}).sort("created_at", -1).to_list(3)
    return {"post": post, "related": related}


@api_router.get("/admin/blog")
async def admin_list_blog(admin: dict = Depends(get_current_admin)):
    posts = await db.blog_posts.find({}, {"_id": 0}).sort([("order", 1), ("created_at", -1)]).to_list(500)
    return {"posts": posts}


@api_router.post("/admin/blog")
async def admin_create_blog(payload: BlogInput, admin: dict = Depends(get_current_admin)):
    slug = (payload.slug or _slug(payload.title)).strip("-")
    if await db.blog_posts.find_one({"slug": slug}):
        raise HTTPException(status_code=409, detail="A post with this slug already exists")
    now = datetime.now(timezone.utc).isoformat()
    doc = {**payload.model_dump(), "slug": slug, "tags": payload.tags or [], "body": payload.body or [],
           "id": str(uuid.uuid4()), "created_at": now, "updated_at": now}
    await db.blog_posts.insert_one(doc)
    asyncio.create_task(ping_indexnow([f"/blog/{slug}"]))
    doc.pop("_id", None)
    return doc


class ReorderInput(BaseModel):
    ids: List[str]


@api_router.put("/admin/blog/reorder")
async def admin_reorder_blog(payload: ReorderInput, admin: dict = Depends(get_current_admin)):
    for i, pid in enumerate(payload.ids):
        await db.blog_posts.update_one({"id": pid}, {"$set": {"order": i + 1}})
    return {"ok": True, "count": len(payload.ids)}


@api_router.put("/admin/case-studies/reorder")
async def admin_reorder_case_studies(payload: ReorderInput, admin: dict = Depends(get_current_admin)):
    for i, cid in enumerate(payload.ids):
        await db.case_studies.update_one({"id": cid}, {"$set": {"order": i + 1}})
    return {"ok": True, "count": len(payload.ids)}


@api_router.put("/admin/blog/{post_id}")
async def admin_update_blog(post_id: str, payload: BlogInput, admin: dict = Depends(get_current_admin)):
    update = payload.model_dump(exclude_none=True)
    if payload.slug:
        update["slug"] = payload.slug.strip("-")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.blog_posts.update_one({"id": post_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return await db.blog_posts.find_one({"id": post_id}, {"_id": 0})


@api_router.delete("/admin/blog/{post_id}")
async def admin_delete_blog(post_id: str, admin: dict = Depends(get_current_admin)):
    res = await db.blog_posts.delete_one({"id": post_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"ok": True}


# ---------------- Case Studies ----------------
class CaseStudyInput(BaseModel):
    title: str
    slug: Optional[str] = None
    category: str = "Web"
    tag: str = ""
    metric: str = ""
    metricLabel: str = ""
    industry: str = ""
    region: str = ""
    duration: str = ""
    year: str = ""
    cover: Optional[str] = ""
    og: Optional[str] = ""
    excerpt: Optional[str] = ""
    challenge: Optional[str] = ""
    approach: Optional[List[dict]] = None
    results: Optional[List[dict]] = None
    services: Optional[List[str]] = None
    stack: Optional[List[str]] = None
    chart: Optional[dict] = None
    quote: Optional[dict] = None
    published: bool = True
    order: int = 100


async def _seed_case_studies():
    existing = set(await db.case_studies.distinct("slug"))
    now = datetime.now(timezone.utc).isoformat()
    new = [{**cs, "published": True, "created_at": now, "updated_at": now, "id": str(uuid.uuid4())}
           for cs in CASE_SEED if cs["slug"] not in existing]
    if new:
        await db.case_studies.insert_many(new)
        logger.info(f"Seeded {len(new)} new case study(ies)")


@api_router.get("/case-studies")
async def list_case_studies(category: Optional[str] = None):
    q = {"published": True}
    if category and category != "All":
        q["category"] = category
    items = await db.case_studies.find(q, {"_id": 0}).sort([("order", 1), ("created_at", 1)]).to_list(200)
    cats = await db.case_studies.distinct("category", {"published": True})
    return {"items": items, "categories": cats}


@api_router.get("/case-studies/{slug}")
async def get_case_study(slug: str):
    item = await db.case_studies.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Case study not found")
    return {"item": item}


@api_router.get("/admin/case-studies")
async def admin_list_case_studies(admin: dict = Depends(get_current_admin)):
    items = await db.case_studies.find({}, {"_id": 0}).sort([("order", 1), ("created_at", 1)]).to_list(500)
    return {"items": items}


@api_router.post("/admin/case-studies")
async def admin_create_case_study(payload: CaseStudyInput, admin: dict = Depends(get_current_admin)):
    slug = (payload.slug or _slug(payload.title)).strip("-")
    if await db.case_studies.find_one({"slug": slug}):
        raise HTTPException(status_code=409, detail="A case study with this slug already exists")
    now = datetime.now(timezone.utc).isoformat()
    doc = {**payload.model_dump(), "slug": slug, "approach": payload.approach or [], "results": payload.results or [],
           "services": payload.services or [], "stack": payload.stack or [], "chart": payload.chart or None,
           "quote": payload.quote or None, "id": str(uuid.uuid4()), "created_at": now, "updated_at": now}
    await db.case_studies.insert_one(doc)
    asyncio.create_task(ping_indexnow([f"/case-studies/{slug}"]))
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/case-studies/{cs_id}")
async def admin_update_case_study(cs_id: str, payload: CaseStudyInput, admin: dict = Depends(get_current_admin)):
    update = payload.model_dump(exclude_none=True)
    if payload.slug:
        update["slug"] = payload.slug.strip("-")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.case_studies.update_one({"id": cs_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Case study not found")
    return await db.case_studies.find_one({"id": cs_id}, {"_id": 0})


@api_router.delete("/admin/case-studies/{cs_id}")
async def admin_delete_case_study(cs_id: str, admin: dict = Depends(get_current_admin)):
    res = await db.case_studies.delete_one({"id": cs_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case study not found")
    return {"ok": True}


# ---------------- Admin image uploads (object storage) ----------------
@api_router.post("/admin/upload")
async def admin_upload(file: UploadFile = File(...), admin: dict = Depends(get_current_admin)):
    ct = (file.content_type or "").lower()
    if not ct.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    data = await file.read()
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 8MB")
    ext = _MIME_EXT.get(ct, "bin")
    fid = str(uuid.uuid4())
    path = f"{STORAGE_APP}/uploads/{fid}.{ext}"
    try:
        result = await asyncio.to_thread(put_object, path, data, ct)
    except Exception as e:
        logger.error(f"upload failed: {e}")
        raise HTTPException(status_code=502, detail="Upload failed, please try again")
    await db.uploads.insert_one({
        "id": fid, "storage_path": result.get("path", path), "content_type": ct,
        "original_filename": file.filename, "size": len(data), "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"id": fid, "url": f"/api/uploads/{fid}"}


@api_router.get("/uploads/{file_id}")
async def serve_upload(file_id: str):
    rec = await db.uploads.find_one({"id": file_id, "is_deleted": False})
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, ct = await asyncio.to_thread(get_object, rec["storage_path"])
    except Exception:
        raise HTTPException(status_code=404, detail="File not available")
    return Response(content=data, media_type=rec.get("content_type", ct),
                    headers={"Cache-Control": "public, max-age=31536000, immutable"})


class DigestSettings(BaseModel):
    hour: int
    tz: str
    enabled: bool = True


@api_router.put("/admin/digest/settings")
async def update_digest_settings(payload: DigestSettings, admin: dict = Depends(get_current_admin)):
    if not (0 <= payload.hour <= 23):
        raise HTTPException(status_code=400, detail="hour must be between 0 and 23")
    if payload.tz not in available_timezones():
        raise HTTPException(status_code=400, detail=f"Unknown timezone: {payload.tz}")
    await db.settings.update_one(
        {"key": "digest"},
        {"$set": {"key": "digest", "hour": payload.hour, "tz": payload.tz, "enabled": payload.enabled}},
        upsert=True,
    )
    return {"ok": True, "hour": payload.hour, "tz": payload.tz, "enabled": payload.enabled}


async def _daily_digest_scheduler():
    """Send the owner a lead digest once per day at the configured hour + timezone."""
    while True:
        s = await _get_digest_settings()
        if not s["enabled"]:
            await asyncio.sleep(3600)  # re-check hourly while disabled
            continue
        try:
            tz = ZoneInfo(s["tz"])
        except Exception:
            tz = ZoneInfo("UTC")
        now = datetime.now(tz)
        nxt = now.replace(hour=s["hour"], minute=0, second=0, microsecond=0)
        if nxt <= now:
            nxt += timedelta(days=1)
        sleep_s = (nxt - now).total_seconds()
        # Wake at most hourly so settings changes take effect without a restart.
        await asyncio.sleep(min(sleep_s, 3600))
        if sleep_s > 3600:
            continue
        try:
            count = await _collect_and_send_digest(24)
            logger.info(f"Daily digest sent ({count} leads) at {s['hour']}:00 {s['tz']}")
        except Exception as e:
            logger.error(f"Daily digest failed: {e}")
        await asyncio.sleep(90)  # avoid double-send within the same minute



# ---------------- Auth ----------------
@api_router.post("/auth/login")
async def login(payload: LoginInput):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(email)
    return {"token": token, "user": {"email": email, "name": user.get("name", "Admin")}}


@api_router.get("/auth/me")
async def me(admin: dict = Depends(get_current_admin)):
    return admin


# ---------------- Sitemap ----------------
@api_router.get("/sitemap.xml")
async def sitemap():
    site = await _get_site_settings()
    base = site["seo"].get("canonical_domain", "https://rajeevfreelancer.com").rstrip("/")
    urls = [f"{base}/", f"{base}/about", f"{base}/services", f"{base}/pricing", f"{base}/case-studies", f"{base}/locations", f"{base}/contact", f"{base}/blog"]
    urls += [f"{base}/hi", f"{base}/ar", f"{base}/es", f"{base}/fr"]
    for cs in await db.case_studies.find({"published": True}, {"_id": 0, "slug": 1}).to_list(500):
        urls.append(f"{base}/case-studies/{cs['slug']}")
    for p in await db.blog_posts.find({"published": True}, {"_id": 0, "slug": 1}).to_list(500):
        urls.append(f"{base}/blog/{p['slug']}")
    for s in SERVICES:
        urls.append(f"{base}/{s['slug']}")
        for loc_slug in CITY_MAP:
            urls.append(f"{base}/{s['slug']}/{loc_slug}")
    for c in COUNTRIES:
        urls.append(f"{base}/locations/{c}")
    body = "".join(f"<url><loc>{u}</loc></url>" for u in urls)
    xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{body}</urlset>'
    return Response(content=xml, media_type="application/xml")


import time

_rates_cache = {"data": None, "ts": 0}


@api_router.get("/rates")
async def rates():
    now = time.time()
    if _rates_cache["data"] and now - _rates_cache["ts"] < 12 * 3600:
        return _rates_cache["data"]

    def fetch():
        try:
            r = requests.get("https://open.er-api.com/v6/latest/USD", timeout=5)
            d = r.json()
            return {"base": "USD", "rates": d.get("rates", {}), "updated": d.get("time_last_update_utc")}
        except Exception as e:
            logger.warning(f"rates fetch failed: {e}")
            return None

    data = await asyncio.to_thread(fetch)
    if data:
        _rates_cache.update(data=data, ts=now)
    return data or {"base": "USD", "rates": {}, "updated": None}


@api_router.get("/geo")
async def geo(request: Request):
    xff = request.headers.get("x-forwarded-for", "")
    ip = xff.split(",")[0].strip() if xff else (request.client.host if request.client else "")

    def fetch(client_ip: str):
        private = (not client_ip) or client_ip.startswith(("127.", "10.", "192.168.", "172.", "::1"))
        url = "https://ipapi.co/json/" if private else f"https://ipapi.co/{client_ip}/json/"
        try:
            r = requests.get(url, timeout=4, headers={"User-Agent": "rajeevfreelancer/1.0"})
            d = r.json()
            return {
                "country_code": d.get("country_code"),
                "country_name": d.get("country_name"),
                "currency": d.get("currency"),
                "city": d.get("city"),
            }
        except Exception as e:
            logger.warning(f"geo lookup failed: {e}")
            return {"country_code": None, "country_name": None, "currency": None, "city": None}

    return await asyncio.to_thread(fetch, ip)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.leads.create_index("created_at")
    await db.location_pages.create_index("key", unique=True)
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Rajeev",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Updated admin password")
    asyncio.create_task(_daily_digest_scheduler())
    if os.environ.get("AUTO_WARM_ON_STARTUP", "true").lower() == "true":
        asyncio.create_task(_auto_warm_top_cities())
    await _seed_blog()
    await _seed_case_studies()
    try:
        await asyncio.to_thread(init_storage)
        logger.info("Object storage initialized")
    except Exception as e:
        logger.warning(f"Storage init failed (uploads disabled until fixed): {e}")


@app.on_event("shutdown")
async def shutdown():
    client.close()
