# Rajeev Freelancer — PRD

## Original Problem
Deploy the "Rajeev-main" full-stack app (React + FastAPI + MongoDB). Verify-first plan:
Phase 0 (verify locally), Phase 1 (env/secrets), Phase 2 (deploy), Phase 3 (smoke test).
User uploaded the code as a zip and asked to "deploy here" (full stack, default Mongo).

## Architecture
- Frontend: React 19 + CRACO + Tailwind + shadcn/ui + framer-motion + Lenis. All API calls
  via `process.env.REACT_APP_BACKEND_URL` (src/lib/api.js). No hardcoded localhost.
- Backend: FastAPI (uvicorn 0.0.0.0:8001), all routes under `/api`. Motor (async Mongo).
- DB: local MongoDB (MONGO_URL/DB_NAME from env).
- Integrations: Gemini (gemini-3-flash-preview) via emergentintegrations + EMERGENT_LLM_KEY
  for AI location-page content (has deterministic fallback). Optional email notifications
  via Emergent email integration (EMERGENT_EMAIL_KEY, currently blank -> fails gracefully).
  External no-key APIs: exchange rates (open.er-api.com), geo (ipapi.co).

## Core Features
- Programmatic SEO: 7 services × 135 cities (40 countries) location pages, AI-generated + cached in Mongo.
- Public catalog: /api/services, /api/locations, /api/service/{slug}, /api/page/{svc}/{loc}, /api/sitemap.xml, /api/rates, /api/geo.
- Lead capture: POST /api/leads (fires owner email notification, non-blocking).
- Admin (JWT): login, GET /api/leads (paginated), PATCH status, GET /api/admin/stats.

## Env Vars (backend/.env)
MONGO_URL, DB_NAME, CORS_ORIGINS, JWT_SECRET, EMERGENT_LLM_KEY, ADMIN_EMAIL, ADMIN_PASSWORD,
REACT_APP_BACKEND_URL, EMERGENT_EMAIL_KEY (blank), EMAIL_FROM_NAME, OWNER_EMAIL.
Frontend: REACT_APP_BACKEND_URL (protected).

## Status (2026-08-18)
- [x] Phase 0: code unzipped into /app, deps installed, backend boots clean, frontend compiles.
- [x] Phase 1: all env vars wired; JWT_SECRET generated; admin seeded; Mongo connected.
- [x] Phase 3 preview smoke test: catalog, lead write+read, JWT login, admin stats, AI page gen all pass; homepage renders.
- [x] Deployment readiness: passed. Fixed /api/leads pagination blocker (bounded limit/skip).
- [x] Lead email alerts: Resend integrated (email_utils.py, non-blocking via asyncio.to_thread).
      Sends owner notification on every new lead. Keeps existing anti-phishing email scanner.
      RESEND_API_KEY set. Sender: onboarding@resend.dev (test mode). OWNER_EMAIL currently
      rajeev.gits@gmail.com (Resend account owner) because test mode only delivers to the
      account owner until a domain is verified. Verified live send (no error).
- [x] Top-cities warm-up: POST /api/admin/pregenerate + GET /api/admin/pregenerate/status
      (admin-only). Curated TOP_CITY_SLUGS (18 cities) in data.py. Background asyncio task with
      semaphore concurrency (default 3), progress tracked in-process. Admin dashboard has a
      "Warm top cities" button + live progress bar. Tested: 4 pages generated in ~19s.
- [ ] Phase 2: user to click platform Deploy button (frontend + backend + Mongo).

## Iteration 2 (2026-08-18) — 4 follow-up features
- [x] Lead confirmation email: prospect gets an instant branded confirmation on enquiry
      (email_utils.send_lead_confirmation, fired from create_lead). Skips if no email given.
- [x] Daily lead digest: owner digest of last 24h leads. POST /api/admin/digest/send (manual,
      tested sent=true) + background scheduler (_daily_digest_scheduler) at DIGEST_HOUR_UTC (7).
      "Send digest" button added to admin dashboard.
- [x] Warm ALL cities: pregenerate now accepts {"all": true} -> all 135 cities × 7 services
      (945 pages). "Warm all cities" button added.
- [x] LLM concurrency fix (IMPORTANT): provider allows only 1 concurrent request on this plan
      (429 CONCURRENCY_REQUEST_LIMIT). Added a global asyncio.Semaphore(1) gate around the LLM
      call so parallel warm-ups no longer fall back to templated content. generate_content now
      returns (content, ai_used); pages store `ai_generated` flag. Warm-up skips only AI pages
      and upgrades fallbacks. Verified: pages generate with ai_generated=true, 0 failures.
- [~] Verify sending domain: USER ACTION. Verify rajeevfreelancer.com at resend.com/domains,
      then set SENDER_EMAIL=leads@rajeevfreelancer.com & OWNER_EMAIL=hello@rajeevfreelancer.com.
      Until then, Resend test mode only delivers to the account owner (rajeev.gits@gmail.com),
      so owner alerts + digest work, but prospect confirmation emails won't deliver yet.

## Caveats
- Warm-all of 945 pages is SERIAL (~15-20s/page => a few hours) due to the 1-concurrent LLM
  limit. It runs in the background, is resumable (skips already-AI pages), and never blocks the app.

## Iteration 3 (2026-08-18) — 4 more follow-ups
- [x] LLM concurrency now env-configurable: LLM_CONCURRENCY (default 1) drives the _llm_gate
      semaphore. After a plan upgrade that unlocks parallel requests, bump this to run warm-ups
      in parallel (minutes instead of hours). No code change needed — just the env value.
- [x] Auto-warm on first visit: GET /api/page/{svc}/{loc} now returns the deterministic fallback
      INSTANTLY on first visit (verified ~0.17s) and generates the real AI version in the
      background (_generate_and_cache, guarded by _inflight_pages), so the next visitor gets the
      AI page. Cached fallback pages are also upgraded to AI in the background on any visit.
      Verified: page flipped ai_generated False->True ~16s after first hit.
- [x] Configurable digest timing: digest hour + IANA timezone + enabled stored in db.settings
      (key="digest"). GET/PUT /api/admin/digest/settings (tz validated against zoneinfo).
      Scheduler reads settings each cycle (wakes hourly so changes apply without restart).
      Admin dashboard has an hour dropdown + timezone dropdown + enabled toggle + Save.
      Currently set to 09:00 Asia/Kolkata.
- [~] Domain verification (USER DNS ACTION) + plan upgrade (USER ACCOUNT ACTION): see summary.

## Key env vars added over iterations
RESEND_API_KEY, SENDER_EMAIL, OWNER_EMAIL, EMAIL_FROM_NAME, DIGEST_HOUR_UTC (seed default),
LLM_CONCURRENCY.

## Iteration 10 (2026-08-18) — Ad variants, service images, tracking, testimonials, App Dev
- Ad landing variants: service pages accept ?headline=, ?sub=, ?cta= query params to match ad
  copy (verified live). Drop campaign-specific URLs into Google Ads.
- Per-service hero images: SERVICE_IMAGES map in serviceContent.js; shown in the service hero
  with a "Free quote" badge.
- Conversion tracking: settings.tracking {ga4_id, ads_id, ads_conversion_label} (in admin Site
  Settings). siteConfig.initTracking() injects gtag.js when IDs set; trackConversion() fires
  GA4 generate_lead + Google Ads conversion on ContactForm success. No-ops until IDs are added.
- Testimonials: TESTIMONIALS (sample, replaceable) rendered per service (3 each) + Product/
  Review/AggregateRating JSON-LD.
- NEW SERVICE: "Freelance App Developer" (App Development) added to backend data.py + frontend
  SERVICES + serviceContent (content, image, FAQs). Now 8 services; location pages + dropdown
  + sitemap all include it automatically.
- Verified: 8 services live, app-dev landing page + image + ad-variant override render, tracking
  settings persist, compile clean.
- TODO(user): paste GA4 + Google Ads IDs in admin to activate tracking; replace sample testimonials.


- Contact form: removed the currency selector (INR/USD/etc.) — now a single free-text "Budget
  (optional)" box. Value stored as typed. Removed useCurrency/CURRENCIES usage from the form.
- Service pages (/:serviceSlug) rebuilt as full AdWords-ready landing pages: punchy hero + value
  prop + dual CTAs + trust row, "why this works" benefits, "what's included" deliverables +
  outcome pills, 4-step process, stats, per-service FAQ (with FAQPage JSON-LD), dark contact CTA,
  and the SEO cities list. Unique per-service content in frontend/src/data/serviceContent.js
  (7 services). Kept Service + FAQ + Breadcrumb structured data.
- Nav: "Services" is now a hover dropdown listing all 7 services (short + tagline) + "All services".
- Verified: compile clean, SEO service page renders as a landing page, dropdown trigger present.


- Blog: added 10 more unique, SEO-friendly posts (industry: real estate, clinics/healthcare,
  e-commerce CRO, restaurants; service deep-dives: WhatsApp automation, Shopify SEO, Next.js vs
  React, Google Ads; local: Dubai; + a local-service case study). Now 22 posts total. _seed_blog
  is idempotent (adds missing seeds by slug, never wipes admin edits).
- Languages: real translated landing pages for Hindi, Arabic, Spanish, French at /hi /ar /es /fr
  (frontend/src/data/i18n.js + pages/LangLanding.jsx). Each has translated hero/services/about/
  contact, correct canonical + hreflang alternates (en + 4 langs + x-default), og:locale, and
  Arabic renders full RTL (dir=rtl). Language switcher (globe) added to the main Nav; lang pages
  have their own localized header/switcher. Routes registered top-level to avoid /:serviceSlug
  clash. Sitemap includes the 4 language URLs.
- Verified: 22 posts live, sitemap lang URLs, Arabic RTL page renders correctly, compile clean.
- NOTE: language pages are standalone translated marketing pages (not a full site-wide i18n of
  every page/blog body yet) — deeper translation is progressive. Prerender still deferred.


- Lead geo now also stores geo_lat/geo_lon on create_lead. New admin endpoint
  GET /api/admin/leads/geo returns map points + per-country counts.
- Admin LeadMap.jsx: Leaflet (loaded from CDN, no API key) with OSM tiles, a marker per
  located lead (name/service/city popup) + a top-countries list. Collapsible card.
- Featured posts: blog_posts gained `featured` bool (BlogInput + admin edit checkbox + list
  badge). Existing 2 case studies marked featured. Public /api/blog sorts featured-first and
  supports ?featured=true. Blog index shows a ★ Featured badge.
- Homepage: new "Latest insights" strip (data-testid=home-insights) showing the top 3
  (featured-first) posts, linking to /blog. (Also satisfies the earlier 'latest update on home'.)
- Verified: featured-first ordering, geo points w/ lat-lon (e.g. 41.26,-95.86 Council Bluffs),
  leads/geo endpoint, blog CRUD+featured, nav (Blog present / Locations removed), compile clean.
- STILL PENDING user input: (1) blog topics for more articles; (2) which languages + prerender.


- Homepage: removed the "locations teaser" section (looked cheap). Header nav: removed "Locations",
  added "Blog". Footer: locations kept as "Working areas" (clickable) + all-locations link.
  Locations remain for SEO (routes /locations, /locations/:country, /:svc/:loc still live).
- Blog/Insights: new section. Backend blog_posts collection seeded with 12 UNIQUE hand-written
  articles (Article/Blog/Case Study) from blog_seed.py. Public GET /api/blog (+category filter),
  GET /api/blog/{slug} (+related). Admin CRUD: GET/POST/PUT/DELETE /api/admin/blog. Frontend
  /blog index (filters + cards) and /blog/:slug post (Article JSON-LD + SEO + related). Blog URLs
  added to sitemap; new posts auto-ping IndexNow. Admin BlogManager.jsx (list + create/edit/delete).
- Contact form: budget is now a free-text amount + currency selector (₹/$/£/etc., defaults to the
  visitor's detected currency) instead of a dropdown of tiers; stored as e.g. "₹ 50,000". Services
  dropdown gained "AI Automation" and "Others".
- Lead geo capture: create_lead now records the inquirer's exact location server-side from IP
  (geo_location/geo_city/geo_country/geo_ip), shown in the admin table data + owner email.
  Inquiries stored in Mongo + owner email + prospect auto-reply (existing).
- All verified: 12 posts seeded, blog CRUD round-trip, lead budget+geo stored, contact form + nav
  render (screenshots), frontend compiles clean.
- STILL PENDING user input (deferred): multi-language languages + prerender approach.


- robots.txt at frontend/public/robots.txt (allows all, disallows /admin, links sitemap on prod domain).
- IndexNow: settings key="indexnow" (auto-generated token, enabled flag). GET /api/indexnow-key
  serves the verification key. ping_indexnow() auto-fires when a new city page is first created
  (get_location_page insert) and in a batch after each warm-up run. Admin GET/PUT /api/admin/indexnow
  and POST /api/admin/indexnow/submit. Note: pings only validate from the real production domain
  (preview returns 422 — expected).
- Admin "SEO tools" card (SeoTools.jsx): IndexNow enable/disable + manual URL submit, and a
  Social share preview (LinkedIn / X / WhatsApp cards) that resolves title/description/image for
  any path (fetches AI page meta for city pages).
- PENDING user input: (1) which languages for real multi-language pages; (2) prerender approach.
- Backend site settings: db.settings key="site" with DEFAULT_SITE (seo/contact/social/business).
  Public GET /api/settings; admin GET/PUT /api/admin/settings/site (deep-merge). Sitemap now
  uses seo.canonical_domain (https://rajeevfreelancer.com). Business includes address +
  google_maps_url + map_embed_url; social includes linkedin/github/twitter/instagram/youtube/facebook.
- Frontend SEO: /lib/siteConfig.js (build-time defaults + live override via SettingsContext +
  JSON-LD builders). Seo.jsx now emits canonical (real domain), og:image/title/desc/site_name/locale,
  twitter card+image+site, robots, and hreflang (locales en/hi/ar + x-default).
- Structured data: Organization (ProfessionalService) + WebSite injected globally in App.js;
  Service + Breadcrumb on service pages; Service + LocalBusiness + FAQPage + Breadcrumb on
  location pages (all using the real domain + settings-driven rating/reviews/social).
- Footer: live social icons (LinkedIn/GitHub/etc.) + Google Map embed + map link (from settings).
- Admin: collapsible "Site settings" card (SiteSettings.jsx) editing all 4 groups; persists and
  reflects on the public site. Digest + warm-up controls unchanged.
- Notes (advisory, non-blocking): CSR app — crawlers that don't execute JS see SITE_DEFAULTS
  meta only (Google renders JS, so fine); JSON-LD renders in <body> (Google accepts anywhere).
- Multi-language: locale-ready SEO (hreflang scaffold) is in place; full translated content is a
  separate effort pending chosen languages.

## Backlog / Notes
- Email deliverability to hello@rajeevfreelancer.com: user must verify the domain at
  resend.com/domains, then set SENDER_EMAIL=leads@rajeevfreelancer.com and
  OWNER_EMAIL=hello@rajeevfreelancer.com in backend/.env.
- CORS_ORIGINS currently "*". For hardened prod, set to the deployed frontend origin.
- Change ADMIN_PASSWORD before going live.
- Warm-up progress is in-process (resets on backend restart); fine for on-demand use.

---

## Continuation Session — 2026-08-18 (ported into workspace)
- Uploaded `rajeev2-main` zip unpacked and ported into `/app` over the starter template (backend, frontend, design_guidelines, PRD).
- Env configured in `/app/backend/.env`: JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, EMERGENT_LLM_KEY, email + digest vars. MONGO_URL/DB_NAME preserved.
- Added frontend deps: lenis, react-fast-marquee, react-helmet-async. Added `resend` (backend).
- Verified end-to-end: backend up (8 services, 135 locations, 22 blog posts seeded), admin login works, home page renders.
- Deployment readiness: PASS (no blockers).
- Admin creds in memory/test_credentials.md.

## GEO/AEO Enhancement Session — 2026-08-18
Researched 2026 GEO/AEO + schema best practices and shipped high-impact ranking upgrades:
- robots.txt now explicitly welcomes AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot, etc.) + sitemap.
- Added public/llms.txt (markdown index of brand, services, key pages) for LLM discovery.
- Added site-wide Person schema (E-E-A-T entity: jobTitle, knowsAbout, alumniOf, sameAs) in App.js.
- Home: new visible answer-first FAQ section (8 Q&As) + FAQPage JSON-LD.
- About: new Experience/expertise cards, career timeline, FAQ section + BreadcrumbList & FAQPage JSON-LD.
- Verified JSON-LD injects cleanly per page (no duplicate entities). Frontend compiles.
Note: preview edge serves its own robots.txt (Cloudflare content-signals); our public/robots.txt applies on the deployed custom domain.
Backlog: FAQ+schema on ServicesOverview & Pricing, HowTo/Article schema on blog, GA4 wiring, review/portfolio content depth.

## FAQ/Schema + Home Animation Session — 2026-08-18
- Services page: added case-studies "Proof in numbers" section + Services FAQ (visible) with FAQPage + BreadcrumbList JSON-LD.
- Pricing page: added Pricing FAQ (visible) with FAQPage + BreadcrumbList JSON-LD.
- Blog posts: upgraded schema Article -> BlogPosting (+wordCount, inLanguage, author @id -> Person, BreadcrumbList) and added a visible byline (avatar, author, date, read-time) for E-E-A-T.
- Home animations: new Magnetic + TiltCard components; aurora hero backdrop, magnetic + shine CTAs, 3D-tilt service cards; reduced-motion guard in index.css.
- Verified per-page JSON-LD: Services/Pricing = Person+Breadcrumb+FAQPage; Blog post = BlogPosting+Breadcrumb. Frontend compiles clean; screenshots confirm rendering.
- Analytics: GA4/Ads wiring already present (initTracking/trackConversion) — user must add GA4 ID in Admin > Site Settings (user action, no code needed).

## Case Studies + Reviews + Marquee Session — 2026-08-18
- Case Studies: new data/caseStudies.js (3 studies), /case-studies index + /case-studies/:slug detail pages (Article + BreadcrumbList + CollectionPage schema, animated result counters). Routes added before catch-all in App.js. Added to backend sitemap.
- ServicesOverview proof cards now link to case-study detail pages (+ "All case studies" link).
- Testimonial motion: Home testimonials replaced with react-fast-marquee (pauseOnHover, edge fade), driven by shared REVIEWS.
- Reviews + schema: REVIEWS added in siteConfig; organizationSchema now emits AggregateRating(4.9/96) + 6 Review items (star-rating eligible). NOTE: these are curated/representative reviews — live Google review auto-sync requires Google Places API + Place ID (not wired; user to confirm if wanted).
- Google Business link now on Contact page, Home testimonials header, and Footer (GOOGLE_PROFILE in data/site.js).
- Counters already animate on scroll (Counter.jsx, useInView) — confirmed.
- Verified: frontend compiles clean; screenshots confirm all sections; per-page JSON-LD correct.

## More Case Studies + Filters + OG Images Session — 2026-08-18
- Added 3 new case studies (total 6): 42% revenue via WhatsApp (F&B), 50k+ app downloads (fitness), -38% CAC (Google Ads). Each with numbers, narrative, quote, schema.
- Added `category` field + filter chips (All/SEO/AI/Web/Marketing/App) on /case-studies index.
- Generated 6 branded OG share images (gemini-3.1-flash-image) per case study; wired into Seo image (og:image/twitter:image) on detail pages.
- Removed static og:image/twitter:image from public/index.html so react-helmet-async controls them per page (fixed duplicate og:image -> now exactly 1, correct branded image).
- Sitemap updated to all 6 case-study slugs.
- PENDING (needs user input): Live Google Reviews via Google Places API (New) — requires a server-side Google Maps Platform API key (IP-restricted, Places API New enabled) + the business Place ID. Playbook obtained.

## Nav Link + Metrics Chart + Proof Strip Session — 2026-08-18
- Nav: added "Case studies" to top nav (NAV array -> desktop + mobile menus).
- Case study detail: added animated Before/After bar chart (BeforeAfterChart in CaseStudyDetail.jsx) driven by new `chart` field per case study (before/after/suffix/prefix/higherIsBetter).
- Home: new ProofStrip component (react-fast-marquee of all 6 result metrics, each linking to its case study + "See case studies" CTA) placed under the skill marquee.
- Verified: compiles clean; screenshots confirm nav link, chart animation, and proof strip (no overlap).

## Related Cases + Home Teaser Session — 2026-08-18
- Case study detail counters: confirmed animate on scroll (Counter, verified 0->80% / 0/7->24/7).
- ServiceHub: added "Related results" section filtering CASE_STUDIES by service slug (data-testid service-related-cases) with image cards linking to detail.
- Home: added "Selected work" teaser (top 3 case studies with cover images + metrics, TiltCard) placed before testimonials.
- Verified: compiles clean; screenshots confirm all three.

## Rotation + Logos + PDF Session — 2026-08-18
- Home Selected Work now rotates: localStorage 'sw_rot' offset advances each visit, showing a fresh window of 3 case studies (useMemo).
- Home: added client/industry logos strip ("Teams & brands I've delivered for") with 6 styled representative wordmarks (data-testid home-clients). NOTE: representative brand names, not real client logos.
- Case study detail: "Download PDF" button (jsPDF) generates a clean one-page PDF from case study data (no screenshots/CORS). Verified download (~8KB). Added jspdf dependency.
- Verified: compiles clean; rotation, logos, and PDF all confirmed via automation.

## Share Buttons + Case Study CMS Session — 2026-08-18
- Case studies migrated from static frontend data to MongoDB (backend/case_seed.py seeds 6). Full CRUD:
  - Public: GET /api/case-studies (list+categories), GET /api/case-studies/{slug}.
  - Admin (JWT): GET/POST/PUT/DELETE /api/admin/case-studies. Sitemap now pulls case-study slugs from DB.
- New admin/CaseStudyManager.jsx wired into Admin dashboard (SEO Tools, Blog, Case studies, Lead Map, Site Settings all present) => strong admin panel managing SEO + leads + blog + case studies.
- Frontend public pages (CaseStudies, CaseStudyDetail, Home selected work, ProofStrip, ServiceHub related) now fetch case studies from API with static fallback.
- Share buttons on each case study: LinkedIn, WhatsApp, X, Copy link (data-testid case-share, share-linkedin/whatsapp/x/copy).
- Testing agent: 100% pass (backend pytest 10/10 + UI E2E). test creds unchanged.

## Mobile/Responsive + Floating Buttons Session — 2026-08-18
- Floating actions: Call & WhatsApp are now icon-only round buttons (side by side); Inquiry stays a labelled pill. (components/FloatingActions.jsx)
- Mobile nav: replaced dropdown panel with an app-style slide-in drawer (backdrop, logo header, large nav items w/ arrows, services grid, language chips, Get-a-quote + WhatsApp CTAs) + body scroll lock. (components/Nav.jsx)
- Verified responsive on 390px + 1440px (home, case studies).
- NOTE: object-storage helpers added to backend (server.py) but Image Uploads / Admin Case Preview / Drag Reorder were NOT completed — user redirected to the design/responsive task mid-implementation. These 3 remain pending (storage init not wired at startup; helpers are inert/harmless).

## Image Uploads + Preview + Drag Reorder + Responsive Audit — 2026-08-18
- Object storage wired: POST /api/admin/upload (admin, image only, <8MB) + public GET /api/uploads/{id}; init_storage() at startup (verified 200). Reusable admin/ImageUpload.jsx (upload or paste URL + thumbnail).
- Image uploads live in CaseStudyManager (cover + OG) and BlogManager (cover).
- Live preview panel in CaseStudyManager (case-preview / case-preview-toggle) shows the public card look before publishing.
- Drag reorder: case studies (PUT /api/admin/case-studies/reorder) and blog (PUT /api/admin/blog/reorder). Blog gained an `order` field; list/admin sorts respect it. Native HTML5 drag with grip handles.
- Responsive audit: verified 0 horizontal overflow at 390px across home/about/pricing/services/contact/service pages; floating buttons + mobile drawer consistent.
- Verified: backend curl (upload 200, serve 200), admin UI renders upload+preview+drag; frontend compiles clean.

## Google Search Console Readiness Session — 2026-09-03
Fixed all GSC indexing blockers reported by the user:
- SITEMAP "could not be read" (General HTTP error): root /sitemap.xml previously hit the React SPA and returned HTML. Added a STATIC sitemap index at frontend/public/sitemap.xml (served as application/xml, 200) that references the dynamic https://www.rajeevfreelancer.com/api/sitemap.xml. robots.txt Sitemap: now points to /sitemap.xml.
- CANONICAL www mismatch -> "Duplicate without user-selected canonical": canonical_domain changed from https://rajeevfreelancer.com to https://www.rajeevfreelancer.com in backend DEFAULT_SITE + frontend SITE_DEFAULTS. All canonicals, hreflang, OG, sitemap and IndexNow now use www consistently (matches the indexed domain).
- LEGACY 404s: App.js now redirects old URL patterns -> /services/:slug (LEGACY_SERVICE_MAP, e.g. seo->freelance-seo-expert, meta-ads->freelance-digital-marketing-consultant), /home/* and /clients/* -> /.
- SOFT 404: NotFound page now emits noindex,nofollow.
- Sitemap upgraded with <lastmod>/<changefreq>/<priority>. Now 1737 URLs.
- LOCATIONS EXPANDED: India cities 10 -> 60 (incl. Bihar: Patna, Gaya, Bhagalpur, Muzaffarpur, Darbhanga, Purnia + many tier-2/3). Added Finland, Norway, Denmark, Austria, Kuwait, Bahrain, Oman, Nepal, South Korea. CITY_MAP 135 -> 205. Location pages auto-generate on first visit + are in the sitemap. TOP_CITY_SLUGS now includes patna/jaipur/lucknow.
- Verified: /api/sitemap.xml (www, 1737 urls), /sitemap.xml root returns XML index, Patna SEO page renders AI content (Boring Road/Kankarbagh/Patliputra), /services/seo redirects to /freelance-seo-expert.

### USER ACTIONS for 100% indexing (post-deploy, on the live www domain):
1. In GSC, submit sitemap URL: https://www.rajeevfreelancer.com/sitemap.xml
2. At the HOST/DNS level, add a 301 redirect from non-www (rajeevfreelancer.com) -> www (or pick one and be consistent) so both don't index as duplicates.
3. In Admin > Site Settings, keep canonical_domain = https://www.rajeevfreelancer.com.
4. Use Admin "Warm all cities" to pre-generate AI content for all 205 x 8 pages, then IndexNow auto-pings Bing/Yandex.

## Delhi NCR Focus + Duplicate-Content Fix + Marketing Offers — 2026-09-03
- DUPLICATE CONTENT ROOT CAUSE FIXED: Seo.jsx previously emitted hreflang alternates (en/hi/ar) all pointing to the SAME URL on EVERY page — an invalid signal. Rewrote Seo.jsx: clean self-canonical (strips ?query, #hash, trailing slash), and hreflang emitted ONLY via an explicit `alternates` prop. Verified: location pages now have canonical + 0 hreflang; homepage has the correct 5-lang cluster (en/hi/ar/es/fr) + x-default. Home.jsx passes alternates.
- DELHI NCR PRIORITY: added NCR cities/localities to india (Greater Noida, Dwarka, Rohini, Saket, Nehru Place, Janakpuri, Pitampura, Lajpat Nagar, Karol Bagh, Okhla, Vasant Kunj, Rajouri Garden, Mayur Vihar, Netaji Subhash Place, Manesar, Sohna, Bahadurgarh, Sonipat, Bhiwadi, Palwal). CITY_MAP now 225 cities; sitemap 1897 URLs. TOP_CITY_SLUGS reordered to warm all Delhi NCR first.
- MARKETING OFFERS: new components/OffersStrip.jsx on the homepage (after SkillMarquee) — a brand ticker + 6 offer cards driven by OFFERS in data/site.js: Website ₹4,999 same-day, Mobile App ₹9,999 in 1 week, SEO ₹6,999/mo (90 days), AI Chatbot ₹7,999 (3 days), WhatsApp ₹2,999 (24 hrs), Google Ads ₹9,999/mo. WhatsApp "Claim your offer" CTA + per-card links to the service pages. Verified rendering (6 cards) + frontend compiles clean.

## Lead Notifications + Geo Pricing + NCR Hub + Exit Popup — 2026-09-03
- EMAIL ALERTS LIVE (Gmail SMTP): email_utils.py now supports SMTP (EMAIL_PROVIDER=gmail). Sends every lead to BOTH rajeev.gits@gmail.com + rajeev.pytech@gmail.com from er.freelancer07@gmail.com (Google App Password in backend/.env: SMTP_USER/SMTP_PASSWORD). VERIFIED: direct SMTP login+send delivered a test email to both inboxes. notify_new_lead + send_lead_digest send to OWNER_EMAILS list. Prospect confirmation also via SMTP.
- WHATSAPP LEAD ALERTS (owner's own setup): admin Site Settings has a new "WhatsApp lead alerts" group (notifications.whatsapp_enabled / whatsapp_number [prefilled +919711623561] / whatsapp_webhook_url / whatsapp_api_key). server.py notify_whatsapp_lead() POSTs each lead to the configured webhook (aliases to/number/phone + text/message + full lead; Bearer + X-API-Key headers if key set), non-blocking. Fires from create_lead. INACTIVE until the user enters their webhook URL + enables it in Admin.
- GEO PRICING: OFFERS now carry inr + usd. hooks/useOfferRegion.js hits /api/geo → INR inside India, USD elsewhere (default India). Website ₹4,999/$99, App ₹9,999/$399, SEO ₹6,999/$129·mo, AI Chatbot ₹7,999/$149, WhatsApp ₹2,999/$59, Google Ads ₹9,999/$199·mo. Applied to OffersStrip (cards + ticker), ExitIntentOffer (headline/button/lead), DelhiNCR (INR).
- NCR HUB: /delhi-ncr page (pages/DelhiNCR.jsx) — 26 NCR area cards each linking to all 8 services (strong internal linking), offers recap, why-local, FAQ + LocalBusiness/FAQ/Breadcrumb schema. In sitemap. Linked from homepage offers.
- EXIT-INTENT POPUP: components/ExitIntentOffer.jsx — mouseleave (desktop) + 30s fallback, once per session, captures name+phone -> POST /api/leads, WhatsApp fallback. Mounted site-wide (not on /admin).
- NCR warm-up run started (208 pages, background).

### Credentials note (test_credentials.md not changed): Gmail sender er.freelancer07@gmail.com uses an app password stored in backend/.env.

## Offer Countdown + Enquiry Flow Verified — 2026-09-03
- OFFER COUNTDOWN: new components/OfferCountdown.jsx — rolling 24h urgency timer (localStorage rf_offer_deadline), ticks every second, shown in OffersStrip header (light) and the exit-intent popup.
- TESTING AGENT (iteration_2.json): 100% pass. Backend pytest 6/6 (POST /api/leads for contact + exit-popup shapes, admin login, GET /api/leads listing, /api/geo, /api/sitemap.xml). Frontend: contact form submits -> lead created + thank-you; exit popup captures lead + success; offers strip 6 cards + ticking countdown + INR; /delhi-ncr 26 area cards; homepage hreflang cluster, location page canonical + no hreflang; sitemapindex + /api/sitemap.xml valid. Only a non-blocking console warning (scroll container static-position) — pre-existing, cosmetic.
- Backend test file: /app/backend/tests/test_leads_and_seo.py.

## Offer Toggle + Email Deliverability — 2026-09-03
- ADMIN OFFER TOGGLE: DEFAULT_SITE.marketing {offers_enabled, popup_enabled} + "marketing" in allowed settings. Admin > Site settings has a "Launch offers & popup" group (2 toggles). OffersStrip returns null when offers_enabled=false; ExitIntentOffer won't trigger when popup_enabled=false. Reads via useSiteSettings(). VERIFIED (iteration_3.json): OFF hides strip+popup, ON shows 6 cards+countdown+modal.
- EMAIL DELIVERABILITY (anti-spam): _send_via_smtp now sends multipart/alternative (plain-text + HTML) with Date, Message-ID, Reply-To (owner alert -> prospect email; prospect confirmation -> owner email) and X-Priority headers. Verified send OK. Guidance for user: open the first email in Gmail, tap "Not spam" + "Add to contacts" once; long-term best inbox rate needs a custom sending domain with SPF/DKIM (Gmail SMTP already DKIM-signs gmail.com).
- Enquiry regression VERIFIED: contact form + lead creation still 200, no SMTP errors. Backend test: /app/backend/tests/test_marketing_toggle.py.

## Deployment Hardening Session (2026-06)
- Re-imported uploaded zip into /app; wired backend/.env (MONGO_URL, DB_NAME, JWT_SECRET,
  EMERGENT_LLM_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, CORS_ORIGINS, email vars). Frontend .env kept.
- Installed backend + frontend deps; both services boot clean; admin/blog/case-studies seeded.
- FIXED deploy blocker: removed duplicate direct-URL `litellm` pin from requirements.txt that
  conflicted with emergentintegrations==0.2.0 (which already pulls the same wheel). Now resolves.
- ADDED /api/health endpoint (pings Mongo) for platform monitoring.
- Verified e2e via external URL: /api/health, catalog (8 services/225 locations), JWT login,
  admin stats, lead create+list, blog (22), case-studies (6), settings. Homepage renders.
- deployment_agent: PASS (no blockers).
- Recommendations left for user (not blockers): set CORS_ORIGINS to the real deployed domain
  (currently "*"); add RESEND_API_KEY to enable lead emails (blank = emails skipped gracefully);
  rotate JWT_SECRET/admin password if repo history was ever public; optional rate limiting on
  /api/auth/login and write endpoints.

## SEO + Responsiveness Pass (2026-06)
- Verified offer/marketing popup control panel lives in backend admin (Site settings →
  "Launch offers & popup": offers_enabled, popup_enabled, offers_end_date). Stored in Mongo
  settings key "site", served via GET /api/settings; ExitIntentOffer + OffersStrip respect it.
  Testing agent: 34/34 backend tests pass; admin login + toggle + public gating verified.
- SEO audit (already strong): per-route <title>/description/canonical (cleaned)/robots/hreflang/
  OG/Twitter + JSON-LD (Organization, Person, WebSite, LocalBusiness, Service, FAQ, Breadcrumb)
  via react-helmet-async Seo component on every route. robots.txt comprehensive (bots + AI
  crawlers + sitemap). Dynamic /api/sitemap.xml lists all services/cities/blog/case-studies;
  static /sitemap.xml is a sitemap index. All 21 <img> have alt.
- IMPROVED: static public/index.html now ships default canonical + robots(max-image-preview) +
  full Open Graph + Twitter card + apple-touch-icon + manifest link (so non-JS/social crawlers
  get proper defaults before React/Helmet runs). Added public/manifest.json (PWA/mobile SEO).
  Added og:image/robots/twitter to LangLanding (/hi /ar /es /fr).
- Responsive: Nav has mobile hamburger (md:hidden) + full-screen menu; 368 responsive breakpoint
  utilities; all containers max-w-[1400px] mx-auto with px-5 md:px-10 (no fixed-width overflow).
- Production `yarn build` compiles clean (35s) with new meta baked in.
- CAVEAT (honest): this is a CRA SPA — Googlebot renders JS so on-page SEO is complete, but the
  ~1800 programmatic location pages fetch content client-side. For guaranteed crawler parity /
  literal "100%" on those money pages, prerendering (react-snap) or SSR (Next.js) is the next
  architectural step. Not done automatically (high risk on React 19 + framer-motion + lenis).

## Iteration: Lead delete + Search Console + Prerender findings (2026-06)
- ADDED DELETE /api/leads/{id} (admin JWT) + admin UI trash button per lead row (removeLead,
  window.confirm, optimistic remove). Testing: 41/41 backend pass, frontend flow verified.
- ADDED Google Search Console verification: seo.google_verification field in DEFAULT_SITE +
  admin Site Settings ("SEO defaults" group, data-testid settings-seo-google_verification);
  Seo.jsx emits <meta name="google-site-verification"> when set. Verified persists + renders.
- PRERENDER/SSR (items 1 & 2) — DECISION: NOT implemented in code. Confirmed with platform
  support: Emergent serves CRA builds via Cloudflare with a blanket SPA fallback (all non-/api
  routes -> root index.html), so custom build-time prerender (react-snap/puppeteer) is DISCARDED
  and cannot work. Emergent instead provides a BUILT-IN Cloudflare crawler-prerender layer
  ("Enable Search Engine Crawling and Optimisation" toggle in Domain tab, ON by default) that
  serves fully-rendered HTML (incl. the 1,800 client-fetched location pages) to Googlebot/Bingbot,
  cached 30 days. For guaranteed always-on SSR, the only true route is a Next.js `farmnext`
  rebuild as a NEW job (mid-dev stack change not supported). Communicated to user.
- Known LOW/cosmetic (pre-existing, not blocking, not from these changes): (1) a "<span> cannot be
  a child of <option>" React console warning on /admin; (2) native date input for offers auto-off.

## Iteration: Auto Sitemap Ping (2026-06)
- Extended IndexNow auto-ping to fire on blog UPDATE and case-study UPDATE (previously only on
  create). Full coverage now: location page generation, warmup, blog/case-study create+update,
  admin manual submit. Verified firing via logs (preview returns 422 because the key file must be
  hosted at the real canonical domain; resolves automatically post-deploy via GET /api/indexnow-key).
- IndexNow notifies the shared network (Bing, Yandex, Seznam, Naver, Yep). Google does NOT
  participate in IndexNow and removed its sitemap-ping endpoint (2023) -> Google is covered by the
  always-fresh dynamic sitemap (lastmod per URL) + Search Console submission. Communicated to user.
- Next.js SSR rebuild: NOT done (mid-dev CRA->Next stack change unsupported / breaks deploy).
  Requires a fresh `farmnext` project. Advised user accordingly.

## Iteration: IndexNow Status Panel (2026-06)
- Backend: ping_indexnow now records {at,count,status,ok,urls} to settings key "indexnow" as
  last_ping + capped history (last 15). GET /api/admin/indexnow returns last_ping + history
  (newest first). Verified via curl (records 422 on preview as expected).
- Frontend: SeoTools.jsx IndexNow panel now shows "Last notification sent" (Delivered/HTTP code
  badge, URL count, relative time) + collapsible "Recent pings" history. data-testids:
  indexnow-status, indexnow-last-result, indexnow-last-time, indexnow-history, indexnow-status-empty.
  Toggle/submit preserve+refresh status. Compiles clean.
- Next.js SSR rebuild: still NOT done in-place (would break CRA deploy). Recommend user open a NEW
  project with the farmnext (Next.js) template; offered to port frontend + reuse this FastAPI backend there.

## Iteration: Next.js handoff + Crawler SEO guidance (2026-06)
- No app code changed. Next.js SSR requires a NEW Emergent project (farmnext template; permanent
  per job). Provided authoritative platform steps + created /app/memory/MIGRATION_TO_NEXTJS.md
  (full route map, all /api endpoints, SSR/ISR strategy, env vars, SEO parity checklist, DB-reuse
  options) to upload/reference in the new Next.js job for porting the frontend + reusing this backend.
- Crawler SEO confirmation remains a post-deploy manual check (Domain tab crawling toggle ON +
  GSC URL Inspection on a city page).

## Iteration: SEO / Core Web Vitals polish (2026-06)
- Audit confirmed on-page SEO is already best-practice (per-route meta, canonical, hreflang,
  OG/Twitter, JSON-LD: ProfessionalService+AggregateRating+Review, Person/E-E-A-T, WebSite,
  Breadcrumb, Service, LocalBusiness, FAQPage; robots.txt; dynamic sitemap; IndexNow; all imgs
  have alt; 1 H1/page; strong internal linking + visible breadcrumbs on location pages).
- ADDED Core Web Vitals wins: preconnect/dns-prefetch to fonts.gstatic, image CDN & Unsplash in
  index.html; loading="lazy" + decoding="async" on below-fold images (BlogIndex, BlogPost related,
  Home blog+about); decoding="async" fetchpriority="high" on hero/LCP images (ServiceHub, BlogPost
  cover, CaseStudyDetail cover, About). Compiles clean; homepage verified.
- Note (Google policy): self-hosted AggregateRating/Review on the org's own site is generally NOT
  eligible for star rich results in Google (self-serving reviews). Schema kept (valid & useful for
  other engines/AI); real SERP stars require third-party review platforms.
- Recommend user set GA4 ID (admin tracking field) + paste GSC verification code (already wired).

## Iteration: Blog Autopilot + Analytics + fixes (2026-06)
- Connect Analytics: ALREADY wired — GA4 Measurement ID + Google Ads (tracking.ga4_id/ads_id),
  Google Search Console verification (seo.google_verification) all editable in admin Site settings;
  gtag + verification meta auto-inject. User just pastes their IDs. No code needed.
- Blog Autopilot (NEW): backend scheduler (_blog_autopilot_scheduler, launched on startup) + LLM
  generator (generate_blog_post via emergentintegrations LlmChat gemini-3-flash-preview,
  EMERGENT_LLM_KEY). 56-topic rotation (8 services x 7 angles), dedupes by slug, assigns cover,
  pings IndexNow on publish. Endpoints: GET/PUT /api/admin/blog-autopilot, POST .../run.
  Admin UI in BlogManager.jsx: enable toggle, frequency (weekly/2wk/monthly), auto-publish toggle,
  "Generate a post now" button + status (next topic/generated count/last run/next scheduled).
  Testing agent iteration_3: backend 47/49 (2 fails were the legacy dirty-slug data, now fixed),
  frontend 100%. Generated posts are genuine 8-12 paragraph SEO articles, published + public.
- FIXES from test report: (1) _slug() now strips all punctuation (keeps unicode letters) — clean
  URLs; (2) one-time _reslug_content() migration on startup cleaned legacy dirty slugs (verified 0
  dirty slugs remain); (3) autopilot PUT now returns enriched view (next_topic/next_run) so status
  row doesn't blank after save; (4) fetchpriority -> fetchPriority (React DOM prop) on 4 hero imgs.
- Known non-issue: "<span> in <option>" console warning on /admin is from an injected/preview
  script, NOT our code (all our <option> tags are plain text) — no SEO/functional impact.

## Iteration: Home + Delhi NCR local ranking boost (2026-06)
- HOME local SEO: title/description now carry a Delhi NCR / Gurgaon signal (kept global reach);
  added LocalBusiness JSON-LD (Gurgaon, areaServed = 6 NCR cities, 3 reviews + AggregateRating).
- HOME internal linking (was the biggest gap — home never linked to /delhi-ncr): new visible
  "Local to Delhi NCR" band (data-testid home-local-ncr) with a CTA to the /delhi-ncr hub, 8
  exact-match keyword chips (e.g. "Web developer in Gurgaon" → /freelance-website-developer/
  gurgaon-india) and 12 NCR area quick-links → passes link equity to the programmatic pages.
- DELHI NCR page: localBusinessSchema now emits Review[] + areaServed[]; added visible
  breadcrumb (ncr-breadcrumb), a "Popular local searches" block of 10 exact-match keyword anchor
  links (ncr-popular-searches), and a 3-card local reviews section (ncr-reviews).
- siteConfig.localBusinessSchema extended: optional `areaServed` (array) + `reviews` params.
- Verified: frontend compiles clean; /delhi-ncr breadcrumb + new sections render; home band + new
  meta live. Additive-only (no backend changes).

## Iteration: AI Topic Suggestions + Bulk Publish + polish (2026-06)
- AI Topic Suggestions: POST /api/admin/blog-autopilot/suggest returns 8 unique LLM ideas (Gemini,
  ~10-15s); BlogManager renders tappable chips → tap adds to custom_topics queue.
- Bulk Publish: POST /api/admin/blog/bulk-publish (now a Pydantic BulkPublishInput model:
  ids: List[str], published: bool) — per-row checkboxes + select-all + "Publish selected" /
  "Move to draft"; pings IndexNow on publish. Bad types now 422 (was silently str()-cast).
- POLISH (iteration_5 optional items, done): suggestion chip removed only AFTER the queue PUT
  succeeds (idea no longer lost if save fails); duplicate idea shows an info toast "Already in
  your queue" instead of silently disappearing.
- Testing: iteration_5.json 100% backend + 100% frontend. Post-polish self-test: bulk-publish
  empty→400, bad-type→422, unknown ids→200 updated:0; frontend compiles clean.

## Iteration: Autopilot custom topics + one-click publish (2026-06)
- Custom topics: autopilot settings gained custom_topics[] (dedup/trim/cap 50). Generation uses the
  first custom topic first, then removes it from the queue; falls back to the default 56-topic
  rotation when empty. next_topic reflects the first custom topic. Admin UI: textarea
  (autopilot-custom-topics) + Save ideas (autopilot-save-topics) in the Blog Autopilot panel.
- Review-before-publish: existing auto_publish=off saves drafts; NEW one-click approve via
  PATCH /api/admin/blog/{id}/publish + per-row Publish/Live toggle button (blog-publish-<slug>).
  Publishing pings IndexNow.
- Testing iteration_4: backend 68/68 (new test_autopilot_topics_and_publish.py, incl. real Gemini
  gen), frontend 100%. Pre-existing LOW cosmetics only (injected-script <option> warning; native
  date input) — non-issues.
- Next.js SSR port: still requires a NEW farmnext project (handoff doc at memory/MIGRATION_TO_NEXTJS.md).
