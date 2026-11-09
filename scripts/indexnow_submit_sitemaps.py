#!/usr/bin/env python3
"""Submit every URL in the live sitemap index to IndexNow (Bing, Yandex, Seznam, Naver, …).

Run this ON THE SERVER (or any machine with open internet) after a release that
adds or changes many pages:

    python3 scripts/indexnow_submit_sitemaps.py            # submit everything
    python3 scripts/indexnow_submit_sitemaps.py --dry-run  # just count
    python3 scripts/indexnow_submit_sitemaps.py --only places-base   # one sitemap group

The IndexNow key is read from the INDEXNOW_KEY environment variable, else from
backend/.env, else fetched from https://rajeevfreelancer.com/api/indexnow-key
(the key file the app already serves). Google does not use IndexNow; for Google
the sitemap index in Search Console is the channel. Standard library only.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.request
from pathlib import Path
from xml.etree import ElementTree as ET

ORIGIN = "https://rajeevfreelancer.com"
HOST = "rajeevfreelancer.com"
ENDPOINT = "https://api.indexnow.org/indexnow"
KEY_LOCATION = ORIGIN + "/api/indexnow-key"
BATCH = 10_000  # IndexNow maximum per POST
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
UA = "rajeevfreelancer-indexnow/1.0 (+https://rajeevfreelancer.com)"


def fetch(url: str, timeout: int = 60) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/xml,text/plain,*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def load_key() -> str:
    key = os.environ.get("INDEXNOW_KEY", "").strip()
    if not key:
        env_file = Path(__file__).resolve().parents[1] / "backend" / ".env"
        if env_file.is_file():
            match = re.search(r"^INDEXNOW_KEY=([A-Za-z0-9-]+)", env_file.read_text(), re.M)
            key = match.group(1) if match else ""
    if not key:
        key = fetch(KEY_LOCATION).decode().strip()
    if not re.fullmatch(r"[A-Za-z0-9-]{8,128}", key):
        sys.exit("No valid IndexNow key found (env INDEXNOW_KEY, backend/.env or /api/indexnow-key).")
    return key


def sitemap_urls(index_url: str, only: str | None) -> dict[str, list[str]]:
    root = ET.fromstring(fetch(index_url))
    groups: dict[str, list[str]] = {}
    children = [loc.text.strip() for loc in root.findall("sm:sitemap/sm:loc", NS) if loc.text]
    if not children:  # flat urlset
        children = [index_url]
    for child in children:
        name = child.rsplit("/", 1)[-1].removesuffix(".xml")
        if only and only not in name:
            continue
        urlset = ET.fromstring(fetch(child))
        urls = [loc.text.strip() for loc in urlset.findall("sm:url/sm:loc", NS) if loc.text]
        groups[name] = [u for u in urls if u.startswith(ORIGIN + "/")]
        print(f"  {name}: {len(groups[name])} URLs", file=sys.stderr)
    return groups


def submit(urls: list[str], key: str) -> tuple[int, str]:
    body = json.dumps({"host": HOST, "key": key, "keyLocation": KEY_LOCATION, "urlList": urls}).encode()
    req = urllib.request.Request(ENDPOINT, data=body, method="POST",
                                 headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return resp.status, resp.read().decode(errors="replace")[:200]
    except urllib.error.HTTPError as exc:  # 400 bad request, 403 key invalid, 422 URLs don't belong, 429 too many
        return exc.code, exc.read().decode(errors="replace")[:200]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--dry-run", action="store_true", help="count URLs, submit nothing")
    parser.add_argument("--only", help="substring of a sitemap group name, e.g. core, places-base, places-more-freelancer-seo-expert")
    parser.add_argument("--sitemap", default=ORIGIN + "/sitemap.xml")
    args = parser.parse_args()

    print("Reading sitemaps…", file=sys.stderr)
    groups = sitemap_urls(args.sitemap, args.only)
    all_urls: list[str] = []
    seen: set[str] = set()
    for urls in groups.values():
        for u in urls:
            if u not in seen:
                seen.add(u)
                all_urls.append(u)
    print(f"{len(all_urls)} unique URLs in {len(groups)} sitemap(s).", file=sys.stderr)
    if args.dry_run:
        return 0

    key = load_key()
    ok = 0
    for start in range(0, len(all_urls), BATCH):
        chunk = all_urls[start:start + BATCH]
        status, text = submit(chunk, key)
        label = "accepted" if status in (200, 202) else "FAILED"
        print(f"batch {start // BATCH + 1}: {len(chunk)} URLs → HTTP {status} {label} {text}".rstrip(), file=sys.stderr)
        if status in (200, 202):
            ok += len(chunk)
        elif status == 429:
            time.sleep(30)
        time.sleep(2)
    print(f"Done: {ok}/{len(all_urls)} URLs accepted by IndexNow.", file=sys.stderr)
    return 0 if ok == len(all_urls) else 1


if __name__ == "__main__":
    sys.exit(main())
