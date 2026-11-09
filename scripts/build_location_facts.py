#!/usr/bin/env python3
"""Build backend/location_facts.json: verifiable geography for every catalog place.

Why: the 40,000 service/location pages were byte-identical apart from the place
name, and each one linked only to the homepage. Google therefore treated them
as duplicates ("Discovered/Crawled – currently not indexed", "Soft 404",
"Duplicate without user-selected canonical"). This file gives every page real,
distinct facts (region, population, time zone, currency, languages, distance
from Gurugram) plus a neighbourhood of nearby catalog places for internal
links. No page URL, title, description or stored body changes.

Sources (already in the repository, CC BY 4.0):
  backend/world-expansion-catalog.json  – 4,530 additional places (GeoNames rows)
  backend/data.py (CITY_MAP)            – 471 base places; 249 legacy ones lack geodata
  data/geonames-snapshot/cities15000.txt, countryInfo.txt, admin1CodesASCII.txt

Run from the repository root:  python scripts/build_location_facts.py
Deterministic: the same inputs always produce the same output file.
"""
from __future__ import annotations

import json
import math
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
SNAPSHOT = ROOT / "data" / "geonames-snapshot"
OUTPUT = BACKEND / "location_facts.json"
sys.path.insert(0, str(BACKEND))

from data import CITY_MAP, COUNTRIES  # noqa: E402

GURUGRAM = (28.4595, 77.0266)
LEGACY_DELHI_LOCALITIES = {"saket-india", "nehru-place-india", "janakpuri-india", "pitampura-india", "lajpat-nagar-india",
                           "okhla-india", "vasant-kunj-india", "rajouri-garden-india", "mayur-vihar-india", "netaji-subhash-place-india"}
NEARBY_COUNT = 8

# ISO 639-1 codes that appear in GeoNames countryInfo "Languages" for the catalog.
LANGUAGE_NAMES = {
    "aa": "Afar", "ab": "Abkhazian", "af": "Afrikaans", "ak": "Akan", "am": "Amharic", "ar": "Arabic", "as": "Assamese",
    "ay": "Aymara", "az": "Azerbaijani", "be": "Belarusian", "bg": "Bulgarian", "bh": "Bihari", "bi": "Bislama", "bm": "Bambara",
    "bn": "Bengali", "bo": "Tibetan", "bs": "Bosnian", "ca": "Catalan", "ch": "Chamorro", "cs": "Czech", "cy": "Welsh", "da": "Danish",
    "de": "German", "dv": "Dhivehi", "dz": "Dzongkha", "el": "Greek", "en": "English", "es": "Spanish", "et": "Estonian", "eu": "Basque",
    "fa": "Persian", "ff": "Fula", "fi": "Finnish", "fj": "Fijian", "fo": "Faroese", "fr": "French", "ga": "Irish", "gd": "Scottish Gaelic",
    "gl": "Galician", "gn": "Guarani", "gu": "Gujarati", "gv": "Manx", "ha": "Hausa", "he": "Hebrew", "hi": "Hindi", "hr": "Croatian",
    "ht": "Haitian Creole", "hu": "Hungarian", "hy": "Armenian", "id": "Indonesian", "ig": "Igbo", "is": "Icelandic", "it": "Italian",
    "ja": "Japanese", "jv": "Javanese", "ka": "Georgian", "kg": "Kongo", "kk": "Kazakh", "kl": "Greenlandic", "km": "Khmer", "kn": "Kannada",
    "ko": "Korean", "ks": "Kashmiri", "ku": "Kurdish", "ky": "Kyrgyz", "la": "Latin", "lb": "Luxembourgish", "lg": "Ganda", "ln": "Lingala",
    "lo": "Lao", "lt": "Lithuanian", "lu": "Luba-Katanga", "lv": "Latvian", "mg": "Malagasy", "mh": "Marshallese", "mi": "Maori",
    "mk": "Macedonian", "ml": "Malayalam", "mn": "Mongolian", "mr": "Marathi", "ms": "Malay", "mt": "Maltese", "my": "Burmese",
    "na": "Nauruan", "nb": "Norwegian Bokmål", "nd": "Ndebele", "ne": "Nepali", "nl": "Dutch", "nn": "Norwegian Nynorsk", "no": "Norwegian",
    "nr": "Southern Ndebele", "ny": "Chichewa", "or": "Odia", "pa": "Punjabi", "pl": "Polish", "ps": "Pashto", "pt": "Portuguese",
    "qu": "Quechua", "rm": "Romansh", "rn": "Kirundi", "ro": "Romanian", "ru": "Russian", "rw": "Kinyarwanda", "sa": "Sanskrit",
    "sd": "Sindhi", "sg": "Sango", "si": "Sinhala", "sk": "Slovak", "sl": "Slovenian", "sm": "Samoan", "sn": "Shona", "so": "Somali",
    "sq": "Albanian", "sr": "Serbian", "ss": "Swati", "st": "Southern Sotho", "su": "Sundanese", "sv": "Swedish", "sw": "Swahili",
    "ta": "Tamil", "te": "Telugu", "tg": "Tajik", "th": "Thai", "ti": "Tigrinya", "tk": "Turkmen", "tl": "Tagalog", "tn": "Tswana",
    "to": "Tongan", "tr": "Turkish", "ts": "Tsonga", "tt": "Tatar", "ty": "Tahitian", "ug": "Uyghur", "uk": "Ukrainian", "ur": "Urdu",
    "uz": "Uzbek", "ve": "Venda", "vi": "Vietnamese", "wo": "Wolof", "xh": "Xhosa", "yo": "Yoruba", "zh": "Chinese", "zu": "Zulu",
    "fil": "Filipino", "haw": "Hawaiian", "nso": "Northern Sotho", "pap": "Papiamento", "tet": "Tetum", "tpi": "Tok Pisin", "crs": "Seychellois Creole",
}


def fold(value: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", str(value)).casefold() if not unicodedata.combining(c)).strip()


def haversine_matrix(lat, lon):
    import numpy as np
    phi = np.radians(lat)[:, None]
    lam = np.radians(lon)[:, None]
    dphi = phi - phi.T
    dlam = lam - lam.T
    a = np.sin(dphi / 2) ** 2 + np.cos(phi) * np.cos(phi.T) * np.sin(dlam / 2) ** 2
    return 6371.0 * 2 * np.arcsin(np.sqrt(np.clip(a, 0, 1)))


def distance_km(a, b):
    (lat1, lon1), (lat2, lon2) = a, b
    p1, p2 = math.radians(lat1), math.radians(lat2)
    d = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    return 6371.0 * 2 * math.asin(math.sqrt(d))


def load_country_info():
    rows = {}
    for line in (SNAPSHOT / "countryInfo.txt").read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#"):
            continue
        cols = line.split("\t")
        if len(cols) < 16:
            continue
        rows[cols[0]] = {"name": cols[4], "capital": cols[5], "currency_code": cols[10], "currency_name": cols[11],
                         "languages": [code.split("-")[0] for code in cols[15].split(",") if code]}
    return rows


def load_admin1():
    rows = {}
    for line in (SNAPSHOT / "admin1CodesASCII.txt").read_text(encoding="utf-8").splitlines():
        cols = line.split("\t")
        if len(cols) >= 2:
            rows[cols[0]] = cols[1]
    return rows


def load_cities():
    """GeoNames cities15000: name/alternate-name lookups per country code."""
    by_country = {}
    for line in (SNAPSHOT / "cities15000.txt").read_text(encoding="utf-8").splitlines():
        cols = line.split("\t")
        if len(cols) < 18:
            continue
        row = {"geoname_id": int(cols[0]), "name": cols[1], "ascii": cols[2], "alternates": cols[3].split(",") if cols[3] else [],
               "lat": float(cols[4]), "lon": float(cols[5]), "feature_code": cols[7], "country_code": cols[8], "admin1_code": cols[10],
               "population": int(cols[14] or 0), "timezone": cols[17]}
        by_country.setdefault(row["country_code"], []).append(row)
    return by_country


def match_city(name: str, country_code: str, cities_by_country: dict):
    """Most populous GeoNames place whose name or alternate name equals the catalog name."""
    wanted = fold(name)
    best = None
    for row in cities_by_country.get(country_code, []):
        names = {fold(row["name"]), fold(row["ascii"])} | {fold(alt) for alt in row["alternates"]}
        if wanted in names and (best is None or row["population"] > best["population"]):
            best = row
    return best


def main() -> int:
    country_info = load_country_info()
    admin1 = load_admin1()
    cities = load_cities()
    expansion = json.loads((BACKEND / "world-expansion-catalog.json").read_text(encoding="utf-8"))

    places = {}
    unmatched = []
    # 1. Base catalog (471). Legacy rows carry only city/country; enrich from GeoNames.
    for slug, loc in CITY_MAP.items():
        country = COUNTRIES.get(loc["country_slug"], {})
        code = loc.get("country_code") or country.get("country_code") or ""
        entry = {"slug": slug, "city": loc["city"], "country": loc["country"], "country_slug": loc["country_slug"],
                 "country_code": code, "region": loc.get("region"), "base": True, "locality_of": loc.get("parent_city")}
        geo = None
        if loc.get("latitude") is not None and loc.get("longitude") is not None:
            geo = {"lat": float(loc["latitude"]), "lon": float(loc["longitude"]), "population": int(loc.get("population") or 0),
                   "timezone": loc.get("timezone"), "admin1_code": "", "feature_code": loc.get("feature_code", ""), "geoname_id": loc.get("geoname_id")}
            if loc.get("admin1_name"):
                entry["admin1"] = loc["admin1_name"]
        else:
            lookup_name = loc.get("parent_city") or loc["city"]
            geo = match_city(lookup_name, code, cities)
            if not geo and slug in LEGACY_DELHI_LOCALITIES:
                # The original catalog lists these Delhi neighbourhoods without a
                # parent city; they share Delhi's time zone and coordinates.
                geo = match_city("Delhi", "IN", cities)
                entry["locality_of"] = "Delhi"
            if geo and loc.get("parent_city"):
                entry["locality_of"] = loc["parent_city"]
        if not geo:
            unmatched.append(slug)
        else:
            entry.update({"lat": round(geo["lat"], 4), "lon": round(geo["lon"], 4), "population": geo["population"] or None,
                          "timezone": geo.get("timezone") or loc.get("timezone"), "geoname_id": geo.get("geoname_id"),
                          "is_capital": geo.get("feature_code") == "PPLC"})
            if geo.get("admin1_code") and not entry.get("admin1"):
                entry["admin1"] = admin1.get(f"{code}.{geo['admin1_code']}")
            if entry.get("locality_of"):
                entry["population"] = None  # a locality is not the parent city's population
        info = country_info.get(code, {})
        entry["currency_code"] = loc.get("currency_code") or info.get("currency_code") or ""
        entry["currency_name"] = info.get("currency_name") or ""
        codes = [c.split("-")[0] for c in (loc.get("languages") or info.get("languages") or [])]
        entry["languages"] = [LANGUAGE_NAMES[c] for c in dict.fromkeys(codes) if c in LANGUAGE_NAMES][:4]
        places[slug] = entry

    # 2. Expansion catalog (4,530), already GeoNames-backed.
    for loc in expansion["locations"]:
        slug = loc["loc_slug"]
        if slug in places:
            raise SystemExit(f"Expansion slug collides with base catalog: {slug}")
        code = loc.get("country_code", "")
        info = country_info.get(code, {})
        codes = [c.split("-")[0] for c in (loc.get("languages") or info.get("languages") or [])]
        places[slug] = {"slug": slug, "city": loc["city"], "country": loc["country"], "country_slug": loc["country_slug"],
                        "country_code": code, "region": loc.get("region"), "base": False, "locality_of": loc.get("parent_city"),
                        "lat": round(float(loc["latitude"]), 4), "lon": round(float(loc["longitude"]), 4),
                        "population": int(loc.get("population") or 0) or None, "timezone": loc.get("timezone"),
                        "geoname_id": loc.get("geoname_id"), "is_capital": loc.get("feature_code") == "PPLC",
                        "admin1": loc.get("admin1_name") or admin1.get(f"{code}.{loc.get('admin1_code', '')}"),
                        "currency_code": loc.get("currency_code") or info.get("currency_code") or "",
                        "currency_name": info.get("currency_name") or "",
                        "languages": [LANGUAGE_NAMES[c] for c in dict.fromkeys(codes) if c in LANGUAGE_NAMES][:4]}

    # 3. Distance from Gurugram and nearest catalog neighbours (same country first).
    located = [p for p in places.values() if p.get("lat") is not None]
    import numpy as np
    lat = np.array([p["lat"] for p in located]); lon = np.array([p["lon"] for p in located])
    matrix = haversine_matrix(lat, lon)
    index = {p["slug"]: i for i, p in enumerate(located)}
    for p in located:
        i = index[p["slug"]]
        p["km_from_gurugram"] = int(round(distance_km((p["lat"], p["lon"]), GURUGRAM)))
        order = np.argsort(matrix[i])
        same, other = [], []
        for j in order:
            if j == i:
                continue
            q = located[j]
            if q["locality_of"] and p["locality_of"] is None and q["country_slug"] == p["country_slug"] and q["locality_of"] == p["city"]:
                continue  # a city does not list its own localities as "nearby places"
            (same if q["country_slug"] == p["country_slug"] else other).append((q["slug"], int(round(float(matrix[i, j])))))
            if len(same) >= NEARBY_COUNT:
                break
        nearby = same[:NEARBY_COUNT]
        if len(nearby) < 4:
            nearby += other[: NEARBY_COUNT - len(nearby)]
        p["nearby"] = [{"slug": s, "km": km} for s, km in nearby]
    for slug in unmatched:
        places[slug]["nearby"] = []

    clean = {}
    for slug, p in sorted(places.items()):
        row = {k: v for k, v in p.items() if k != "slug" and v not in (None, "", [])}
        clean[slug] = row
    payload = {"version": 1, "content_layer_date": "2026-11-09",
               "source": "GeoNames (https://www.geonames.org/), CC BY 4.0, repository snapshot; catalog slugs unchanged.",
               "unmatched_base_places": unmatched, "count": len(clean), "places": clean}
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":"), sort_keys=True) + "\n", encoding="utf-8")
    print(f"location_facts.json: {len(clean)} places, {len(unmatched)} without geodata: {unmatched[:12]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
