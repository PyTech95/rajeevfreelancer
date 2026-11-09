# Release 2026-11-09 — favicon, indexing of the 40k location pages, Google profile on the site

Branch: `seo-indexing-favicon-fix-20261109` (on top of `main` @ e99869fb).
Tests: `backend/tests` 269 passed; `npm run build` + `npm run check:seo` PASS (280 static pages, 0 errors).

**Nothing about existing URLs changes.** No slug, title, meta description, canonical rule or stored page body is
touched. The release only *adds* (assets, a content layer, internal links, redirects for dead URLs, a sitemap index)
and fixes host duplication. Rankings for already-indexed pages are preserved by design; see "Acceptance" below.

---

## 1. What was wrong (found on the live site + Search Console, 9 Nov 2026)

| # | Problem | Evidence | Effect |
|---|---------|----------|--------|
| 1 | **Favicon never shows in Google results.** The site icon pointed at an off-domain image (`customer-assets-…emergentagent.net/…png`, 250×250) and there was no `/favicon.ico`. | `view-source:` of any page, `curl -I /favicon.ico` → 404 | Google requires the icon on the same domain, in multiples of 48 px. Result: generic globe icon on mobile search. |
| 2 | **~2,000 of ~40,000 location pages indexed.** All 40,008 service×place pages share one template whose text only swaps the city name, each had **one** internal link pointing at it, and they were listed only in a flat sitemap. Country hubs did not link to the 4,530 expansion places at all. | GSC "Discovered – currently not indexed" / "Crawled – currently not indexed"; `/locations/<country>` pages | Google treats near-identical, barely-linked pages as low value and stops crawling them. |
| 3 | **www duplicates.** `https://www.rajeevfreelancer.com/...` served full copies of every page (200). | GSC "Duplicate without user-selected canonical" rows with `www.` | Split signals, wasted crawl budget. |
| 4 | **Old WordPress URLs** (`/freelance-app-development`, `/freelance-seo-services`, `/freelance-web-design-services`, `/digital-marketing-services`, `/freelance-services/…-in-<city>`) return 404 / soft 404 although they still have links and GSC history. | GSC "Not found (404)" | Lost link equity, crawl waste. |
| 5 | Placeholder business data in settings (rating 4.9 / 96 reviews, generic Gurgaon map) was correctly hidden by the previous build's verification flags, so the site showed **no** Google reviews or map even though the real profile has 5.0★ from 13 reviews. | `/api/settings` | Missed trust signals on Home/Contact. |

---

## 2. What changed

### 2.1 Favicon / brand images (fixes #1)
- `frontend/public/` — new `favicon.ico` (48 px), `favicon-48x48.png`, `favicon-96x96.png`, `favicon-144x144.png`,
  `favicon-192x192.png`, `apple-touch-icon.png` (180), `android-chrome-512x512.png`; all generated from the new photo.
- `frontend/public/index.html` — `<link rel="icon">` set now points at those files (same domain, 48-px multiples);
  the emergentagent `preconnect` was removed.
- `frontend/public/manifest.json` — icons → the local 192/512 PNGs.
- `frontend/public/assets/brand/` — `rajeev-portrait.png` replaced with the new photo (512 px), `rajeev-portrait.webp`,
  new `og-image.png` (1200×630).
- `backend/server.py` — `_brand_image()` maps any stored emergentagent image URL (og_image, logo) to the local assets,
  so the old URL cannot come back from the settings document. `siteConfig.js`, `LangLanding.jsx`,
  `live-site-settings.json` updated the same way.

### 2.2 Unique content layer + internal links for every location page (fixes #2)
- **New** `backend/location_facts.py` + `backend/location_facts.json` (3.2 MB, prebuilt, 5,001 places): per place,
  from the GeoNames snapshot already in the repo — region/admin area, population, capital flag, coordinates,
  distance from Gurugram, currency, languages, IANA time zone, and the 8 nearest served places.
  `local_facts()` computes the IST overlap window and sibling-service links; `local_facts_html()` renders it.
- `backend/public_seo.py` — every server-rendered location page now gets a **"Working with <city>"** facts section
  (data table, time-zone paragraph, currency, "Other services for <city>", "Nearby places also served", country and
  service-area links → **~26 internal links per page**, all through `canonical_service_path`), a 4-level breadcrumb
  (Home / service / country / city) with `BreadcrumbList`, and `geo` + `containedInPlace` on the Service schema.
- `backend/server.py` — `get_location_page` wraps the unchanged document with `_with_local_facts()`; the API payload
  gains `local_facts`. Stored titles/descriptions/bodies are **not** modified (the read-only test still passes).
- `frontend/src/components/LocalFacts.jsx` renders the same block in React (`LocationPage.jsx`,
  `ExpansionLocationPage.jsx`).
- `frontend/src/pages/CountryPage.jsx` — each country hub now lists **"More places in <country>"** (the expansion
  places) under every service, so the crawl path home → /locations → country → page exists for all 40k pages.
  `/api/locations` and `/api/service/{slug}` return `more_places` per country; the prerender bootstraps them from the
  new `frontend/src/seo/expansion-places.json` (written by `frontend/scripts/export-catalog.py` during `npm run build`).
- `scripts/build_location_facts.py` — rebuilds `location_facts.json` (only needed when the catalog changes;
  `python3 scripts/build_location_facts.py`, ~10 s, needs `numpy`).

### 2.3 Sitemap index with named groups (fixes #2)
- `backend/sitemap_shards.py` — `render_grouped_sitemap_files()`; `backend/public_seo.py` — when the inventory has
  more than 5,000 URLs, `/sitemap.xml` becomes a **sitemap index** of `/sitemaps/core.xml`,
  `/sitemaps/places-base-<service>.xml` (×8) and `/sitemaps/places-more-<service>.xml` (×8), each with `<lastmod>`.
  Smaller inventories keep the old flat sitemap, so tests and the static build are unchanged.
  In Search Console you can now see indexing **per group**.
- The inventory query projects only routing/date fields (the 40k page bodies are no longer loaded to build a sitemap).

### 2.4 One host only (fixes #3)
- `backend/server.py` — `_canonical_host_middleware`: any request for `www.rajeevfreelancer.com` → **301** to
  `https://rajeevfreelancer.com<path>?<query>` (GET/HEAD).
- `deploy/nginx-routes.conf.example` — http→https and www→non-www server blocks, favicon/manifest and `/assets/`
  cache locations. The app-level redirect works even if nginx is not changed; the nginx block is the fast path.

### 2.5 Dead WordPress URLs → 301 (fixes #4)
- `backend/public_seo.py` — `legacy_wordpress_target()`: **only after every real route has failed**, a one- or
  two-segment path with a service keyword 301s to the live hub (or city page for `…-in-<city>` when the city is in
  the catalog). `/about-us`, `/mumbai`, `/wp-content/…`, `/blog/…`, unknown place slugs still 404. Tests in
  `backend/tests/test_release_20261109.py`.

### 2.6 Google Business Profile on the site (fixes #5)
- **New** `backend/google_profile.py` — the listing's own *Embed a map* URL, the public reviews copied **verbatim**
  from the listing (Maps CID `10332082874224753124`, checked 9 Nov 2026: 5.0★, 13 reviews), and
  `google_profile_business()` which swaps the old placeholders (4.9 / 96 / generic Gurgaon map, verified=false) in a
  stored settings document for the checked values. Admin-entered values are kept (a different rating with the
  verified box ticked, a custom map, or a deliberately hidden rating).
- `backend/server.py` `DEFAULT_SITE.business` — `rating 5.0`, `reviews_count 13`, `reviews_verified true`,
  `reviews_checked_on`, `google_maps_url` (CID link), `google_review_url` (`g.page/r/CeQ5EOSh7mKPEBI/review`),
  `map_embed_url`, `show_map`, `google_reviews[]`. `customer_facing_office_verified` stays **false** (service-area
  business, no walk-in office, so no "Get directions").
- **New** `frontend/src/components/GoogleReviews.jsx` — "What clients say on Google" (Home, between the location strip
  and the FAQ) and a compact card on Contact. Text reviews only; rating-only reviews are counted, not shown.
  **No Review/AggregateRating JSON-LD** on purpose — Google forbids self-serving review markup; the visible block is
  fine, the schema is not.
- `Footer.jsx` — map of the Business Profile listing (lazy-loaded iframe) with "Open in Google Maps" and "Write a
  review"; the "Find us on Google" link shows "5.0/5 on Google". `GoogleBusinessCTA.jsx` (city hubs) gained the
  map + "Write a review". Admin → Site settings has the new fields.
- Server-rendered pages: footer line "Rated 5.0/5 on Google · 13 reviews" linking to the listing.

### 2.7 Tooling
- `scripts/check_release.py` resolves the new expansion-place links via `frontend/src/seo/expansion-places.json`.
- `backend/tests/test_existing_page_readonly.py` knows the two new wrapper function names.

---

## 3. Deploy (developer)

Same procedure as `deploy/DEPLOY.md` — keep MongoDB, `.env`, uploads, admin account. No database migration.

```bash
# 0. backup code + nginx config + mongodump as usual

# 1. code
git fetch && git checkout seo-indexing-favicon-fix-20261109      # or unzip the source zip over the project
#    make sure these NEW files arrived:
#    backend/location_facts.py backend/location_facts.json backend/google_profile.py
#    frontend/src/components/LocalFacts.jsx frontend/src/components/GoogleReviews.jsx
#    frontend/public/favicon*.png frontend/public/favicon.ico frontend/public/apple-touch-icon.png
#    frontend/public/android-chrome-512x512.png frontend/public/assets/brand/og-image.png

# 2. backend (no new Python packages; zoneinfo needs system tzdata, present on Ubuntu)
cd backend && source ../venv/bin/activate && pip install -r requirements.txt   # unchanged
python -m pytest -q tests/            # 269 passed expected

# 3. frontend (Node 20+, python3)
cd ../frontend && npm ci --legacy-peer-deps && npm run build && npm run check:seo
#    or unpack frontend-build-20261109.zip into frontend/build

# 4. nginx — merge deploy/nginx-routes.conf.example into the live config:
#    - add the port-80 and www:443 redirect servers (reuse the existing cert lines)
#    - add the favicon/manifest and /assets/ cache locations inside the main 443 server
#    - keep "location / { proxy_pass http://127.0.0.1:<API PORT>; }" (NO SPA fallback)
sudo nginx -t && sudo systemctl reload nginx

# 5. restart the backend service (systemd unit name as on the server)
sudo systemctl restart <rajeev-backend.service>
```

## 4. Acceptance (run on the server or from anywhere)

```bash
D=https://rajeevfreelancer.com
for p in /favicon.ico /favicon-48x48.png /favicon-96x96.png /favicon-192x192.png /apple-touch-icon.png /android-chrome-512x512.png /manifest.json /assets/brand/og-image.png /assets/brand/rajeev-portrait.png; do
  printf '%-40s ' $p; curl -s -o /dev/null -w '%{http_code} %{content_type}\n' $D$p; done
curl -s $D/ | grep -o '<link rel="icon"[^>]*>' | head -3           # local hrefs, sizes 48x48…
curl -sI https://www.rajeevfreelancer.com/about | grep -i '^HTTP\|^location'   # 301 → https://rajeevfreelancer.com/about
curl -sI http://rajeevfreelancer.com/about | grep -i '^HTTP\|^location'        # 301 → https
curl -s $D/sitemap.xml | head -5                                   # <sitemapindex> with /sitemaps/core.xml, places-base-*, places-more-*
curl -s $D/sitemaps/places-base-freelancer-seo-expert.xml | grep -c '<url>'
curl -s $D/freelancer-seo-expert/pune-india | grep -c 'rf-local-facts'       # 1 → facts block present
curl -s $D/freelancer-seo-expert/pune-india | grep -o '<title>[^<]*' # title UNCHANGED vs. before
curl -s $D/locations/germany | grep -c 'More places in'            # ≥1
curl -sI $D/freelance-app-development | grep -i '^HTTP\|^location' # 301 → /freelancer-app-developer
curl -sI $D/this-does-not-exist | grep '^HTTP'                     # still 404
curl -s $D/api/settings | python3 -c 'import sys,json;b=json.load(sys.stdin)["business"];print(b["rating"],b["reviews_count"],b["reviews_verified"],len(b["google_reviews"]))'   # 5.0 13 True 7
curl -s $D/ | grep -c 'What clients say'                           # 1
```

Spot-check in a browser: home page (reviews block + footer map), `/contact` (compact reviews card),
`/freelancer-seo-expert/pune-india` (facts section, breadcrumb), `/locations/india` ("More places" lists).

## 5. Search Console (Rajeev or I can do this in Chrome)

1. Sitemaps → remove the old flat entries, add `https://rajeevfreelancer.com/sitemap.xml` (the index). Google will list
   the 17 children; indexing per group becomes visible there.
2. URL Inspection → "Request indexing" for `/`, `/locations`, the 8 service hubs and 3–4 country hubs.
3. After 2–3 weeks compare "Discovered/Crawled – currently not indexed" with today's numbers; expect the `places-base-*`
   groups to move first (base catalog, highest population), `places-more-*` gradually.
4. Favicon: once the new build is live, inspect `/` and request indexing; the icon usually updates within a few days
   to two weeks.

## 6. Honest expectations

A site with a few hundred clicks a month gets a small crawl budget, so Google will **not** index 40,000 pages
quickly whatever we do. What this release changes is that every page is now (a) reachable in ≤3 clicks, (b) linked from
~26 other pages, (c) textually distinct, (d) grouped in sitemaps with real dates. That is what turns "Discovered –
currently not indexed" into crawled and indexed pages over weeks and months. Pages that are already indexed keep their
URL, title, description and body, so there is nothing to lose.

## 7. Rollback

`git checkout main` + previous `frontend/build` + previous nginx config; restart the service. The database was not
changed, so nothing to restore there.
