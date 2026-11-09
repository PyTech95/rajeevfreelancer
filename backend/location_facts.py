"""Verifiable place facts and onward links for every service/location page.

Problem this solves (Search Console, Oct–Nov 2026): the 40,000 service/location
pages were identical apart from the place name and each linked only to the
homepage, so Google left them in "Discovered/Crawled – currently not indexed",
"Soft 404" and "Duplicate without user-selected canonical".

This module adds, to the SAME URLs with the SAME stored title/description/body:
  * real, distinct facts for the place (state/region, population, time zone,
    currency, languages, distance from Gurugram) from the bundled GeoNames data;
  * the working-hours overlap between the client's time zone and IST;
  * links to the other services for the same place and to nearby catalog places,
    so crawlers can reach every page through links, not only the sitemap.

Nothing here writes to the database or changes a canonical path.
"""
from __future__ import annotations

import html
import json
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from live_service_catalog import LIVE_SERVICES, PREFERRED_SERVICE_SLUGS, canonical_service_path, source_service_slug

FACTS_PATH = Path(__file__).with_name("location_facts.json")
IST_NAME = "Asia/Kolkata"
IST = ZoneInfo(IST_NAME)
# Client's local business hours and Rajeev's review window (IST), in whole hours.
LOCAL_HOURS = (9, 18)
IST_HOURS = (9, 21)
MAX_NEARBY = 8


@lru_cache(maxsize=1)
def _payload() -> dict:
    try:
        data = json.loads(FACTS_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"places": {}, "content_layer_date": ""}
    return data if isinstance(data, dict) and isinstance(data.get("places"), dict) else {"places": {}, "content_layer_date": ""}


def content_layer_date() -> str:
    """ISO date of the last change to this generated content layer (for sitemap lastmod)."""
    return str(_payload().get("content_layer_date") or "")


def place(loc_slug: str) -> dict | None:
    row = _payload()["places"].get(str(loc_slug))
    return dict(row, slug=loc_slug) if isinstance(row, dict) else None


def _hhmm(hours: float) -> str:
    total = int(round(hours * 60))
    return f"{total // 60:02d}:{total % 60:02d}"


def _offset_label(offset_minutes: int) -> str:
    sign = "+" if offset_minutes >= 0 else "−"
    offset_minutes = abs(offset_minutes)
    return f"UTC{sign}{offset_minutes // 60:02d}:{offset_minutes % 60:02d}"


def time_overlap(tz_name: str | None, now: datetime | None = None) -> dict | None:
    """Current offset difference between a place and IST, plus the shared working window."""
    if not tz_name:
        return None
    try:
        local = ZoneInfo(tz_name)
    except (ZoneInfoNotFoundError, ValueError, TypeError):
        return None
    now = now or datetime.now(timezone.utc)
    local_offset = int(now.astimezone(local).utcoffset().total_seconds() // 60)
    ist_offset = int(now.astimezone(IST).utcoffset().total_seconds() // 60)
    diff = ist_offset - local_offset  # minutes the place is behind IST (negative = ahead)
    hours, minutes = divmod(abs(diff), 60)
    amount = (f"{hours} h" if hours else "") + (f" {minutes} min" if minutes else "")
    if diff == 0:
        difference = "the same time as India"
    else:
        difference = f"{amount.strip()} {'behind' if diff > 0 else 'ahead of'} India (IST)"
    shift = diff / 60  # add to a local hour to get the IST hour
    start = max(LOCAL_HOURS[0] + shift, IST_HOURS[0])
    end = min(LOCAL_HOURS[1] + shift, IST_HOURS[1])
    overlap = None
    if end - start >= 1:
        overlap = {"local": f"{_hhmm(start - shift)}–{_hhmm(end - shift)}", "ist": f"{_hhmm(start)}–{_hhmm(end)}",
                   "hours": round(end - start, 1)}
    return {"timezone": tz_name, "local_offset": _offset_label(local_offset), "ist_offset": _offset_label(ist_offset),
            "difference_minutes": diff, "difference": difference, "overlap": overlap,
            "local_hours": f"{LOCAL_HOURS[0]:02d}:00–{LOCAL_HOURS[1]:02d}:00", "ist_hours": f"{IST_HOURS[0]:02d}:00–{IST_HOURS[1]:02d}:00"}


def format_population(value) -> str | None:
    try:
        n = int(value)
    except (TypeError, ValueError):
        return None
    if n <= 0:
        return None
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f} million".replace(".0 million", " million")
    return f"{n:,}"


def _live_slug(service_slug: str) -> str:
    return PREFERRED_SERVICE_SLUGS.get(service_slug, service_slug)


def local_facts(service_slug: str, loc_slug: str, *, path: str | None = None, now: datetime | None = None) -> dict | None:
    """Structured facts for one page; the same object feeds the HTML and the React view."""
    row = place(loc_slug)
    if not row:
        return None
    service_slug = str(service_slug)
    live_slug = _live_slug(service_slug)
    services = {s["slug"]: s for s in LIVE_SERVICES}
    current = services.get(live_slug) or services.get(service_slug) or {"slug": live_slug, "name": live_slug.replace("-", " ").title()}
    siblings = []
    for slug, service in services.items():
        if slug == live_slug:
            continue
        siblings.append({"name": service.get("name") or slug, "slug": slug,
                         "path": canonical_service_path(f"/{slug}/{loc_slug}")})
    nearby = []
    for item in row.get("nearby", [])[:MAX_NEARBY]:
        neighbour = place(item.get("slug", ""))
        if not neighbour:
            continue
        nearby.append({"city": neighbour["city"], "country": neighbour["country"], "slug": neighbour["slug"],
                       "km": int(item.get("km") or 0), "path": canonical_service_path(f"/{live_slug}/{neighbour['slug']}")})
    currency = None
    if row.get("currency_code"):
        currency = row["currency_code"] + (f" ({row['currency_name']})" if row.get("currency_name") else "")
    facts = {
        "version": 1,
        "place": {
            "city": row["city"], "country": row["country"], "country_slug": row.get("country_slug"), "country_code": row.get("country_code"),
            "region": row.get("region"), "admin1": row.get("admin1"), "locality_of": row.get("locality_of"),
            "population": row.get("population"), "population_text": format_population(row.get("population")),
            "is_capital": bool(row.get("is_capital")), "latitude": row.get("lat"), "longitude": row.get("lon"),
            "km_from_gurugram": row.get("km_from_gurugram"), "currency": currency, "currency_code": row.get("currency_code"),
            "languages": row.get("languages") or [], "timezone": row.get("timezone"),
        },
        "time": time_overlap(row.get("timezone"), now),
        "service": {"slug": live_slug, "name": current.get("name") or live_slug},
        "sibling_services": siblings,
        "nearby": nearby,
        "country_path": f"/locations/{row['country_slug']}" if row.get("country_slug") else None,
        "service_areas_path": "/service-areas",
        "source": "GeoNames, CC BY 4.0",
    }
    return facts


def _esc(value) -> str:
    return html.escape(str(value if value is not None else ""), quote=True)


def local_facts_html(facts: dict | None) -> str:
    """Server-rendered section. Plain semantic HTML; the React app renders the same data."""
    if not facts:
        return ""
    p, t, service = facts["place"], facts.get("time"), facts["service"]
    city, country = p["city"], p["country"]
    where = f"{city}, {p['locality_of']}" if p.get("locality_of") else city
    rows = []
    if p.get("locality_of"):
        rows.append(("Area", f"{city} is a locality of {p['locality_of']}, {country}"))
    if p.get("admin1") and p["admin1"] != city:
        rows.append(("Region", f"{p['admin1']}, {country}"))
    else:
        rows.append(("Country", country))
    if p.get("population_text"):
        rows.append(("Population", f"about {p['population_text']} (GeoNames)"))
    if p.get("timezone"):
        rows.append(("Time zone", f"{p['timezone']}" + (f" ({t['local_offset']})" if t else "")))
    if p.get("currency"):
        rows.append(("Local currency", p["currency"]))
    if p.get("languages"):
        rows.append(("Languages commonly used", ", ".join(p["languages"])))
    if p.get("km_from_gurugram") is not None:
        rows.append(("Distance from Gurugram, India", f"about {p['km_from_gurugram']:,} km"))
    out = ['<section class="rf-local-facts" aria-labelledby="rf-local-facts-h"><h2 id="rf-local-facts-h">' +
           _esc(f"{service['name']} for {where}: local facts") + "</h2>"]
    out.append("<dl>" + "".join(f"<div><dt>{_esc(k)}</dt><dd>{_esc(v)}</dd></div>" for k, v in rows) + "</dl>")
    if t:
        line = f"{city} is {t['difference']}."
        if t.get("overlap"):
            line += (f" If your team works {t['local_hours']} local time, the shared window with Rajeev's review hours "
                     f"({t['ist_hours']} IST) is {t['overlap']['local']} in {city}, which is {t['overlap']['ist']} in India.")
        else:
            line += (f" There is no overlap between {t['local_hours']} local time and {t['ist_hours']} IST, so reviews are "
                     f"scheduled at agreed early-morning or evening slots and progress is shared asynchronously on WhatsApp and email.")
        out.append(f"<h3>Working hours across time zones</h3><p>{_esc(line)}</p>")
    if p.get("currency_code"):
        out.append("<p>" + _esc(f"Proposals are quoted in USD, EUR, GBP or INR; {p['currency_code']} can be used as the reference currency for a {where} budget.") + "</p>")
    if facts["sibling_services"]:
        out.append(f"<h3>Other services for {_esc(where)}</h3><ul class=\"rf-links\">" + "".join(
            f'<li><a href="{_esc(s["path"])}">{_esc(s["name"])} in {_esc(city)}</a></li>' for s in facts["sibling_services"]) + "</ul>")
    if facts["nearby"]:
        label = f"Nearby areas also served for {service['name'].lower()}" if p.get("locality_of") else f"Nearby places also served for {service['name'].lower()}"
        out.append(f"<h3>{_esc(label)}</h3><ul class=\"rf-links\">" + "".join(
            f'<li><a href="{_esc(n["path"])}">{_esc(n["city"])}' + ("" if n["country"] == country else f", {_esc(n['country'])}") +
            (f" <small>({n['km']} km)</small>" if n["km"] else "") + "</a></li>" for n in facts["nearby"]) + "</ul>")
    links = []
    if facts.get("country_path"):
        links.append(f'<a href="{_esc(facts["country_path"])}">All places in {_esc(country)}</a>')
    links.append('<a href="/service-areas">Worldwide service areas</a>')
    out.append('<p class="rf-local-more">' + " · ".join(links) + "</p>")
    out.append("<p><small>Geographic data: GeoNames, CC BY 4.0. Services are delivered remotely from Gurugram, India; this page does not describe a local office.</small></p></section>")
    return "".join(out)


def place_schema(facts: dict | None, origin: str) -> list:
    """Schema.org Place node with coordinates, so the areaServed is unambiguous."""
    if not facts or facts["place"].get("latitude") is None:
        return []
    p = facts["place"]
    node = {"@type": "Place", "name": f"{p['city']}, {p['country']}", "address": {"@type": "PostalAddress", "addressLocality": p["city"], "addressCountry": p.get("country_code") or p["country"]},
            "geo": {"@type": "GeoCoordinates", "latitude": p["latitude"], "longitude": p["longitude"]}}
    if p.get("admin1"):
        node["address"]["addressRegion"] = p["admin1"]
    return [node]
